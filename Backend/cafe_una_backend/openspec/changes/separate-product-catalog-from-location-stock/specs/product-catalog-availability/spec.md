# Product Catalog Availability Specification

## Purpose

Define ecommerce availability, featured eligibility, compatibility output, and field-aware authorization.

## Requirements

### Requirement: Central-only Ecommerce Availability

Ecommerce visibility MUST be derived exclusively from the product's available quantity at `BODEGA_CENTRAL`. A product MUST NOT become visible because stock exists at a sales point or any other location.

#### Scenario: Show a centrally stocked product

- GIVEN an ecommerce-eligible product has positive `BODEGA_CENTRAL` stock
- WHEN ecommerce availability is evaluated
- THEN the product MUST be eligible for visibility

#### Scenario: Hide a product with zero central stock

- GIVEN a product has zero `BODEGA_CENTRAL` stock
- AND one or more sales points have positive stock
- WHEN ecommerce availability is evaluated
- THEN the product MUST NOT be eligible for visibility

#### Scenario: Treat a missing central balance as unavailable

- GIVEN a product has no `BODEGA_CENTRAL` balance
- WHEN ecommerce availability is evaluated
- THEN its available central quantity MUST be treated as zero
- AND the product MUST NOT be eligible for visibility

### Requirement: Central-only Featured Eligibility

A product MUST be eligible to remain or become featured only when its `BODEGA_CENTRAL` available quantity is greater than zero. Stock at other locations MUST NOT satisfy this requirement.

#### Scenario: Feature a centrally available product

- GIVEN a product has positive `BODEGA_CENTRAL` stock
- WHEN an authorized catalog user marks it as featured
- THEN the request MAY succeed subject to existing catalog limits

#### Scenario: Reject featured status without central stock

- GIVEN a product has zero central stock and positive sales-point stock
- WHEN an authorized catalog user marks it as featured
- THEN the operation MUST be rejected
- AND the featured state MUST remain unchanged

#### Scenario: Central stock reaches zero

- GIVEN a featured product has positive central stock
- WHEN a committed stock change makes its central quantity zero
- THEN subsequent ecommerce results MUST NOT present it as eligible for visibility or featured placement

### Requirement: Transitional Stock Contract

During the compatibility period, the API field named `stock` MUST represent only the `BODEGA_CENTRAL` quantity. Existing supported request and response casing MUST remain accepted and emitted consistently.

#### Scenario: Read compatibility stock

- GIVEN central stock is 3 and a sales point has 20 units
- WHEN an authorized consumer reads the product
- THEN `stock` MUST equal 3

#### Scenario: Update stock through a supported legacy contract

- GIVEN an authorized stock manager submits a supported stock field casing
- WHEN the request commits successfully
- THEN central balance and compatibility `stock` MUST contain the same resulting quantity

#### Scenario: Reject invalid compatibility stock

- GIVEN a supported request contains a negative or non-whole stock value
- WHEN the request is validated
- THEN the request MUST be rejected
- AND no catalog field or balance MUST change

### Requirement: Field-aware Product Authorization

Catalog-field permission and stock-management permission MUST be evaluated independently. Possessing one permission MUST NOT grant the other.

#### Scenario: Stock manager changes only stock

- GIVEN a user has stock-management permission but lacks catalog-management permission
- WHEN the user submits only a valid stock change
- THEN the stock change MAY succeed

#### Scenario: Stock manager attempts a catalog change

- GIVEN a user has stock-management permission but lacks catalog-management permission
- WHEN the same request attempts to change stock and a catalog field
- THEN the entire request MUST be denied
- AND neither stock nor catalog data MUST change

#### Scenario: Catalog manager attempts a stock change

- GIVEN a user has catalog-management permission but lacks stock-management permission
- WHEN the user attempts to change stock
- THEN the stock change MUST be denied
- AND the existing central quantity MUST remain unchanged
