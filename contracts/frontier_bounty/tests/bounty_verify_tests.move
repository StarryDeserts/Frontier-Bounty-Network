#[test_only]
module frontier_bounty::bounty_verify_tests;

use frontier_bounty::bounty_registry::{Self, Bounty, BountyBoard, HunterBadge};
use frontier_bounty::bounty_verify::{Self, ClaimRegistry, KillProof, KillProofIssuerCap};

use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::object;
use sui::sui::SUI;
use sui::test_scenario;
use sui::transfer;

const ISSUER: address = @0xF00D;
const CREATOR: address = @0xA11CE;
const TARGET: address = @0xB0B;
const HUNTER: address = @0xC0FFEE;
const SWEEPER: address = @0xD00D;

fun setup_shared_state(scenario: &mut test_scenario::Scenario) {
    let board = bounty_registry::new_board_for_testing(test_scenario::ctx(scenario));
    bounty_registry::share_board_for_testing(board);
    let claim_registry = bounty_verify::new_claim_registry_for_testing(test_scenario::ctx(scenario));
    bounty_verify::share_claim_registry_for_testing(claim_registry);
    let clock = clock::create_for_testing(test_scenario::ctx(scenario));
    clock::share_for_testing(clock);
    let issuer_cap = bounty_verify::new_kill_proof_issuer_cap_for_testing(test_scenario::ctx(scenario));
    transfer::public_transfer(issuer_cap, ISSUER);
}

