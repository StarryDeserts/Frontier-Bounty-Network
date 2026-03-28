module frontier_bounty::bounty_registry;

use std::option::{Self, Option};
use std::vector;

use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, ID, UID};
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

use frontier_bounty::bounty_escrow;

const E_NOT_BOUNTY_CREATOR: u64 = 0;
const E_BOUNTY_EXPIRED: u64 = 1;
const E_BOUNTY_NOT_ACTIVE: u64 = 2;
const E_SELF_BOUNTY: u64 = 4;
const E_MIN_REWARD: u64 = 6;
const E_INVALID_DURATION: u64 = 7;
const E_INVALID_STATE: u64 = 8;
const E_INVALID_BADGE_OWNER: u64 = 9;

const MIN_REWARD_AMOUNT: u64 = 1_000_000;

const STATUS_ACTIVE: u8 = 0;
const STATUS_CLAIMED: u8 = 1;
const STATUS_CANCELLED: u8 = 2;
const STATUS_EXPIRED: u8 = 3;

public struct BountyBoard has key {
    id: UID,
    active_count: u64,
    total_bounties_created: u64,
    total_rewards_paid: u64,
    target_index: Table<address, vector<ID>>,
    // Runtime aggregation so turret/gate checks are O(1).
    target_total_active_reward: Table<address, u64>,
}

public struct Bounty has key, store {
    id: UID,
    creator: address,
    target: address,
    reward_amount: u64,
    status: u8,
    created_at: u64,
    expires_at: u64,
    description: vector<u8>,
    claimed_by: Option<address>,
    claimed_at: Option<u64>,
}

public struct HunterBadge has key, store {
    id: UID,
    hunter: address,
    kills: u64,
    total_earnings: u64,
    streak: u64,
    max_streak: u64,
    last_kill_at: Option<u64>,
}

public struct BountyCreatedEvent has copy, drop {
    bounty_id: ID,
    creator: address,
    target: address,
    reward_amount: u64,
    created_at: u64,
    expires_at: u64,
}

public struct BountyClaimedEvent has copy, drop {
    bounty_id: ID,
    target: address,
    hunter: address,
    reward_amount: u64,
    claimed_at: u64,
}

public struct BountyCancelledEvent has copy, drop {
    bounty_id: ID,
    creator: address,
    refund_amount: u64,
}

public struct BountyExpiredEvent has copy, drop {
    bounty_id: ID,
    creator: address,
    refund_amount: u64,
}

public struct HunterRegisteredEvent has copy, drop {
    badge_id: ID,
    hunter: address,
}

fun init(ctx: &mut TxContext) {
    let board = BountyBoard {
        id: object::new(ctx),
        active_count: 0,
        total_bounties_created: 0,
        total_rewards_paid: 0,
        target_index: table::new(ctx),
        target_total_active_reward: table::new(ctx),
    };

    transfer::share_object(board);
}

public entry fun create_bounty(
    board: &mut BountyBoard,
    payment: Coin<SUI>,
    target: address,
    duration_hours: u64,
    description: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let creator = tx_context::sender(ctx);
    let reward_amount = coin::value(&payment);

    assert!(reward_amount >= MIN_REWARD_AMOUNT, E_MIN_REWARD);
    assert!(creator != target, E_SELF_BOUNTY);
    assert!(duration_hours > 0, E_INVALID_DURATION);

    let now = clock::timestamp_ms(clock);
    let expires_at = now + duration_hours * 3_600_000;

    let mut bounty = Bounty {
        id: object::new(ctx),
        creator,
        target,
        reward_amount,
        status: STATUS_ACTIVE,
        created_at: now,
        expires_at,
        description,
        claimed_by: option::none(),
        claimed_at: option::none(),
    };

    let bounty_id = object::id(&bounty);

    add_target_index(board, target, bounty_id, reward_amount);
    board.active_count = board.active_count + 1;
    board.total_bounties_created = board.total_bounties_created + 1;

    bounty_escrow::deposit_with_parent(
        &mut bounty.id,
        bounty_id,
        creator,
        payment,
        ctx,
    );

    event::emit(BountyCreatedEvent {
        bounty_id,
        creator,
        target,
        reward_amount,
        created_at: now,
        expires_at,
    });

    transfer::share_object(bounty);
}

