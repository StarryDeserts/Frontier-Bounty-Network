module frontier_bounty::bounty_verify;

use sui::clock::{Self, Clock};
use sui::event;
use sui::object::{Self, ID, UID};
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

use frontier_bounty::bounty_registry::{Self, Bounty, BountyBoard, HunterBadge};

const E_TARGET_MISMATCH: u64 = 200;
const E_BOUNTY_EXPIRED: u64 = 201;
const E_BOUNTY_NOT_ACTIVE: u64 = 202;
const E_HUNTER_IS_TARGET: u64 = 203;
const E_HUNTER_IS_CREATOR: u64 = 204;
const E_INVALID_KILL_PROOF: u64 = 205;
const E_KILL_PROOF_USED: u64 = 206;
const E_RECIPIENT_KILLER_MISMATCH: u64 = 207;

// Temporary centralized trust point for production proof issuance.
// The package publisher receives this cap at publish time and is responsible for
// verifying off-chain kill records before minting KillProof objects.
public struct KillProofIssuerCap has key, store {
    id: UID,
}

// Production claim payload. The verifier currently binds claims to killer, victim,
// a provider-derived timestamp/system tuple, and a canonical kill digest.
public struct KillProof has key, store {
    id: UID,
    killer: address,
    victim: address,
    timestamp: u64,
    solar_system_id: u64,
    kill_digest: vector<u8>,
}

public struct ClaimRegistry has key {
    id: UID,
    used_proofs: Table<vector<u8>, bool>,
}

public struct KillProofIssuedEvent has copy, drop {
    kill_proof_id: ID,
    issuer: address,
    recipient: address,
    killer: address,
    victim: address,
    timestamp: u64,
    solar_system_id: u64,
    kill_digest: vector<u8>,
}

public struct BountyVerifiedEvent has copy, drop {
    bounty_id: ID,
    kill_proof_id: ID,
    hunter: address,
    target: address,
    reward_amount: u64,
    solar_system_id: u64,
    kill_digest: vector<u8>,
}

fun init(ctx: &mut TxContext) {
    let registry = ClaimRegistry {
        id: object::new(ctx),
        used_proofs: table::new(ctx),
    };
    let issuer_cap = KillProofIssuerCap {
        id: object::new(ctx),
    };

    transfer::share_object(registry);
    transfer::transfer(issuer_cap, tx_context::sender(ctx));
}

public entry fun issue_kill_proof(
    issuer_cap: &KillProofIssuerCap,
    recipient: address,
    killer: address,
    victim: address,
    timestamp: u64,
    solar_system_id: u64,
    kill_digest: vector<u8>,
    ctx: &mut TxContext,
) {
    let _issuer_cap_id = object::id(issuer_cap);
    assert!(recipient == killer, E_RECIPIENT_KILLER_MISMATCH);

    let issuer = tx_context::sender(ctx);
    let kill_proof = KillProof {
        id: object::new(ctx),
        killer,
        victim,
        timestamp,
        solar_system_id,
        kill_digest,
    };
    let kill_proof_id = object::id(&kill_proof);

    event::emit(KillProofIssuedEvent {
        kill_proof_id,
        issuer,
        recipient,
        killer,
        victim,
        timestamp,
        solar_system_id,
        kill_digest: kill_proof_digest(&kill_proof),
    });

    transfer::public_transfer(kill_proof, recipient);
}

