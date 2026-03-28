module frontier_bounty::gate_bounty;

use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, ID, UID};
use sui::sui::SUI;
use sui::transfer;
use sui::tx_context::{Self, TxContext};

use frontier_bounty::bounty_registry::{Self, BountyBoard};

const E_NOT_OWNER: u64 = 400;
const E_INVALID_MODE: u64 = 401;
const E_MODE_MISMATCH: u64 = 402;
const E_INVALID_SURCHARGE: u64 = 403;

const MODE_BLOCK: u8 = 0;
const MODE_SURCHARGE: u8 = 1;
const MODE_ALERT_ONLY: u8 = 2;

public struct BountyGateConfig has key, store {
    id: UID,
    owner: address,
    mode: u8,
    surcharge_amount: u64,
    min_bounty_threshold: u64,
    enabled: bool,
}

public struct GateAccessDeniedEvent has copy, drop {
    gate_config_id: ID,
    player: address,
    bounty_amount: u64,
    mode: u8,
}

public struct GateSurchargeCollectedEvent has copy, drop {
    gate_config_id: ID,
    player: address,
    surcharge: u64,
}

public entry fun register_bounty_gate(
    mode: u8,
    surcharge: u64,
    min_threshold: u64,
    ctx: &mut TxContext,
) {
    assert!(is_valid_mode(mode), E_INVALID_MODE);

    let owner = tx_context::sender(ctx);
    let config = BountyGateConfig {
        id: object::new(ctx),
        owner,
        mode,
        surcharge_amount: surcharge,
        min_bounty_threshold: min_threshold,
        enabled: true,
    };

    transfer::public_transfer(config, owner);
}

public fun check_jump_permission(
    config: &BountyGateConfig,
    board: &BountyBoard,
    player: address,
): u8 {
    if (!config.enabled) {
        return 0
    };

    let active_reward = bounty_registry::target_total_active_reward(board, player);
    if (active_reward < config.min_bounty_threshold || active_reward == 0) {
        return 0
    };

    if (config.mode == MODE_BLOCK) {
        event::emit(GateAccessDeniedEvent {
            gate_config_id: object::id(config),
            player,
            bounty_amount: active_reward,
            mode: MODE_BLOCK,
        });
        return 1
    };

    if (config.mode == MODE_SURCHARGE) {
        return 2
    };

    event::emit(GateAccessDeniedEvent {
        gate_config_id: object::id(config),
        player,
        bounty_amount: active_reward,
        mode: MODE_ALERT_ONLY,
    });
    3
}

public entry fun pay_surcharge_and_jump(
    config: &BountyGateConfig,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    assert!(config.mode == MODE_SURCHARGE, E_MODE_MISMATCH);
    assert!(coin::value(&payment) == config.surcharge_amount, E_INVALID_SURCHARGE);

    let player = tx_context::sender(ctx);
    transfer::public_transfer(payment, config.owner);

    event::emit(GateSurchargeCollectedEvent {
        gate_config_id: object::id(config),
        player,
        surcharge: config.surcharge_amount,
    });
}

public entry fun set_mode(config: &mut BountyGateConfig, new_mode: u8, ctx: &mut TxContext) {
    assert!(tx_context::sender(ctx) == config.owner, E_NOT_OWNER);
    assert!(is_valid_mode(new_mode), E_INVALID_MODE);
    config.mode = new_mode;
}

public entry fun set_enabled(config: &mut BountyGateConfig, enabled: bool, ctx: &mut TxContext) {
    assert!(tx_context::sender(ctx) == config.owner, E_NOT_OWNER);
    config.enabled = enabled;
}

public entry fun update_threshold(
    config: &mut BountyGateConfig,
    new_threshold: u64,
    ctx: &mut TxContext,
) {
    assert!(tx_context::sender(ctx) == config.owner, E_NOT_OWNER);
    config.min_bounty_threshold = new_threshold;
}

public entry fun update_surcharge(
    config: &mut BountyGateConfig,
    new_surcharge: u64,
    ctx: &mut TxContext,
) {
    assert!(tx_context::sender(ctx) == config.owner, E_NOT_OWNER);
    config.surcharge_amount = new_surcharge;
}

public fun mode_block(): u8 {
    MODE_BLOCK
}

public fun mode_surcharge(): u8 {
    MODE_SURCHARGE
}

public fun mode_alert_only(): u8 {
    MODE_ALERT_ONLY
}

fun is_valid_mode(mode: u8): bool {
    mode == MODE_BLOCK || mode == MODE_SURCHARGE || mode == MODE_ALERT_ONLY
}
