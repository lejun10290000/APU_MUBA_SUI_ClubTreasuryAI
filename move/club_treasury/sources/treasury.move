module club_treasury::treasury;

use std::vector;
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::object::{Self, ID, UID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

const ENotTreasurer: u64 = 0;
const ECapabilityMismatch: u64 = 1;
const EEmptyExternalReference: u64 = 2;
const EZeroDeposit: u64 = 3;
const EAllocationsAlreadyConfirmed: u64 = 4;
const EEmptyCategoryList: u64 = 5;
const ECategoryVectorLengthMismatch: u64 = 6;
const EEmptyCategoryReference: u64 = 7;
const EZeroCategoryAllocation: u64 = 8;
const EDuplicateCategoryReference: u64 = 9;
const EAllocationTotalMismatch: u64 = 10;
const EDepositAfterConfirmation: u64 = 11;

/// Shared on-chain identity and authorization state for one club/event treasury.
/// `Asset` keeps the treasury type-bound to its eventual payment coin; the MVP
/// will instantiate this with native Circle-issued Sui Testnet USDC.
public struct Treasury<phantom Asset> has key {
    id: UID,
    treasurer: address,
    external_reference: vector<u8>,
    metadata_revision: u64,
    funds: Balance<Asset>,
    category_references: vector<vector<u8>>,
    category_allocated: vector<u64>,
    category_remaining: vector<u64>,
    allocations_confirmed: bool,
}

/// An address-owned, module-controlled capability for privileged treasury work.
/// The missing `store` ability prevents arbitrary transfers outside this module.
public struct TreasurerCap<phantom Asset> has key {
    id: UID,
    treasury_id: ID,
    treasurer: address,
}

/// Creates and shares one empty treasury foundation and gives its creator the
/// matching administrator capability. Funding and payouts are later Stage 3 work.
public fun create<Asset>(external_reference: vector<u8>, ctx: &mut TxContext) {
    assert!(!vector::is_empty(&external_reference), EEmptyExternalReference);

    let treasurer = tx_context::sender(ctx);
    let treasury = Treasury<Asset> {
        id: object::new(ctx),
        treasurer,
        external_reference,
        metadata_revision: 0,
        funds: balance::zero(),
        category_references: vector[],
        category_allocated: vector[],
        category_remaining: vector[],
        allocations_confirmed: false,
    };
    let treasury_id = object::id(&treasury);
    let cap = TreasurerCap<Asset> {
        id: object::new(ctx),
        treasury_id,
        treasurer,
    };

    transfer::share_object(treasury);
    transfer::transfer(cap, treasurer);
}

/// Minimal privileged mutation used to prove the Stage 3 authorization boundary.
public fun set_external_reference<Asset>(
    treasury: &mut Treasury<Asset>,
    cap: &TreasurerCap<Asset>,
    external_reference: vector<u8>,
    ctx: &TxContext,
) {
    assert_authorized(treasury, cap, ctx);
    assert!(!vector::is_empty(&external_reference), EEmptyExternalReference);

    treasury.external_reference = external_reference;
    treasury.metadata_revision = treasury.metadata_revision + 1;
}

/// Moves a positive amount of the treasury's exact asset type into custody.
/// Deposits are permissionless and do not grant or alter withdrawal authority.
public fun deposit<Asset>(treasury: &mut Treasury<Asset>, payment: Coin<Asset>) {
    assert!(!treasury.allocations_confirmed, EDepositAfterConfirmation);
    assert!(coin::value(&payment) > 0, EZeroDeposit);
    balance::join(&mut treasury.funds, coin::into_balance(payment));
}

/// Confirms the complete category allocation exactly once. Opaque category
/// references and all amounts use deterministic on-chain byte/base-unit values.
public fun confirm_allocations<Asset>(
    treasury: &mut Treasury<Asset>,
    cap: &TreasurerCap<Asset>,
    mut references: vector<vector<u8>>,
    mut allocations: vector<u64>,
    ctx: &TxContext,
) {
    assert_authorized(treasury, cap, ctx);
    assert!(!treasury.allocations_confirmed, EAllocationsAlreadyConfirmed);

    let category_count = vector::length(&references);
    assert!(category_count > 0, EEmptyCategoryList);
    assert!(category_count == vector::length(&allocations), ECategoryVectorLengthMismatch);

    let mut confirmed_references = vector[];
    let mut confirmed_allocated = vector[];
    let mut confirmed_remaining = vector[];
    let mut total_allocated = 0;

    while (!vector::is_empty(&references)) {
        let reference = vector::remove(&mut references, 0);
        let allocated = vector::remove(&mut allocations, 0);

        assert!(!vector::is_empty(&reference), EEmptyCategoryReference);
        assert!(allocated > 0, EZeroCategoryAllocation);
        assert!(
            !contains_reference(&confirmed_references, &reference),
            EDuplicateCategoryReference,
        );

        total_allocated = total_allocated + allocated;
        vector::push_back(&mut confirmed_references, reference);
        vector::push_back(&mut confirmed_allocated, allocated);
        vector::push_back(&mut confirmed_remaining, allocated);
    };

    assert!(total_allocated == balance::value(&treasury.funds), EAllocationTotalMismatch);

    treasury.category_references = confirmed_references;
    treasury.category_allocated = confirmed_allocated;
    treasury.category_remaining = confirmed_remaining;
    treasury.allocations_confirmed = true;
}

fun contains_reference(references: &vector<vector<u8>>, candidate: &vector<u8>): bool {
    let mut index = 0;
    while (index < vector::length(references)) {
        if (vector::borrow(references, index) == candidate) {
            return true
        };
        index = index + 1;
    };
    false
}

fun assert_authorized<Asset>(
    treasury: &Treasury<Asset>,
    cap: &TreasurerCap<Asset>,
    ctx: &TxContext,
) {
    assert!(cap.treasury_id == object::id(treasury), ECapabilityMismatch);
    assert!(
        cap.treasurer == treasury.treasurer && tx_context::sender(ctx) == treasury.treasurer,
        ENotTreasurer,
    );
}

public fun id<Asset>(treasury: &Treasury<Asset>): ID {
    object::id(treasury)
}

public fun treasurer<Asset>(treasury: &Treasury<Asset>): address {
    treasury.treasurer
}

public fun external_reference<Asset>(treasury: &Treasury<Asset>): &vector<u8> {
    &treasury.external_reference
}

public fun metadata_revision<Asset>(treasury: &Treasury<Asset>): u64 {
    treasury.metadata_revision
}

/// Returns the exact native base-unit amount currently held by the treasury.
public fun balance<Asset>(treasury: &Treasury<Asset>): u64 {
    balance::value(&treasury.funds)
}

public fun allocations_confirmed<Asset>(treasury: &Treasury<Asset>): bool {
    treasury.allocations_confirmed
}

public fun category_count<Asset>(treasury: &Treasury<Asset>): u64 {
    vector::length(&treasury.category_references)
}

public fun category_reference_at<Asset>(treasury: &Treasury<Asset>, index: u64): &vector<u8> {
    vector::borrow(&treasury.category_references, index)
}

public fun category_allocated_at<Asset>(treasury: &Treasury<Asset>, index: u64): u64 {
    *vector::borrow(&treasury.category_allocated, index)
}

public fun category_remaining_at<Asset>(treasury: &Treasury<Asset>, index: u64): u64 {
    *vector::borrow(&treasury.category_remaining, index)
}

public fun cap_treasury_id<Asset>(cap: &TreasurerCap<Asset>): ID {
    cap.treasury_id
}

public fun cap_treasurer<Asset>(cap: &TreasurerCap<Asset>): address {
    cap.treasurer
}
