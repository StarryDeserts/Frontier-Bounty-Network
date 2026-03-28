module frontier_bounty::turret_bounty;

use sui::event;
use sui::object::{Self, ID, UID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

use frontier_bounty::bounty_registry::{Self, BountyBoard};

const E_NOT_OWNER: u64 = 300;
const E_INVALID_SHARE_PERCENTAGE: u64 = 301;

public struct BountyTurretConfig has key, store {
    id: UID,
    owner: address,
    enabled: bool,
    min_bounty_threshold: u64,
    share_kills: bool,
    share_percentage: u8,
}

public struct TurretTargetAcquiredEvent has copy, drop {
    turret_config_id: ID,
    target: address,
    bounty_amount: u64,
}

public entry fun register_bounty_turret(
    min_threshold: u64,
    share_kills: bool,
    share_pct: u8,
    ctx: &mut TxContext,
) {
    assert!(share_pct <= 50, E_INVALID_SHARE_PERCENTAGE);

    let owner = tx_context::sender(ctx);
    let config = BountyTurretConfig {
        id: object::new(ctx),
        owner,
        enabled: true,
        min_bounty_threshold: min_threshold,
        share_kills,
        share_percentage: share_pct,
    };

    transfer::public_transfer(config, owner);
}

public fun should_engage(
    config: &BountyTurretConfig,
    board: &BountyBoard,
    incoming_player: address,
): bool {
    if (!config.enabled) {
        return false
    };

    if (!bounty_registry::is_wanted(board, incoming_player)) {
        return false
    };

    let active_reward = bounty_registry::target_total_active_reward(board, incoming_player);
    if (active_reward < config.min_bounty_threshold) {
        return false
    };

    event::emit(TurretTargetAcquiredEvent {
        turret_config_id: object::id(config),
        target: incoming_player,
        bounty_amount: active_reward,
    });

    true
}

public entry fun toggle_bounty_mode(config: &mut BountyTurretConfig, ctx: &mut TxContext) {
    assert!(tx_context::sender(ctx) == config.owner, E_NOT_OWNER);
    config.enabled = !config.enabled;
}

public entry fun update_threshold(
    config: &mut BountyTurretConfig,
    new_threshold: u64,
    ctx: &mut TxContext,
) {
    assert!(tx_context::sender(ctx) == config.owner, E_NOT_OWNER);
    config.min_bounty_threshold = new_threshold;
}

public entry fun update_share_policy(
    config: &mut BountyTurretConfig,
    share_kills: bool,
    share_pct: u8,
    ctx: &mut TxContext,
) {
    assert!(tx_context::sender(ctx) == config.owner, E_NOT_OWNER);
    assert!(share_pct <= 50, E_INVALID_SHARE_PERCENTAGE);

    config.share_kills = share_kills;
    config.share_percentage = share_pct;
}