public entry fun claim_bounty(
    board: &mut BountyBoard,
    bounty: &mut Bounty,
    kill_proof: KillProof,
    claim_registry: &mut ClaimRegistry,
    hunter_badge: &mut HunterBadge,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let hunter = tx_context::sender(ctx);

    assert!(
        bounty_registry::bounty_status(bounty) == bounty_registry::status_active(),
        E_BOUNTY_NOT_ACTIVE,
    );
    assert!(!bounty_registry::is_expired(bounty, clock), E_BOUNTY_EXPIRED);
    assert!(kill_proof.victim == bounty_registry::bounty_target(bounty), E_TARGET_MISMATCH);
    assert!(kill_proof.killer == hunter, E_INVALID_KILL_PROOF);
    assert!(hunter != kill_proof.victim, E_HUNTER_IS_TARGET);
    assert!(hunter != bounty_registry::bounty_creator(bounty), E_HUNTER_IS_CREATOR);

    let digest = kill_proof_digest(&kill_proof);
    assert!(!table::contains(&claim_registry.used_proofs, digest), E_KILL_PROOF_USED);
    table::add(&mut claim_registry.used_proofs, kill_proof_digest(&kill_proof), true);

    let reward_amount = bounty_registry::bounty_reward(bounty);
    let bounty_id = object::id(bounty);
    let kill_proof_id = object::id(&kill_proof);
    let now = clock::timestamp_ms(clock);

    let reward_coin = bounty_registry::release_reward_to_hunter(bounty, hunter, ctx);
    transfer::public_transfer(reward_coin, hunter);

    bounty_registry::mark_claimed(board, bounty, hunter, now);
    bounty_registry::update_hunter_stats(hunter_badge, hunter, reward_amount, now);

    event::emit(BountyVerifiedEvent {
        bounty_id,
        kill_proof_id,
        hunter,
        target: kill_proof.victim,
        reward_amount,
        solar_system_id: kill_proof.solar_system_id,
        kill_digest: kill_proof_digest(&kill_proof),
    });

    let KillProof {
        id,
        killer: _,
        victim: _,
        timestamp: _,
        solar_system_id: _,
        kill_digest: _,
    } = kill_proof;
    object::delete(id);
}

public entry fun sweep_expired(
    board: &mut BountyBoard,
    bounty: &mut Bounty,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(
        bounty_registry::bounty_status(bounty) == bounty_registry::status_active(),
        E_BOUNTY_NOT_ACTIVE,
    );
    assert!(bounty_registry::is_expired(bounty, clock), E_BOUNTY_EXPIRED);

    let (refund_coin, creator, refund_amount) = bounty_registry::refund_to_creator(bounty, ctx);
    transfer::public_transfer(refund_coin, creator);

    bounty_registry::mark_expired(board, bounty, refund_amount);
}

public fun is_used(registry: &ClaimRegistry, kill_digest: vector<u8>): bool {
    table::contains(&registry.used_proofs, kill_digest)
}

public fun kill_proof_killer(kill_proof: &KillProof): address {
    kill_proof.killer
}

public fun kill_proof_victim(kill_proof: &KillProof): address {
    kill_proof.victim
}

public fun kill_proof_timestamp(kill_proof: &KillProof): u64 {
    kill_proof.timestamp
}

public fun kill_proof_solar_system_id(kill_proof: &KillProof): u64 {
    kill_proof.solar_system_id
}

public fun kill_proof_digest(kill_proof: &KillProof): vector<u8> {
    kill_proof.kill_digest
}

#[test_only]
public fun new_claim_registry_for_testing(ctx: &mut TxContext): ClaimRegistry {
    ClaimRegistry {
        id: object::new(ctx),
        used_proofs: table::new(ctx),
    }
}

#[test_only]
public fun new_kill_proof_issuer_cap_for_testing(ctx: &mut TxContext): KillProofIssuerCap {
    KillProofIssuerCap {
        id: object::new(ctx),
    }
}

#[test_only]
public fun new_kill_proof_for_testing(
    killer: address,
    victim: address,
    timestamp: u64,
    solar_system_id: u64,
    kill_digest: vector<u8>,
    ctx: &mut TxContext,
): KillProof {
    KillProof {
        id: object::new(ctx),
        killer,
        victim,
        timestamp,
        solar_system_id,
        kill_digest,
    }
}

#[test_only]
public fun destroy_kill_proof_for_testing(kill_proof: KillProof) {
    let KillProof {
        id,
        killer: _,
        victim: _,
        timestamp: _,
        solar_system_id: _,
        kill_digest: _,
    } = kill_proof;
    object::delete(id);
}

#[test_only]
public fun share_claim_registry_for_testing(registry: ClaimRegistry) {
    transfer::share_object(registry);
}
