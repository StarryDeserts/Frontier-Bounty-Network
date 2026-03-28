module frontier_bounty::bounty_escrow;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::dynamic_object_field as dof;
use sui::event;
use sui::object::{Self, ID, UID};
use sui::sui::SUI;
use sui::tx_context::TxContext;

const E_VAULT_ALREADY_EXISTS: u64 = 100;
const E_VAULT_NOT_FOUND: u64 = 101;

public struct EscrowVaultKey has copy, drop, store {}

public struct EscrowVault has key, store {
    id: UID,
    bounty_id: ID,
    balance: Balance<SUI>,
    depositor: address,
}

public struct FundsDepositedEvent has copy, drop {
    bounty_id: ID,
    amount: u64,
    depositor: address,
}

public struct FundsReleasedEvent has copy, drop {
    bounty_id: ID,
    amount: u64,
    recipient: address,
}

public struct FundsRefundedEvent has copy, drop {
    bounty_id: ID,
    amount: u64,
    refunded_to: address,
}

public(package) fun deposit_with_parent(
    parent: &mut UID,
    bounty_id: ID,
    depositor: address,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    assert!(!dof::exists_(parent, EscrowVaultKey {}), E_VAULT_ALREADY_EXISTS);

    let amount = coin::value(&payment);
    let vault = EscrowVault {
        id: object::new(ctx),
        bounty_id,
        balance: coin::into_balance(payment),
        depositor,
    };

    dof::add(parent, EscrowVaultKey {}, vault);

    event::emit(FundsDepositedEvent {
        bounty_id,
        amount,
        depositor,
    });
}

public(package) fun release_to_hunter(
    parent: &mut UID,
    hunter: address,
    ctx: &mut TxContext,
): Coin<SUI> {
    assert!(dof::exists_(parent, EscrowVaultKey {}), E_VAULT_NOT_FOUND);

    let vault: EscrowVault = dof::remove(parent, EscrowVaultKey {});
    let EscrowVault {
        id,
        bounty_id,
        balance,
        depositor: _,
    } = vault;

    let amount = balance::value(&balance);
    let reward = coin::from_balance(balance, ctx);
    object::delete(id);

    event::emit(FundsReleasedEvent {
        bounty_id,
        amount,
        recipient: hunter,
    });

    reward
}

public(package) fun refund_to_depositor(
    parent: &mut UID,
    ctx: &mut TxContext,
): (Coin<SUI>, address, u64) {
    assert!(dof::exists_(parent, EscrowVaultKey {}), E_VAULT_NOT_FOUND);

    let vault: EscrowVault = dof::remove(parent, EscrowVaultKey {});
    let EscrowVault {
        id,
        bounty_id,
        balance,
        depositor,
    } = vault;

    let amount = balance::value(&balance);
    let refund = coin::from_balance(balance, ctx);
    object::delete(id);

    event::emit(FundsRefundedEvent {
        bounty_id,
        amount,
        refunded_to: depositor,
    });

    (refund, depositor, amount)
}

public(package) fun escrowed_amount(parent: &UID): u64 {
    if (!dof::exists_(parent, EscrowVaultKey {})) {
        return 0
    };

    let vault = dof::borrow<EscrowVaultKey, EscrowVault>(parent, EscrowVaultKey {});
    balance::value(&vault.balance)
}
