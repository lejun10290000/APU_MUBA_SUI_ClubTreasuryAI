#[test_only]
module club_treasury::treasury_tests;

use club_treasury::treasury::{Self, TreasurerCap, Treasury};
use sui::coin;
use sui::test_scenario::{Self, Scenario};

const ADMIN: address = @0xA11CE;
const ATTACKER: address = @0xBAD;
const RECIPIENT: address = @0xB0B;

public struct MockUsdc has drop {}

#[test]
fun creates_treasury_and_admin_capability() {
    let mut scenario = test_scenario::begin(ADMIN);

    treasury::create<MockUsdc>(b"demo-web3-workshop", test_scenario::ctx(&mut scenario));

    test_scenario::next_tx(&mut scenario, ADMIN);
    let treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);

    assert!(treasury::treasurer(&treasury) == ADMIN, 0);
    assert!(treasury::id(&treasury) == treasury::cap_treasury_id(&cap), 1);
    assert!(treasury::cap_treasurer(&cap) == ADMIN, 2);
    assert!(treasury::external_reference(&treasury) == &b"demo-web3-workshop", 3);
    assert!(treasury::metadata_revision(&treasury) == 0, 4);
    assert!(treasury::balance(&treasury) == 0, 5);

    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
fun one_deposit_increases_balance_by_exact_base_units() {
    let mut scenario = test_scenario::begin(ADMIN);

    treasury::create<MockUsdc>(b"demo-funded-once", test_scenario::ctx(&mut scenario));

    test_scenario::next_tx(&mut scenario, ATTACKER);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let payment = coin::mint_for_testing<MockUsdc>(12_345, test_scenario::ctx(&mut scenario));

    treasury::deposit(&mut treasury, payment);

    assert!(treasury::balance(&treasury) == 12_345, 0);

    test_scenario::return_shared(treasury);
    test_scenario::end(scenario);
}

#[test]
fun multiple_deposits_accumulate_exactly() {
    let mut scenario = test_scenario::begin(ADMIN);

    treasury::create<MockUsdc>(b"demo-funded-twice", test_scenario::ctx(&mut scenario));

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let first_payment = coin::mint_for_testing<MockUsdc>(10_001, test_scenario::ctx(&mut scenario));
    treasury::deposit(&mut treasury, first_payment);
    test_scenario::return_shared(treasury);

    test_scenario::next_tx(&mut scenario, ATTACKER);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let second_payment = coin::mint_for_testing<MockUsdc>(20_002, test_scenario::ctx(&mut scenario));
    treasury::deposit(&mut treasury, second_payment);

    assert!(treasury::balance(&treasury) == 30_003, 0);

    test_scenario::return_shared(treasury);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 3, location = club_treasury::treasury)]
fun zero_value_deposit_is_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);

    treasury::create<MockUsdc>(b"demo-zero-rejected", test_scenario::ctx(&mut scenario));

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let zero_payment = coin::mint_for_testing<MockUsdc>(0, test_scenario::ctx(&mut scenario));

    treasury::deposit(&mut treasury, zero_payment);

    test_scenario::return_shared(treasury);
    test_scenario::end(scenario);
}

#[test]
fun admin_capability_allows_privileged_update() {
    let mut scenario = test_scenario::begin(ADMIN);

    treasury::create<MockUsdc>(b"demo-original", test_scenario::ctx(&mut scenario));

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);

    treasury::set_external_reference(
        &mut treasury,
        &cap,
        b"demo-updated",
        test_scenario::ctx(&mut scenario),
    );

    assert!(treasury::external_reference(&treasury) == &b"demo-updated", 0);
    assert!(treasury::metadata_revision(&treasury) == 1, 1);

    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 0, location = club_treasury::treasury)]
