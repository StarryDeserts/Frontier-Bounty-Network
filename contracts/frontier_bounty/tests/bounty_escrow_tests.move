#[test_only]
module frontier_bounty::bounty_escrow_tests;

use frontier_bounty::bounty_registry::{Self, Bounty, BountyBoard};

use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::test_scenario;
use sui::transfer;

const CREATOR: address = @0xA11CE;
const TARGET: address = @0xB0B;

#[test]
fun escrow_tracks_create_and_cancel() {
    let mut scenario = test_scenario::begin(CREATOR);

    let board = bounty_registry::new_board_for_testing(test_scenario::ctx(&mut scenario));
    bounty_registry::share_board_for_testing(board);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    clock::share_for_testing(clock);

    test_scenario::next_tx(&mut scenario, CREATOR);
    {
        let mut board: BountyBoard = test_scenario::take_shared(&scenario);
        let clock: Clock = test_scenario::take_shared(&scenario);
        let payment: Coin<SUI> = coin::mint_for_testing(2_500_000, test_scenario::ctx(&mut scenario));

        bounty_registry::create_bounty(
            &mut board,
            payment,
            TARGET,
            1,
            b"escrow-check",
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

        assert!(bounty_registry::escrowed_amount(&bounty) == 2_500_000);

        bounty_registry::cancel_bounty(
            &mut board,
            &mut bounty,
            &clock,
            test_scenario::ctx(&mut scenario),
        );

        assert!(bounty_registry::escrowed_amount(&bounty) == 0);

        test_scenario::return_shared(board);
        test_scenario::return_shared(bounty);
        test_scenario::return_shared(clock);
    };

    test_scenario::next_tx(&mut scenario, CREATOR);
    {
        let refunded: Coin<SUI> = test_scenario::take_from_sender(&scenario);
        assert!(coin::value(&refunded) == 2_500_000);
        let _ = coin::burn_for_testing(refunded);
    };

    test_scenario::end(scenario);
}

