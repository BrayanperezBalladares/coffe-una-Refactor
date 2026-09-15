# Frontend Product Contract Specification

## Purpose

Define one canonical frontend product contract while the backend compatibility API may use different field casing or partial stock data.

## Requirements

### Requirement: Canonical frontend model

Frontend consumers MUST receive a canonical camelCase product model regardless of compatible backend field casing.

#### Scenario: camelCase response

- GIVEN the backend returns supported camelCase product fields
- WHEN the response is accepted
- THEN consumers MUST receive the canonical camelCase model
- AND supported values MUST retain their meaning

#### Scenario: PascalCase compatibility response

- GIVEN the backend returns supported PascalCase compatibility fields
- WHEN the response is accepted
- THEN consumers MUST receive the same canonical camelCase model
- AND casing differences MUST NOT leak into page behavior

#### Scenario: Conflicting aliases

- GIVEN both supported aliases exist with different values
- WHEN normalization runs
- THEN the approved compatibility precedence MUST be applied consistently
- AND the conflict MUST NOT produce a mixed model

### Requirement: Outbound compatibility mapping

Product requests MUST map canonical camelCase input to the approved backend contract and MUST exclude global stock and sales-point stock from catalog payloads.

#### Scenario: Catalog request mapping

- GIVEN a valid canonical catalog draft
- WHEN a create or edit request is prepared
- THEN supported fields MUST use the approved backend names and value types
- AND catalog payloads MUST NOT contain global or sales-point stock

#### Scenario: Stock request mapping

- GIVEN a valid Bodega Central stock draft
- WHEN a stock request is prepared
- THEN the request MUST identify Bodega Central and its quantity
- AND catalog-only changes MUST NOT be inferred from that request

### Requirement: Missing and partial data safety

The contract MUST preserve usable catalog fields when stock data is missing, partial, malformed, or unavailable and MUST represent stock confidence explicitly.

#### Scenario: Catalog without stock payload

- GIVEN a valid product payload omits stock data
- WHEN normalization completes
- THEN the catalog product MUST remain usable
- AND Bodega Central stock MUST be represented as unknown or not configured

#### Scenario: Partial stock payload

- GIVEN stock data identifies Bodega Central but omits a required eligibility value
- WHEN normalization completes
- THEN the missing value MUST NOT be fabricated
- AND ecommerce and featured eligibility MUST fail closed

#### Scenario: Invalid product payload

- GIVEN required catalog identity data is malformed or absent
- WHEN normalization is attempted
- THEN the invalid record MUST NOT be treated as a valid product
- AND the consumer MUST receive a recoverable failure state

### Requirement: Request validation and error boundaries

The contract MUST reject invalid request values before transport and MUST keep catalog and stock failures distinguishable.

#### Scenario: Invalid outbound values

- GIVEN a canonical draft violates an approved type or limit
- WHEN request mapping is attempted
- THEN the request MUST NOT be sent
- AND field-level validation information MUST be returned to the form

#### Scenario: Stock endpoint failure

- GIVEN catalog normalization succeeds and the stock request fails
- WHEN results are exposed to consumers
- THEN the catalog result MUST remain successful
- AND the stock failure MUST remain independently retryable

### Requirement: Eligibility source contract

The normalized model MUST expose Bodega Central as the sole stock source used for ecommerce visibility and featured eligibility.

#### Scenario: Sales-point data accompanies central data

- GIVEN a response contains Bodega Central and sales-point stock
- WHEN the eligibility input is normalized
- THEN only available Bodega Central stock MUST supply the eligibility value
- AND sales-point stock MUST NOT increase, replace, or enable it