fun unauthorized_sender_cannot_use_admin_capability() {
    let mut scenario = test_scenario::begin(ADMIN);

    treasury::create<MockUsdc>(b"demo-protected", test_scenario::ctx(&mut scenario));

    test_scenario::next_tx(&mut scenario, ATTACKER);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_address<TreasurerCap<MockUsdc>>(&scenario, ADMIN);

    treasury::set_external_reference(
        &mut treasury,
        &cap,
        b"attacker-update",
        test_scenario::ctx(&mut scenario),
    );

    test_scenario::return_shared(treasury);
    test_scenario::return_to_address(ADMIN, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 1, location = club_treasury::treasury)]
fun capability_for_another_treasury_is_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);

    treasury::create<MockUsdc>(b"demo-first", test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, ADMIN);
    let first_treasury_id = test_scenario::most_recent_id_shared<Treasury<MockUsdc>>().destroy_some();

    treasury::create<MockUsdc>(b"demo-second", test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, ADMIN);

    let mut first_treasury =
        test_scenario::take_shared_by_id<Treasury<MockUsdc>>(&scenario, first_treasury_id);
    let second_cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);

    treasury::set_external_reference(
        &mut first_treasury,
        &second_cap,
        b"invalid-update",
        test_scenario::ctx(&mut scenario),
    );

    test_scenario::return_shared(first_treasury);
    test_scenario::return_to_sender(&scenario, second_cap);
    test_scenario::end(scenario);
}

#[test]
fun balanced_category_confirmation_preserves_exact_amounts() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_funded_treasury(&mut scenario, b"demo-balanced", 30_003);

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);

    treasury::confirm_allocations(
        &mut treasury,
        &cap,
        vector[b"venue", b"marketing", b"emergency"],
        vector[10_001, 10_002, 10_000],
        test_scenario::ctx(&mut scenario),
    );

    assert!(treasury::allocations_confirmed(&treasury), 0);
    assert!(treasury::category_count(&treasury) == 3, 1);
    assert!(treasury::category_reference_at(&treasury, 0) == &b"venue", 2);
    assert!(treasury::category_reference_at(&treasury, 1) == &b"marketing", 3);
    assert!(treasury::category_reference_at(&treasury, 2) == &b"emergency", 4);
    assert!(treasury::category_allocated_at(&treasury, 0) == 10_001, 5);
    assert!(treasury::category_allocated_at(&treasury, 1) == 10_002, 6);
    assert!(treasury::category_allocated_at(&treasury, 2) == 10_000, 7);
    assert!(treasury::category_remaining_at(&treasury, 0) == 10_001, 8);
    assert!(treasury::category_remaining_at(&treasury, 1) == 10_002, 9);
    assert!(treasury::category_remaining_at(&treasury, 2) == 10_000, 10);
    assert!(treasury::balance(&treasury) == 30_003, 11);

    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 9, location = club_treasury::treasury)]
