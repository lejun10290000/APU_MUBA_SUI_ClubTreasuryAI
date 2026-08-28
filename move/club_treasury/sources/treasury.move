module club_treasury::treasury;

use std::vector;
use sui::object::{Self, ID, UID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

const ENotTreasurer: u64 = 0;
const ECapabilityMismatch: u64 = 1;
const EEmptyExternalReference: u64 = 2;

/// Shared on-chain identity and authorization state for one club/event treasury.
/// `Asset` keeps the treasury type-bound to its eventual payment coin; the MVP
/// will instantiate this with native Circle-issued Sui Testnet USDC.
public struct Treasury<phantom Asset> has key {
    id: UID,
    treasurer: address,
    external_reference: vector<u8>,
    metadata_revision: u64,
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

public fun cap_treasury_id<Asset>(cap: &TreasurerCap<Asset>): ID {
    cap.treasury_id
}

public fun cap_treasurer<Asset>(cap: &TreasurerCap<Asset>): address {
    cap.treasurer
}