#[test]
fun issue_kill_proof_creates_owned_proof() {
    let mut scenario = test_scenario::begin(ISSUER);

    let issuer_cap = bounty_verify::new_kill_proof_issuer_cap_for_testing(test_scenario::ctx(&mut scenario));
    transfer::public_transfer(issuer_cap, ISSUER);

    test_scenario::next_tx(&mut scenario, ISSUER);
    {
        let issuer_cap: KillProofIssuerCap = test_scenario::take_from_sender(&scenario);

        bounty_verify::issue_kill_proof(
            &issuer_cap,
            HUNTER,
            HUNTER,
            TARGET,
            123,
            42,
            b"digest-issued-proof",
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_to_sender(&scenario, issuer_cap);
    };

    test_scenario::next_tx(&mut scenario, HUNTER);
    {
        let kill_proof: KillProof = test_scenario::take_from_sender(&scenario);
        assert!(bounty_verify::kill_proof_killer(&kill_proof) == HUNTER);
        assert!(bounty_verify::kill_proof_victim(&kill_proof) == TARGET);
        assert!(bounty_verify::kill_proof_timestamp(&kill_proof) == 123);
        assert!(bounty_verify::kill_proof_solar_system_id(&kill_proof) == 42);
        assert!(bounty_verify::kill_proof_digest(&kill_proof) == b"digest-issued-proof");
        bounty_verify::destroy_kill_proof_for_testing(kill_proof);
    };

    test_scenario::end(scenario);
}

#[test]
fun issue_kill_proof_and_claim_happy_path() {
    let mut scenario = test_scenario::begin(ISSUER);
    setup_shared_state(&mut scenario);

    test_scenario::next_tx(&mut scenario, CREATOR);
    {
        let mut board: BountyBoard = test_scenario::take_shared(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);
        let payment: Coin<SUI> = coin::mint_for_testing(5_000_000, test_scenario::ctx(&mut scenario));

        bounty_registry::create_bounty(
            &mut board,
            payment,
            TARGET,
            2,
            b"hunt-target",
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_shared(board);
        test_scenario::return_shared(clock);
    };

    let bounty_id = {
        test_scenario::next_tx(&mut scenario, CREATOR);
        let bounty: Bounty = test_scenario::take_shared(&scenario);
        let bounty_id = object::id(&bounty);
        test_scenario::return_shared(bounty);
        bounty_id
    };

    test_scenario::next_tx(&mut scenario, HUNTER);
    bounty_registry::register_hunter(test_scenario::ctx(&mut scenario));

    test_scenario::next_tx(&mut scenario, ISSUER);
    {
        let issuer_cap: KillProofIssuerCap = test_scenario::take_from_sender(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);

        bounty_verify::issue_kill_proof(
            &issuer_cap,
            HUNTER,
            HUNTER,
            TARGET,
            clock::timestamp_ms(&clock),
            42,
            b"digest-claim-happy",
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_to_sender(&scenario, issuer_cap);
        test_scenario::return_shared(clock);
    };

    test_scenario::next_tx(&mut scenario, HUNTER);
    {
        let mut board: BountyBoard = test_scenario::take_shared(&scenario);
        let mut bounty: Bounty = test_scenario::take_shared_by_id(&scenario, bounty_id);
        let mut registry: ClaimRegistry = test_scenario::take_shared(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);
        let mut badge: HunterBadge = test_scenario::take_from_sender(&scenario);
        let kill_proof: KillProof = test_scenario::take_from_sender(&scenario);

        bounty_verify::claim_bounty(
            &mut board,
            &mut bounty,
            kill_proof,
            &mut registry,
            &mut badge,
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        assert!(bounty_registry::bounty_status(&bounty) == bounty_registry::status_claimed());
        assert!(bounty_registry::active_count(&board) == 0);

        test_scenario::return_shared(board);
        test_scenario::return_shared(bounty);
        test_scenario::return_shared(registry);
        test_scenario::return_shared(clock);
        test_scenario::return_to_sender(&scenario, badge);
    };

    test_scenario::next_tx(&mut scenario, HUNTER);
    {
        let badge: HunterBadge = test_scenario::take_from_sender(&scenario);
        assert!(bounty_registry::hunter_kills(&badge) == 1);
        assert!(bounty_registry::hunter_total_earnings(&badge) == 5_000_000);
        test_scenario::return_to_sender(&scenario, badge);

        let reward: Coin<SUI> = test_scenario::take_from_sender(&scenario);
        assert!(coin::value(&reward) == 5_000_000);
        let _ = coin::burn_for_testing(reward);
    };

    test_scenario::end(scenario);
}

#[test, expected_failure(abort_code = 207)]
fun issue_kill_proof_with_recipient_mismatch_fails() {
    let mut scenario = test_scenario::begin(ISSUER);

    let issuer_cap = bounty_verify::new_kill_proof_issuer_cap_for_testing(test_scenario::ctx(&mut scenario));
    transfer::public_transfer(issuer_cap, ISSUER);

    test_scenario::next_tx(&mut scenario, ISSUER);
    {
        let issuer_cap: KillProofIssuerCap = test_scenario::take_from_sender(&scenario);
        bounty_verify::issue_kill_proof(
            &issuer_cap,
            CREATOR,
            HUNTER,
            TARGET,
            1,
            7,
            b"digest-recipient-mismatch",
            test_scenario::ctx(&mut scenario),
        );
        test_scenario::return_to_sender(&scenario, issuer_cap);
    };

    test_scenario::end(scenario);
}

#[test, expected_failure(abort_code = 206)]
fun reused_kill_digest_fails_on_second_claim() {
    let mut scenario = test_scenario::begin(ISSUER);
    setup_shared_state(&mut scenario);

    test_scenario::next_tx(&mut scenario, CREATOR);
    {
        let mut board: BountyBoard = test_scenario::take_shared(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);
        let payment: Coin<SUI> = coin::mint_for_testing(3_000_000, test_scenario::ctx(&mut scenario));

        bounty_registry::create_bounty(
            &mut board,
            payment,
            TARGET,
            2,
            b"first-bounty",
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_shared(board);
        test_scenario::return_shared(clock);
    };

    let bounty_a_id = {
        test_scenario::next_tx(&mut scenario, CREATOR);
        let bounty: Bounty = test_scenario::take_shared(&scenario);
        let bounty_id = object::id(&bounty);
        test_scenario::return_shared(bounty);
        bounty_id
    };

    test_scenario::next_tx(&mut scenario, HUNTER);
    bounty_registry::register_hunter(test_scenario::ctx(&mut scenario));

    test_scenario::next_tx(&mut scenario, ISSUER);
    {
        let issuer_cap: KillProofIssuerCap = test_scenario::take_from_sender(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);

        bounty_verify::issue_kill_proof(
            &issuer_cap,
            HUNTER,
            HUNTER,
            TARGET,
            clock::timestamp_ms(&clock),
            42,
            b"digest-reused-proof",
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_to_sender(&scenario, issuer_cap);
        test_scenario::return_shared(clock);
    };

    test_scenario::next_tx(&mut scenario, HUNTER);
    {
        let mut board: BountyBoard = test_scenario::take_shared(&scenario);
        let mut bounty_a: Bounty = test_scenario::take_shared_by_id(&scenario, bounty_a_id);
        let mut registry: ClaimRegistry = test_scenario::take_shared(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);
        let mut badge: HunterBadge = test_scenario::take_from_sender(&scenario);
        let kill_proof: KillProof = test_scenario::take_from_sender(&scenario);

        bounty_verify::claim_bounty(
            &mut board,
            &mut bounty_a,
            kill_proof,
            &mut registry,
            &mut badge,
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_shared(board);
        test_scenario::return_shared(bounty_a);
        test_scenario::return_shared(registry);
        test_scenario::return_shared(clock);
        test_scenario::return_to_sender(&scenario, badge);
    };

    test_scenario::next_tx(&mut scenario, HUNTER);
    {
        let badge: HunterBadge = test_scenario::take_from_sender(&scenario);
        let reward: Coin<SUI> = test_scenario::take_from_sender(&scenario);
        let _ = coin::burn_for_testing(reward);
        test_scenario::return_to_sender(&scenario, badge);
    };

    test_scenario::next_tx(&mut scenario, CREATOR);
    {
        let mut board: BountyBoard = test_scenario::take_shared(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);
        let payment: Coin<SUI> = coin::mint_for_testing(4_000_000, test_scenario::ctx(&mut scenario));

        bounty_registry::create_bounty(
            &mut board,
            payment,
            TARGET,
            2,
            b"second-bounty",
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_shared(board);
        test_scenario::return_shared(clock);
    };

    let bounty_b_id = {
        test_scenario::next_tx(&mut scenario, CREATOR);
        let bounty: Bounty = test_scenario::take_shared(&scenario);
        let bounty_id = object::id(&bounty);
        test_scenario::return_shared(bounty);
        bounty_id
    };

    test_scenario::next_tx(&mut scenario, ISSUER);
    {
        let issuer_cap: KillProofIssuerCap = test_scenario::take_from_sender(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);

        bounty_verify::issue_kill_proof(
            &issuer_cap,
            HUNTER,
            HUNTER,
            TARGET,
            clock::timestamp_ms(&clock),
            43,
            b"digest-reused-proof",
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_to_sender(&scenario, issuer_cap);
        test_scenario::return_shared(clock);
    };

    test_scenario::next_tx(&mut scenario, HUNTER);
    {
        let mut board: BountyBoard = test_scenario::take_shared(&scenario);
        let mut bounty_b: Bounty = test_scenario::take_shared_by_id(&scenario, bounty_b_id);
        let mut registry: ClaimRegistry = test_scenario::take_shared(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);
        let mut badge: HunterBadge = test_scenario::take_from_sender(&scenario);
        let kill_proof: KillProof = test_scenario::take_from_sender(&scenario);

        bounty_verify::claim_bounty(
            &mut board,
            &mut bounty_b,
            kill_proof,
            &mut registry,
            &mut badge,
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_shared(board);
        test_scenario::return_shared(bounty_b);
        test_scenario::return_shared(registry);
        test_scenario::return_shared(clock);
        test_scenario::return_to_sender(&scenario, badge);
    };

    test_scenario::end(scenario);
}

#[test, expected_failure(abort_code = 200)]
fun claim_bounty_with_wrong_victim_fails() {
    let mut scenario = test_scenario::begin(CREATOR);
    setup_shared_state(&mut scenario);

    test_scenario::next_tx(&mut scenario, CREATOR);
    {
        let mut board: BountyBoard = test_scenario::take_shared(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);
        let payment: Coin<SUI> = coin::mint_for_testing(3_000_000, test_scenario::ctx(&mut scenario));

        bounty_registry::create_bounty(
            &mut board,
            payment,
            TARGET,
            2,
            b"wrong-victim",
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_shared(board);
        test_scenario::return_shared(clock);
    };

    let bounty_id = {
        test_scenario::next_tx(&mut scenario, CREATOR);
        let bounty: Bounty = test_scenario::take_shared(&scenario);
        let bounty_id = object::id(&bounty);
        test_scenario::return_shared(bounty);
        bounty_id
    };

    test_scenario::next_tx(&mut scenario, HUNTER);
    bounty_registry::register_hunter(test_scenario::ctx(&mut scenario));

    test_scenario::next_tx(&mut scenario, HUNTER);
    {
        let mut board: BountyBoard = test_scenario::take_shared(&scenario);
        let mut bounty: Bounty = test_scenario::take_shared_by_id(&scenario, bounty_id);
        let mut registry: ClaimRegistry = test_scenario::take_shared(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);
        let mut badge: HunterBadge = test_scenario::take_from_sender(&scenario);

        let kill_proof = bounty_verify::new_kill_proof_for_testing(
            HUNTER,
            @0xDEAD,
            clock::timestamp_ms(&clock),
            9,
            b"digest-claim-fail",
            test_scenario::ctx(&mut scenario),
        );

        bounty_verify::claim_bounty(
            &mut board,
            &mut bounty,
            kill_proof,
            &mut registry,
            &mut badge,
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_shared(board);
        test_scenario::return_shared(bounty);
        test_scenario::return_shared(registry);
        test_scenario::return_shared(clock);
        test_scenario::return_to_sender(&scenario, badge);
    };

    test_scenario::end(scenario);
}

#[test]
fun sweep_expired_bounty_happy_path() {
    let mut scenario = test_scenario::begin(CREATOR);

    let board = bounty_registry::new_board_for_testing(test_scenario::ctx(&mut scenario));
    bounty_registry::share_board_for_testing(board);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    clock::share_for_testing(clock);

    test_scenario::next_tx(&mut scenario, CREATOR);
    {
        let mut board: BountyBoard = test_scenario::take_shared(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);
        let payment: Coin<SUI> = coin::mint_for_testing(4_000_000, test_scenario::ctx(&mut scenario));

        bounty_registry::create_bounty(
            &mut board,
            payment,
            TARGET,
            1,
            b"to-expire",
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_shared(board);
        test_scenario::return_shared(clock);
    };

    let bounty_id = {
        test_scenario::next_tx(&mut scenario, CREATOR);
        let bounty: Bounty = test_scenario::take_shared(&scenario);
        let bounty_id = object::id(&bounty);
        test_scenario::return_shared(bounty);
        bounty_id
    };

    test_scenario::next_tx(&mut scenario, CREATOR);
    {
        let mut clock: Clock = test_scenario::take_shared(&scenario);
        clock::increment_for_testing(&mut clock, 3_700_000);
        test_scenario::return_shared(clock);
    };

    test_scenario::next_tx(&mut scenario, SWEEPER);
    {
        let mut board: BountyBoard = test_scenario::take_shared(&scenario);
        let mut bounty: Bounty = test_scenario::take_shared_by_id(&scenario, bounty_id);
        let clock: Clock = test_scenario::take_shared(&scenario);

        bounty_verify::sweep_expired(
            &mut board,
            &mut bounty,
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        assert!(bounty_registry::bounty_status(&bounty) == bounty_registry::status_expired());
        assert!(bounty_registry::active_count(&board) == 0);

        test_scenario::return_shared(board);
        test_scenario::return_shared(bounty);
        test_scenario::return_shared(clock);
    };

    test_scenario::next_tx(&mut scenario, CREATOR);
    {
        let refunded: Coin<SUI> = test_scenario::take_from_sender(&scenario);
        assert!(coin::value(&refunded) == 4_000_000);
        let _ = coin::burn_for_testing(refunded);
    };

    test_scenario::end(scenario);
}