fun duplicate_category_reference_is_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_funded_treasury(&mut scenario, b"demo-duplicate", 100);

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::confirm_allocations(
        &mut treasury,
        &cap,
        vector[b"food", b"food"],
        vector[40, 60],
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 7, location = club_treasury::treasury)]
fun empty_category_reference_is_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_funded_treasury(&mut scenario, b"demo-empty-reference", 100);

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::confirm_allocations(
        &mut treasury,
        &cap,
        vector[b""],
        vector[100],
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 8, location = club_treasury::treasury)]
fun zero_category_allocation_is_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_funded_treasury(&mut scenario, b"demo-zero-allocation", 100);

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::confirm_allocations(
        &mut treasury,
        &cap,
        vector[b"food", b"empty"],
        vector[100, 0],
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 5, location = club_treasury::treasury)]
fun empty_category_list_is_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);
    treasury::create<MockUsdc>(b"demo-empty-list", test_scenario::ctx(&mut scenario));

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::confirm_allocations(
        &mut treasury,
        &cap,
        vector[],
        vector[],
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 6, location = club_treasury::treasury)]
fun mismatched_category_vectors_are_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_funded_treasury(&mut scenario, b"demo-length-mismatch", 100);

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::confirm_allocations(
        &mut treasury,
        &cap,
        vector[b"food", b"venue"],
        vector[100],
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 10, location = club_treasury::treasury)]
fun under_allocation_is_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_funded_treasury(&mut scenario, b"demo-under", 100);

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::confirm_allocations(
        &mut treasury,
        &cap,
        vector[b"food"],
        vector[99],
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 10, location = club_treasury::treasury)]
fun over_allocation_is_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_funded_treasury(&mut scenario, b"demo-over", 100);

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::confirm_allocations(
        &mut treasury,
        &cap,
        vector[b"food"],
        vector[101],
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 0, location = club_treasury::treasury)]
fun unauthorized_sender_cannot_confirm_allocations() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_funded_treasury(&mut scenario, b"demo-unauthorized-allocation", 100);

    test_scenario::next_tx(&mut scenario, ATTACKER);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_address<TreasurerCap<MockUsdc>>(&scenario, ADMIN);
    treasury::confirm_allocations(
        &mut treasury,
        &cap,
        vector[b"food"],
        vector[100],
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_address(ADMIN, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 1, location = club_treasury::treasury)]
fun capability_for_another_treasury_cannot_confirm_allocations() {
    let mut scenario = test_scenario::begin(ADMIN);

    treasury::create<MockUsdc>(b"demo-first-allocation", test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, ADMIN);
    let first_treasury_id = test_scenario::most_recent_id_shared<Treasury<MockUsdc>>().destroy_some();

    treasury::create<MockUsdc>(b"demo-second-allocation", test_scenario::ctx(&mut scenario));
    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut first_treasury =
        test_scenario::take_shared_by_id<Treasury<MockUsdc>>(&scenario, first_treasury_id);
    let second_cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::confirm_allocations(
        &mut first_treasury,
        &second_cap,
        vector[b"food"],
        vector[1],
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(first_treasury);
    test_scenario::return_to_sender(&scenario, second_cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 4, location = club_treasury::treasury)]
fun second_allocation_confirmation_is_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_funded_treasury(&mut scenario, b"demo-confirm-once", 100);

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::confirm_allocations(
        &mut treasury,
        &cap,
        vector[b"food"],
        vector[100],
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::confirm_allocations(
        &mut treasury,
        &cap,
        vector[b"venue"],
        vector[100],
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 11, location = club_treasury::treasury)]
fun deposit_after_confirmation_is_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_funded_treasury(&mut scenario, b"demo-deposit-locked", 100);

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::confirm_allocations(
        &mut treasury,
        &cap,
        vector[b"food"],
        vector[100],
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);

    test_scenario::next_tx(&mut scenario, ATTACKER);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let payment = coin::mint_for_testing<MockUsdc>(1, test_scenario::ctx(&mut scenario));
    treasury::deposit(&mut treasury, payment);
    test_scenario::return_shared(treasury);
    test_scenario::end(scenario);
}

#[test]
fun successful_payout_transfers_exact_coin_and_updates_accounting() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_confirmed_treasury(
        &mut scenario,
        b"demo-payout",
        100,
        vector[b"food", b"venue"],
        vector[60, 40],
    );

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);

    treasury::payout(
        &mut treasury,
        &cap,
        b"food",
        RECIPIENT,
        25,
        test_scenario::ctx(&mut scenario),
    );

    assert!(treasury::category_allocated_at(&treasury, 0) == 60, 0);
    assert!(treasury::category_remaining_at(&treasury, 0) == 35, 1);
    assert!(treasury::category_remaining_at(&treasury, 1) == 40, 2);
    assert!(treasury::balance(&treasury) == 75, 3);
    assert!(treasury::accounting_invariant_holds(&treasury), 4);

    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);

    let effects = test_scenario::next_tx(&mut scenario, RECIPIENT);
    assert!(test_scenario::num_user_events(&effects) == 1, 5);
    let payout_coin = test_scenario::take_from_sender<coin::Coin<MockUsdc>>(&scenario);
    assert!(coin::value(&payout_coin) == 25, 6);
    assert!(coin::burn_for_testing(payout_coin) == 25, 7);
    test_scenario::end(scenario);
}

