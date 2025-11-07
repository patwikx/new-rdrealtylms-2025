# Asset Depreciation Schema Enhancement for Pre-Depreciated Assets

## Problem Statement
When entering assets that were already depreciating before system implementation, we need to:
- Record original purchase details (cost, date, useful life)
- Account for depreciation that occurred before system entry
- Only depreciate remaining book value going forward

## Proposed Schema Changes

### 1. Add Pre-Depreciation Fields to Asset Model

```prisma
model Asset {
  // ... existing fields ...
  
  // Original asset information
  originalPurchaseDate   DateTime?  // When asset was originally purchased
  originalPurchasePrice  Decimal?   @db.Decimal(12, 2) // Original cost
  originalUsefulLifeYears Int?      // Original expected life
  originalUsefulLifeMonths Int?     // Original expected life in months
  
  // Pre-system depreciation tracking
  priorDepreciationAmount Decimal   @default(0) @db.Decimal(12, 2) // Depreciation before system
  priorDepreciationMonths Int       @default(0) // Months depreciated before system
  systemEntryDate        DateTime?  // When asset was entered into system
  systemEntryBookValue   Decimal?   @db.Decimal(12, 2) // Book value at system entry
  
  // Remaining depreciation (calculated fields)
  remainingUsefulLifeYears  Int?    // Remaining years to depreciate
  remainingUsefulLifeMonths Int?    // Remaining months to depreciate
  
  // Flags
  isPreDepreciated       Boolean   @default(false) // Asset had prior depreciation
  useSystemEntryAsStart  Boolean   @default(false) // Start depreciation from system entry date
  
  // ... rest of existing fields ...
}
```

### 2. Enhanced AssetDepreciation Model

```prisma
model AssetDepreciation {
  // ... existing fields ...
  
  // Enhanced tracking
  isPriorPeriodAdjustment Boolean  @default(false) // For recording prior depreciation
  priorPeriodStartDate    DateTime? // Start of prior period
  priorPeriodEndDate      DateTime? // End of prior period
  
  // ... rest of existing fields ...
}
```

## Implementation Strategy

### Phase 1: Schema Migration
1. Add new fields to Asset model
2. Update existing assets with default values
3. Create migration scripts

### Phase 2: UI Enhancements
1. Add "Pre-Depreciated Asset" checkbox to asset creation form
2. Show/hide additional fields based on checkbox
3. Add validation for pre-depreciation scenarios

### Phase 3: Calculation Logic
1. Update depreciation calculation service
2. Handle pre-depreciated assets in scheduler
3. Create adjustment entries for prior depreciation

## Example Scenarios

### Scenario 1: Asset Purchased 2 Years Ago
- Original Purchase: Jan 1, 2022, $10,000, 5-year life
- System Entry: Jan 1, 2024 (2 years later)
- Prior Depreciation: $4,000 (2 years × $2,000/year)
- System Entry Book Value: $6,000
- Remaining Life: 3 years
- Future Monthly Depreciation: $6,000 ÷ 36 months = $166.67/month

### Scenario 2: Mid-Year Entry
- Original Purchase: Mar 15, 2023, $12,000, 4-year life
- System Entry: Sep 15, 2024 (18 months later)
- Prior Depreciation: $4,500 (18 months × $250/month)
- System Entry Book Value: $7,500
- Remaining Life: 30 months
- Future Monthly Depreciation: $7,500 ÷ 30 months = $250/month

## Benefits
1. **Accurate Financial Reporting**: Complete depreciation history
2. **Compliance**: Proper asset lifecycle tracking
3. **Flexibility**: Handle various pre-depreciation scenarios
4. **Audit Trail**: Clear distinction between prior and system depreciation
5. **Correct Book Values**: Assets show true remaining value

## Migration Considerations
- Existing assets default to `isPreDepreciated = false`
- No impact on current depreciation calculations
- Optional fields ensure backward compatibility
- Can be implemented incrementally