# Location Product Balances Specification

## Purpose

Define non-negative product quantities by location and safe global-stock transition.

## Requirements

### Requirement: Unique Non-negative Balance

The system MUST maintain one balance per product-location pair. Quantities MUST be non-negative whole numbers.

#### Scenario: Establish a product balance

- GIVEN a product and active location have no balance
- WHEN an authorized stock operation establishes quantity 12
- THEN one balance for that product-location pair MUST contain 12

#### Scenario: Reject an invalid quantity

- GIVEN a product-location balance
- WHEN an operation would persist a negative or non-whole quantity
- THEN the operation MUST fail
- AND the previous quantity MUST remain unchanged

#### Scenario: Reject a duplicate balance

- GIVEN a balance already exists for a product-location pair
- WHEN another balance is created for the same pair
- THEN the operation MUST fail without creating a duplicate

### Requirement: Authorized Atomic Stock Changes

Only users with stock-management permission MAY change balances. Accepted changes MUST be atomic.

#### Scenario: Apply an authorized adjustment

- GIVEN an authorized user and balance 10
- WHEN the user applies an adjustment of 4
- THEN the committed balance MUST be 14

#### Scenario: Deny an unauthorized adjustment

- GIVEN a user lacks stock permission
- WHEN the user attempts to change a balance
- THEN the operation MUST be denied
- AND the balance MUST remain unchanged

#### Scenario: Prevent concurrent overselling

- GIVEN central stock is 5
- WHEN two concurrent operations each attempt to decrement 4 units
- THEN at most one operation MUST succeed
- AND the committed balance MUST never be negative

#### Scenario: Roll back an incomplete stock change

- GIVEN a required update fails during a stock change
- WHEN the operation cannot complete in full
- THEN every change from that operation MUST be rolled back
- AND prior quantities MUST remain consistent

### Requirement: Idempotent Central Backfill

Migration MUST create central balances from legacy `stock` without changing it. Re-runs MUST NOT duplicate or add quantities.

#### Scenario: Backfill an existing stock value

- GIVEN legacy stock is 7 and no central balance exists
- WHEN the backfill runs
- THEN its `BODEGA_CENTRAL` balance MUST equal 7
- AND its legacy stock MUST remain 7

#### Scenario: Backfill zero stock

- GIVEN legacy stock is 0 and no central balance exists
- WHEN the backfill runs
- THEN its `BODEGA_CENTRAL` balance MUST equal 0

#### Scenario: Resume an interrupted backfill

- GIVEN some products already have reconciled central balances
- WHEN the backfill resumes
- THEN reconciled balances MUST remain unchanged
- AND missing balances MUST be populated from their legacy values

### Requirement: Compatibility Mirror and Reconciliation

Central balance changes MUST atomically mirror to legacy `stock`. Non-central balances MUST NOT change it. Reconciliation MUST detect drift without overwriting values.

#### Scenario: Mirror a central adjustment

- GIVEN central balance and legacy stock equal 9
- WHEN an authorized operation commits central quantity 6
- THEN central balance and legacy stock MUST both equal 6

#### Scenario: Ignore a non-central adjustment for compatibility

- GIVEN legacy stock equals central stock
- WHEN a non-central balance changes
- THEN legacy stock MUST remain equal to the central balance

#### Scenario: Report reconciliation drift

- GIVEN central and legacy stock differ
- WHEN reconciliation is evaluated
- THEN the product MUST be reported inconsistent
- AND neither value MUST be silently selected as the replacement

#### Scenario: Refuse unsafe rollback

- GIVEN balances contain drift or non-central data
- WHEN rollback would discard or misrepresent that data
- THEN rollback MUST be refused with a diagnosable result
- AND existing data MUST remain unchanged