#[test]
fun multiple_payouts_from_same_category_accumulate_exactly() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_confirmed_treasury(
        &mut scenario,
        b"demo-multiple-payouts",
        100,
        vector[b"food"],
        vector[100],
    );

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::payout(
        &mut treasury,
        &cap,
        b"food",
        RECIPIENT,
        30,
        test_scenario::ctx(&mut scenario),
    );
    treasury::payout(
        &mut treasury,
        &cap,
        b"food",
        RECIPIENT,
        20,
        test_scenario::ctx(&mut scenario),
    );

    assert!(treasury::category_allocated_at(&treasury, 0) == 100, 0);
    assert!(treasury::category_remaining_at(&treasury, 0) == 50, 1);
    assert!(treasury::balance(&treasury) == 50, 2);
    assert!(treasury::accounting_invariant_holds(&treasury), 3);

    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);

    let effects = test_scenario::next_tx(&mut scenario, RECIPIENT);
    assert!(test_scenario::num_user_events(&effects) == 2, 4);
    let first_coin = test_scenario::take_from_sender<coin::Coin<MockUsdc>>(&scenario);
    let second_coin = test_scenario::take_from_sender<coin::Coin<MockUsdc>>(&scenario);
    assert!(coin::burn_for_testing(first_coin) + coin::burn_for_testing(second_coin) == 50, 5);
    test_scenario::end(scenario);
}

#[test]
fun payouts_from_different_categories_update_only_selected_categories() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_confirmed_treasury(
        &mut scenario,
        b"demo-different-categories",
        100,
        vector[b"food", b"venue", b"reserve"],
        vector[50, 30, 20],
    );

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::payout(
        &mut treasury,
        &cap,
        b"food",
        RECIPIENT,
        10,
        test_scenario::ctx(&mut scenario),
    );
    treasury::payout(
        &mut treasury,
        &cap,
        b"venue",
        RECIPIENT,
        5,
        test_scenario::ctx(&mut scenario),
    );

    assert!(treasury::category_remaining_at(&treasury, 0) == 40, 0);
    assert!(treasury::category_remaining_at(&treasury, 1) == 25, 1);
    assert!(treasury::category_remaining_at(&treasury, 2) == 20, 2);
    assert!(treasury::balance(&treasury) == 85, 3);
    assert!(treasury::accounting_invariant_holds(&treasury), 4);

    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::next_tx(&mut scenario, RECIPIENT);
    let first_coin = test_scenario::take_from_sender<coin::Coin<MockUsdc>>(&scenario);
    let second_coin = test_scenario::take_from_sender<coin::Coin<MockUsdc>>(&scenario);
    assert!(coin::burn_for_testing(first_coin) + coin::burn_for_testing(second_coin) == 15, 5);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 12, location = club_treasury::treasury)]
