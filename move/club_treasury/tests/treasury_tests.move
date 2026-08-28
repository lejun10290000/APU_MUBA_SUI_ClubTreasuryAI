#[test_only]
module club_treasury::treasury_tests;

use club_treasury::treasury::{Self, TreasurerCap, Treasury};
use sui::test_scenario;

const ADMIN: address = @0xA11CE;
const ATTACKER: address = @0xBAD;

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

    test_scenario::return_shared(treasury);
    test_scenario::return_to_sender(&scenario, cap);
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
