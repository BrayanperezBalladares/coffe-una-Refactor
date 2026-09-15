# Central Warehouse Stock Specification

## Purpose

Define Bodega Central stock behavior as a location-specific concern and the exclusive inventory source for ecommerce availability and featured eligibility.

## Requirements

### Requirement: Explicit stock source

The interface MUST identify Bodega Central stock separately from catalog data and MUST NOT present it as global stock.

#### Scenario: Central stock is available

- GIVEN a product has a Bodega Central stock result
- WHEN the product inventory state renders
- THEN the available quantity MUST be labeled as Bodega Central stock
- AND sales-point quantities MUST NOT be combined with it

#### Scenario: Central stock data is missing

- GIVEN a product has no Bodega Central stock record
- WHEN the product renders
- THEN the interface MUST show stock as unavailable or not configured
- AND MUST NOT silently interpret the missing value as a confirmed quantity

### Requirement: Ecommerce eligibility invariant

The interface MUST derive ecommerce visibility and featured eligibility only from available Bodega Central stock. Sales-point stock MUST NOT enable either state.

#### Scenario: Positive central availability

- GIVEN Bodega Central reports available stock greater than zero
- WHEN eligibility is evaluated
- THEN the product MAY be eligible for ecommerce visibility
- AND it MAY be eligible to become featured when all catalog rules also pass

#### Scenario: No central availability

- GIVEN Bodega Central available stock is zero, negative, missing, or unknown
- WHEN eligibility is evaluated
- THEN ecommerce visibility MUST be disabled or marked ineligible
- AND featured eligibility MUST be disabled or marked ineligible

#### Scenario: Stock exists only at a sales point

- GIVEN Bodega Central has no available stock and a sales point has stock
- WHEN eligibility is evaluated
- THEN ecommerce visibility MUST remain ineligible
- AND featured eligibility MUST remain ineligible

### Requirement: Independent stock request states

The interface MUST load and report Bodega Central stock independently so a stock failure does not block catalog browsing or catalog editing.

#### Scenario: Stock is loading

- GIVEN catalog data is available and stock is pending
- WHEN the product list renders
- THEN catalog content and permitted catalog actions MUST remain usable
- AND the stock region MUST expose a perceivable loading state

#### Scenario: Stock request fails

- GIVEN catalog data is available and the stock request fails
- WHEN the failure renders
- THEN catalog content MUST remain usable
- AND the stock region MUST explain the failure and offer retry when supported

### Requirement: Stock mutation permissions and validation

The interface MUST allow Bodega Central stock input only to authorized users, through a stock-specific save operation, and MUST reject invalid quantities before submission.

#### Scenario: Authorized stock update

- GIVEN an authorized user enters a valid Bodega Central quantity
- WHEN the stock form is submitted
- THEN the interface MUST identify the location and show pending feedback
- AND success MUST update only the Bodega Central stock state

#### Scenario: Invalid stock quantity

- GIVEN the entered quantity violates the approved numeric constraints
- WHEN validation runs
- THEN submission MUST be prevented
- AND the corrective message MUST be associated with the quantity field

#### Scenario: Unauthorized stock user

- GIVEN a user lacks stock mutation permission
- WHEN the stock region renders
- THEN the current stock MAY be shown if view permission exists
- AND editable stock controls MUST NOT be offered

### Requirement: Accessible stock status

Stock and eligibility states MUST use text in addition to color and MUST remain perceivable on supported mobile and desktop viewports.

#### Scenario: Eligibility changes

- GIVEN an eligibility state is displayed
- WHEN assistive technology reads the product state
- THEN the stock source and eligibility result MUST have accessible text
- AND status meaning MUST NOT depend on color alone