fun payout_before_allocation_confirmation_is_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_funded_treasury(&mut scenario, b"demo-unconfirmed-payout", 100);

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::payout(
        &mut treasury,
        &cap,
        b"food",
        RECIPIENT,
        1,
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 13, location = club_treasury::treasury)]
fun payout_for_unknown_category_is_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_confirmed_treasury(
        &mut scenario,
        b"demo-unknown-category",
        100,
        vector[b"food"],
        vector[100],
    );

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::payout(
        &mut treasury,
        &cap,
        b"missing",
        RECIPIENT,
        1,
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 14, location = club_treasury::treasury)]
fun zero_payout_is_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_confirmed_treasury(
        &mut scenario,
        b"demo-zero-payout",
        100,
        vector[b"food"],
        vector[100],
    );

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::payout(
        &mut treasury,
        &cap,
        b"food",
        RECIPIENT,
        0,
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 15, location = club_treasury::treasury)]
fun zero_address_recipient_is_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_confirmed_treasury(
        &mut scenario,
        b"demo-zero-recipient",
        100,
        vector[b"food"],
        vector[100],
    );

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::payout(
        &mut treasury,
        &cap,
        b"food",
        @0x0,
        1,
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 16, location = club_treasury::treasury)]
fun payout_greater_than_category_remaining_is_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_confirmed_treasury(
        &mut scenario,
        b"demo-over-category",
        100,
        vector[b"food", b"venue"],
        vector[40, 60],
    );

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::payout(
        &mut treasury,
        &cap,
        b"food",
        RECIPIENT,
        41,
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 16, location = club_treasury::treasury)]
fun payout_after_category_remaining_reaches_zero_is_rejected() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_confirmed_treasury(
        &mut scenario,
        b"demo-depleted-category",
        100,
        vector[b"food"],
        vector[100],
    );

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::payout(
        &mut treasury,
        &cap,
        b"food",
        RECIPIENT,
        100,
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::payout(
        &mut treasury,
        &cap,
        b"food",
        RECIPIENT,
        1,
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 0, location = club_treasury::treasury)]
fun unauthorized_sender_cannot_payout() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_confirmed_treasury(
        &mut scenario,
        b"demo-unauthorized-payout",
        100,
        vector[b"food"],
        vector[100],
    );

    test_scenario::next_tx(&mut scenario, ATTACKER);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_address<TreasurerCap<MockUsdc>>(&scenario, ADMIN);
    treasury::payout(
        &mut treasury,
        &cap,
        b"food",
        RECIPIENT,
        1,
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_address(ADMIN, cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 1, location = club_treasury::treasury)]
fun capability_for_another_treasury_cannot_payout() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_confirmed_treasury(
        &mut scenario,
        b"demo-first-payout",
        100,
        vector[b"food"],
        vector[100],
    );

    test_scenario::next_tx(&mut scenario, ADMIN);
    let first_treasury_id =
        test_scenario::most_recent_id_shared<Treasury<MockUsdc>>().destroy_some();
    treasury::create<MockUsdc>(b"demo-second-payout", test_scenario::ctx(&mut scenario));

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut first_treasury =
        test_scenario::take_shared_by_id<Treasury<MockUsdc>>(&scenario, first_treasury_id);
    let second_cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::payout(
        &mut first_treasury,
        &second_cap,
        b"food",
        RECIPIENT,
        1,
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(first_treasury);
    test_scenario::return_to_sender(&scenario, second_cap);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = 18, location = club_treasury::treasury)]
fun corrupted_accounting_is_rejected_before_payout() {
    let mut scenario = test_scenario::begin(ADMIN);
    create_confirmed_treasury(
        &mut scenario,
        b"demo-corrupt-accounting",
        100,
        vector[b"food"],
        vector[100],
    );

    test_scenario::next_tx(&mut scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(&scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(&scenario);
    treasury::corrupt_category_remaining_for_testing(&mut treasury, 0, 99);
    treasury::payout(
        &mut treasury,
        &cap,
        b"food",
        RECIPIENT,
        1,
        test_scenario::ctx(&mut scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
    test_scenario::end(scenario);
}

fun create_confirmed_treasury(
    scenario: &mut Scenario,
    external_reference: vector<u8>,
    amount: u64,
    references: vector<vector<u8>>,
    allocations: vector<u64>,
) {
    create_funded_treasury(scenario, external_reference, amount);

    test_scenario::next_tx(scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(scenario);
    let cap = test_scenario::take_from_sender<TreasurerCap<MockUsdc>>(scenario);
    treasury::confirm_allocations(
        &mut treasury,
        &cap,
        references,
        allocations,
        test_scenario::ctx(scenario),
    );
    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(scenario, cap);
}

fun create_funded_treasury(
    scenario: &mut Scenario,
    external_reference: vector<u8>,
    amount: u64,
) {
    treasury::create<MockUsdc>(external_reference, test_scenario::ctx(scenario));

    test_scenario::next_tx(scenario, ADMIN);
    let mut treasury = test_scenario::take_shared<Treasury<MockUsdc>>(scenario);
    let payment = coin::mint_for_testing<MockUsdc>(amount, test_scenario::ctx(scenario));
    treasury::deposit(&mut treasury, payment);
    test_scenario::return_shared(treasury);
}
