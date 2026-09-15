# Admin Product Catalog Specification

## Purpose

Define an accessible administrative catalog that manages product identity and merchandising independently from stock by location.

## Requirements

### Requirement: Catalog browsing

The interface MUST let authorized users browse and filter catalog records without requiring stock data.

#### Scenario: Catalog loads

- GIVEN an authorized user and available catalog data
- WHEN the catalog screen opens
- THEN products MUST be shown with catalog fields and status
- AND stock controls MUST NOT appear inside catalog fields

#### Scenario: Filter products

- GIVEN loaded catalog records
- WHEN the user enters a supported search or filter value
- THEN the visible records MUST match that value
- AND the result count or empty result MUST be perceivable

### Requirement: Independent request states

The interface MUST represent catalog loading, empty, and failure states independently from Bodega Central stock states.

#### Scenario: Catalog is loading

- GIVEN the catalog request is pending
- WHEN the screen renders
- THEN a non-blocking loading state MUST identify the catalog region
- AND unavailable actions MUST be disabled

#### Scenario: Catalog request fails

- GIVEN the catalog request fails
- WHEN the screen renders the failure
- THEN it MUST explain the failure and provide a retry action
- AND a stock error MUST NOT be presented as the catalog error

#### Scenario: Catalog is empty

- GIVEN the catalog request succeeds with no records
- WHEN the screen renders
- THEN it MUST show an explicit empty state
- AND an authorized creator MUST have a clear create action

### Requirement: Catalog authorization

The interface MUST expose catalog actions only when the current user has the corresponding permission and MUST NOT rely on hidden controls as authorization enforcement.

#### Scenario: Read-only user

- GIVEN a user may view but not create or edit products
- WHEN the catalog renders
- THEN product information MUST remain available
- AND create, edit, archive, and stock mutation actions MUST NOT be offered

#### Scenario: Permission is denied during an action

- GIVEN an action becomes unauthorized after rendering
- WHEN the request is rejected
- THEN the interface MUST preserve catalog content
- AND MUST announce that permission is required without claiming success

### Requirement: Catalog form

The create and edit form MUST contain only catalog fields, MUST validate explicit limits on blur and submit, and MUST NOT accept global or sales-point stock.

#### Scenario: Valid catalog submission

- GIVEN an authorized user provides valid catalog values
- WHEN the user submits the form
- THEN the interface MUST show pending feedback and prevent duplicate submission
- AND MUST confirm success before closing or updating the record

#### Scenario: Invalid catalog submission

- GIVEN one or more catalog values are invalid
- WHEN validation runs
- THEN each error MUST identify the correction near its field
- AND focus MUST move to the first invalid field after submit

### Requirement: Responsive and accessible operation

The catalog MUST remain operable at 375, 768, 1024, and 1440 CSS pixels, with semantic controls, visible focus, and targets of at least 44 by 44 CSS pixels.

#### Scenario: Small viewport operation

- GIVEN a 375 CSS-pixel viewport
- WHEN the user browses, filters, or opens the form
- THEN the page MUST NOT overflow horizontally
- AND filters, row actions, and full-screen form actions MUST remain keyboard and touch reachable

#### Scenario: Desktop operation

- GIVEN a viewport of at least 1024 CSS pixels
- WHEN catalog records render in a table
- THEN headers and actions MUST have accessible names
- AND any overflow MUST remain inside the table container