public entry fun cancel_bounty(
    board: &mut BountyBoard,
    bounty: &mut Bounty,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);

    assert!(sender == bounty.creator, E_NOT_BOUNTY_CREATOR);
    assert!(bounty.status == STATUS_ACTIVE, E_BOUNTY_NOT_ACTIVE);
    assert!(!is_expired(bounty, clock), E_BOUNTY_EXPIRED);

    mark_cancelled(board, bounty);

    let (refund_coin, creator, refund_amount) = refund_to_creator(bounty, ctx);
    transfer::public_transfer(refund_coin, creator);

    event::emit(BountyCancelledEvent {
        bounty_id: object::id(bounty),
        creator,
        refund_amount,
    });
}

public entry fun register_hunter(ctx: &mut TxContext) {
    let hunter = tx_context::sender(ctx);
    let badge = HunterBadge {
        id: object::new(ctx),
        hunter,
        kills: 0,
        total_earnings: 0,
        streak: 0,
        max_streak: 0,
        last_kill_at: option::none(),
    };

    let badge_id = object::id(&badge);
    transfer::public_transfer(badge, hunter);

    event::emit(HunterRegisteredEvent {
        badge_id,
        hunter,
    });
}

public(package) fun mark_claimed(
    board: &mut BountyBoard,
    bounty: &mut Bounty,
    hunter: address,
    claimed_at: u64,
) {
    assert!(bounty.status == STATUS_ACTIVE, E_BOUNTY_NOT_ACTIVE);

    bounty.status = STATUS_CLAIMED;
    bounty.claimed_by = option::some(hunter);
    bounty.claimed_at = option::some(claimed_at);

    board.active_count = board.active_count - 1;
    board.total_rewards_paid = board.total_rewards_paid + bounty.reward_amount;

    remove_target_index(board, bounty.target, object::id(bounty), bounty.reward_amount);

    event::emit(BountyClaimedEvent {
        bounty_id: object::id(bounty),
        target: bounty.target,
        hunter,
        reward_amount: bounty.reward_amount,
        claimed_at,
    });
}

public(package) fun mark_expired(
    board: &mut BountyBoard,
    bounty: &mut Bounty,
    refund_amount: u64,
) {
    assert!(bounty.status == STATUS_ACTIVE, E_BOUNTY_NOT_ACTIVE);

    bounty.status = STATUS_EXPIRED;
    board.active_count = board.active_count - 1;

    remove_target_index(board, bounty.target, object::id(bounty), bounty.reward_amount);

    event::emit(BountyExpiredEvent {
        bounty_id: object::id(bounty),
        creator: bounty.creator,
        refund_amount,
    });
}

public(package) fun update_hunter_stats(
    hunter_badge: &mut HunterBadge,
    hunter: address,
    reward_amount: u64,
    claimed_at: u64,
) {
    assert!(hunter_badge.hunter == hunter, E_INVALID_BADGE_OWNER);

    hunter_badge.kills = hunter_badge.kills + 1;
    hunter_badge.total_earnings = hunter_badge.total_earnings + reward_amount;
    hunter_badge.streak = hunter_badge.streak + 1;
    if (hunter_badge.streak > hunter_badge.max_streak) {
        hunter_badge.max_streak = hunter_badge.streak;
    };
    hunter_badge.last_kill_at = option::some(claimed_at);
}

public(package) fun release_reward_to_hunter(
    bounty: &mut Bounty,
    hunter: address,
    ctx: &mut TxContext,
): Coin<SUI> {
    bounty_escrow::release_to_hunter(&mut bounty.id, hunter, ctx)
}

public(package) fun refund_to_creator(
    bounty: &mut Bounty,
    ctx: &mut TxContext,
): (Coin<SUI>, address, u64) {
    bounty_escrow::refund_to_depositor(&mut bounty.id, ctx)
}

public fun is_wanted(board: &BountyBoard, target: address): bool {
    target_total_active_reward(board, target) > 0
}

public fun get_bounties_for_target(board: &BountyBoard, target: address): vector<ID> {
    if (!table::contains(&board.target_index, target)) {
        return vector::empty<ID>()
    };
    *table::borrow(&board.target_index, target)
}

public fun bounty_status(bounty: &Bounty): u8 {
    bounty.status
}

public fun bounty_target(bounty: &Bounty): address {
    bounty.target
}

public fun bounty_creator(bounty: &Bounty): address {
    bounty.creator
}

public fun bounty_reward(bounty: &Bounty): u64 {
    bounty.reward_amount
}

public fun bounty_expires_at(bounty: &Bounty): u64 {
    bounty.expires_at
}

public fun bounty_claimed_by(bounty: &Bounty): Option<address> {
    bounty.claimed_by
}

public fun is_expired(bounty: &Bounty, clock: &Clock): bool {
    clock::timestamp_ms(clock) > bounty.expires_at
}

