#[test_only]
module frontier_bounty::bounty_registry_tests;

use frontier_bounty::bounty_registry::{Self, Bounty, BountyBoard, HunterBadge};

use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::test_scenario;
use sui::transfer;

const CREATOR: address = @0xA11CE;
const TARGET: address = @0xB0B;
const ATTACKER: address = @0xBAD;

#[test]
fun create_and_cancel_bounty_happy_path() {
    let mut scenario = test_scenario::begin(CREATOR);

    let board = bounty_registry::new_board_for_testing(test_scenario::ctx(&mut scenario));
    bounty_registry::share_board_for_testing(board);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    clock::share_for_testing(clock);

    test_scenario::next_tx(&mut scenario, CREATOR);
    {
        let mut board: BountyBoard = test_scenario::take_shared(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);

        let payment: Coin<SUI> = coin::mint_for_testing(2_000_000, test_scenario::ctx(&mut scenario));
        bounty_registry::create_bounty(
            &mut board,
            payment,
            TARGET,
            1,
            b"wanted-for-raiding",
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_shared(board);
        test_scenario::return_shared(clock);
    };

    test_scenario::next_tx(&mut scenario, CREATOR);
    {
        let mut board: BountyBoard = test_scenario::take_shared(&scenario);
        let mut bounty: Bounty = test_scenario::take_shared(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);

        bounty_registry::cancel_bounty(
            &mut board,
            &mut bounty,
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        assert!(bounty_registry::bounty_status(&bounty) == bounty_registry::status_cancelled());
        assert!(bounty_registry::active_count(&board) == 0);
        assert!(!bounty_registry::is_wanted(&board, TARGET));

        test_scenario::return_shared(board);
        test_scenario::return_shared(bounty);
        test_scenario::return_shared(clock);
    };

    test_scenario::next_tx(&mut scenario, CREATOR);
    {
        let refunded: Coin<SUI> = test_scenario::take_from_address(&scenario, CREATOR);
        assert!(coin::value(&refunded) == 2_000_000);
        let _ = coin::burn_for_testing(refunded);
    };

    test_scenario::end(scenario);
}

#[test]
fun register_hunter_happy_path() {
    let mut scenario = test_scenario::begin(CREATOR);

    bounty_registry::register_hunter(test_scenario::ctx(&mut scenario));

    test_scenario::next_tx(&mut scenario, CREATOR);
    {
        let badge: HunterBadge = test_scenario::take_from_sender(&scenario);
        assert!(bounty_registry::hunter_address(&badge) == CREATOR);
        assert!(bounty_registry::hunter_kills(&badge) == 0);
        assert!(bounty_registry::hunter_total_earnings(&badge) == 0);
        test_scenario::return_to_sender(&scenario, badge);
    };

    test_scenario::end(scenario);
}

#[test, expected_failure(abort_code = 0)]
fun cancel_bounty_by_non_creator_fails() {
    let mut scenario = test_scenario::begin(CREATOR);

    let board = bounty_registry::new_board_for_testing(test_scenario::ctx(&mut scenario));
    bounty_registry::share_board_for_testing(board);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    clock::share_for_testing(clock);

    test_scenario::next_tx(&mut scenario, CREATOR);
    {
        let mut board: BountyBoard = test_scenario::take_shared(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);
        let payment: Coin<SUI> = coin::mint_for_testing(2_000_000, test_scenario::ctx(&mut scenario));

        bounty_registry::create_bounty(
            &mut board,
            payment,
            TARGET,
            1,
            b"unauthorized-cancel",
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_shared(board);
        test_scenario::return_shared(clock);
    };

    test_scenario::next_tx(&mut scenario, ATTACKER);
    {
        let mut board: BountyBoard = test_scenario::take_shared(&scenario);
        let mut bounty: Bounty = test_scenario::take_shared(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);

        bounty_registry::cancel_bounty(
            &mut board,
            &mut bounty,
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        test_scenario::return_shared(board);
        test_scenario::return_shared(bounty);
        test_scenario::return_shared(clock);
    };

    test_scenario::end(scenario);
}

