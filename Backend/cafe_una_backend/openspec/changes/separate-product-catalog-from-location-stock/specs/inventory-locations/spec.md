# Inventory Locations Specification

## Purpose

Define stable inventory locations and the unique central location used for ecommerce availability.

## Requirements

### Requirement: Stable Location Identity

Each inventory location MUST have a unique, stable code. The system MUST reserve `BODEGA_CENTRAL` as the sole central location and MUST NOT silently reassign that code to another location.

#### Scenario: Create the central location during migration

- GIVEN no location has code `BODEGA_CENTRAL`
- WHEN the inventory-location migration runs
- THEN exactly one location with code `BODEGA_CENTRAL` MUST exist
- AND that location MUST be identifiable as active

#### Scenario: Re-run central-location creation

- GIVEN the `BODEGA_CENTRAL` location already exists
- WHEN the migration is executed again or safely resumed
- THEN no duplicate location MUST be created
- AND the existing location identity MUST be preserved

#### Scenario: Reject a duplicate location code

- GIVEN an inventory location already uses a code
- WHEN another location is persisted with the same code
- THEN the operation MUST fail without changing either location

### Requirement: Central Location Continuity

The system MUST keep `BODEGA_CENTRAL` resolvable while product availability or legacy stock compatibility depends on it. It MUST NOT allow ordinary inventory operations to delete or change its code.

#### Scenario: Reject central code mutation

- GIVEN `BODEGA_CENTRAL` is the configured ecommerce source
- WHEN an authorized inventory operator attempts to change its code
- THEN the operation MUST be rejected
- AND ecommerce source resolution MUST remain unchanged

#### Scenario: Reject unauthorized location mutation

- GIVEN a user lacks location-management permission
- WHEN the user attempts to create, rename, activate, or deactivate a location
- THEN the operation MUST be denied
- AND no location state MUST change

### Requirement: Explicit Location State

The system MUST distinguish active and inactive locations. An inactive location MUST remain identifiable for persisted balances but MUST NOT become the ecommerce source unless it is `BODEGA_CENTRAL` and has been restored to active status.

#### Scenario: Preserve an inactive location reference

- GIVEN a non-central location has an existing product balance
- WHEN the location becomes inactive
- THEN its identity and balance reference MUST remain readable to authorized workflows
- AND it MUST NOT be treated as `BODEGA_CENTRAL`