public fun target_total_active_reward(board: &BountyBoard, target: address): u64 {
    if (!table::contains(&board.target_total_active_reward, target)) {
        return 0
    };

    *table::borrow(&board.target_total_active_reward, target)
}

public fun active_count(board: &BountyBoard): u64 {
    board.active_count
}

public fun total_bounties_created(board: &BountyBoard): u64 {
    board.total_bounties_created
}

public fun total_rewards_paid(board: &BountyBoard): u64 {
    board.total_rewards_paid
}

public fun min_reward_amount(): u64 {
    MIN_REWARD_AMOUNT
}

public fun status_active(): u8 {
    STATUS_ACTIVE
}

public fun status_claimed(): u8 {
    STATUS_CLAIMED
}

public fun status_cancelled(): u8 {
    STATUS_CANCELLED
}

public fun status_expired(): u8 {
    STATUS_EXPIRED
}

public fun hunter_address(badge: &HunterBadge): address {
    badge.hunter
}

public fun hunter_kills(badge: &HunterBadge): u64 {
    badge.kills
}

public fun hunter_total_earnings(badge: &HunterBadge): u64 {
    badge.total_earnings
}

public fun escrowed_amount(bounty: &Bounty): u64 {
    bounty_escrow::escrowed_amount(&bounty.id)
}

fun mark_cancelled(board: &mut BountyBoard, bounty: &mut Bounty) {
    assert!(bounty.status == STATUS_ACTIVE, E_BOUNTY_NOT_ACTIVE);

    bounty.status = STATUS_CANCELLED;
    board.active_count = board.active_count - 1;

    remove_target_index(board, bounty.target, object::id(bounty), bounty.reward_amount);
}

fun add_target_index(
    board: &mut BountyBoard,
    target: address,
    bounty_id: ID,
    reward_amount: u64,
) {
    if (!table::contains(&board.target_index, target)) {
        table::add(&mut board.target_index, target, vector::empty<ID>());
    };

    let index = table::borrow_mut(&mut board.target_index, target);
    vector::push_back(index, bounty_id);

    if (!table::contains(&board.target_total_active_reward, target)) {
        table::add(&mut board.target_total_active_reward, target, 0);
    };

    let total = table::borrow_mut(&mut board.target_total_active_reward, target);
    *total = *total + reward_amount;
}

fun remove_target_index(
    board: &mut BountyBoard,
    target: address,
    bounty_id: ID,
    reward_amount: u64,
) {
    if (table::contains(&board.target_index, target)) {
        let index = table::borrow_mut(&mut board.target_index, target);
        let mut i = 0;
        while (i < vector::length(index)) {
            if (*vector::borrow(index, i) == bounty_id) {
                vector::swap_remove(index, i);
                break
            };
            i = i + 1;
        };

        if (vector::is_empty(index)) {
            let _ = table::remove(&mut board.target_index, target);
        };
    };

    if (table::contains(&board.target_total_active_reward, target)) {
        let total = table::borrow_mut(&mut board.target_total_active_reward, target);
        assert!(*total >= reward_amount, E_INVALID_STATE);
        *total = *total - reward_amount;

        if (*total == 0) {
            let _ = table::remove(&mut board.target_total_active_reward, target);
        };
    };
}

#[test_only]
public fun new_board_for_testing(ctx: &mut TxContext): BountyBoard {
    BountyBoard {
        id: object::new(ctx),
        active_count: 0,
        total_bounties_created: 0,
        total_rewards_paid: 0,
        target_index: table::new(ctx),
        target_total_active_reward: table::new(ctx),
    }
}

#[test_only]
public fun new_bounty_for_testing(
    creator: address,
    target: address,
    reward_amount: u64,
    now: u64,
    expires_at: u64,
    ctx: &mut TxContext,
): Bounty {
    Bounty {
        id: object::new(ctx),
        creator,
        target,
        reward_amount,
        status: STATUS_ACTIVE,
        created_at: now,
        expires_at,
        description: vector::empty<u8>(),
        claimed_by: option::none(),
        claimed_at: option::none(),
    }
}

#[test_only]
public fun new_hunter_badge_for_testing(hunter: address, ctx: &mut TxContext): HunterBadge {
    HunterBadge {
        id: object::new(ctx),
        hunter,
        kills: 0,
        total_earnings: 0,
        streak: 0,
        max_streak: 0,
        last_kill_at: option::none(),
    }
}

#[test_only]
public fun share_board_for_testing(board: BountyBoard) {
    transfer::share_object(board);
}
