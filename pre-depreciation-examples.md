# Pre-Depreciated Asset Implementation Examples

## Example 1: Computer Purchased 18 Months Ago

### Scenario
- **Original Purchase**: March 1, 2023
- **Original Cost**: $15,000
- **Original Useful Life**: 5 years (60 months)
- **System Entry Date**: September 1, 2024 (18 months later)
- **Depreciation Method**: Straight Line

### Calculations
```
Monthly Depreciation = $15,000 ÷ 60 months = $250/month
Prior Depreciation = 18 months × $250 = $4,500
System Entry Book Value = $15,000 - $4,500 = $10,500
Remaining Life = 60 - 18 = 42 months
Future Monthly Depreciation = $10,500 ÷ 42 months = $250/month
```

### Database Records

#### Asset Record
```json
{
  "itemCode": "COMP-2024-001",
  "description": "Dell Laptop Computer",
  "purchaseDate": "2024-09-01", // System entry date
  "purchasePrice": 15000.00, // Original cost for reference
  
  // Pre-depreciation fields
  "originalPurchaseDate": "2023-03-01",
  "originalPurchasePrice": 15000.00,
  "originalUsefulLifeYears": 5,
  "originalUsefulLifeMonths": 60,
  
  "priorDepreciationAmount": 4500.00,
  "priorDepreciationMonths": 18,
  "systemEntryDate": "2024-09-01",
  "systemEntryBookValue": 10500.00,
  
  "remainingUsefulLifeYears": 3,
  "remainingUsefulLifeMonths": 42,
  
  "isPreDepreciated": true,
  "useSystemEntryAsStart": true,
  
  "currentBookValue": 10500.00,
  "accumulatedDepreciation": 4500.00, // Prior depreciation
  "depreciationStartDate": "2024-09-01",
  "monthlyDepreciation": 250.00
}
```

#### Prior Period Adjustment Record
```json
{
  "assetId": "asset-uuid",
  "depreciationDate": "2024-09-01",
  "periodStartDate": "2023-03-01",
  "periodEndDate": "2024-09-01",
  
  "bookValueStart": 15000.00,
  "depreciationAmount": 4500.00,
  "bookValueEnd": 10500.00,
  "accumulatedDepreciation": 4500.00,
  
  "method": "STRAIGHT_LINE",
  "isPriorPeriodAdjustment": true,
  "priorPeriodStartDate": "2023-03-01",
  "priorPeriodEndDate": "2024-09-01",
  
  "notes": "Prior period depreciation adjustment for 18 months"
}
```

## Example 2: Vehicle with Mid-Year Purchase

### Scenario
- **Original Purchase**: June 15, 2022
- **Original Cost**: $25,000
- **Original Useful Life**: 8 years
- **System Entry Date**: January 1, 2024 (19 months later)
- **Depreciation Method**: Straight Line

### Calculations
```
Monthly Depreciation = $25,000 ÷ 96 months = $260.42/month
Prior Depreciation = 19 months × $260.42 = $4,948.00
System Entry Book Value = $25,000 - $4,948 = $20,052
Remaining Life = 96 - 19 = 77 months
Future Monthly Depreciation = $20,052 ÷ 77 months = $260.42/month
```

## Implementation in Asset Creation Form

### UI Flow
1. **Standard Asset Entry**
   - Purchase Date, Cost, Useful Life (normal flow)

2. **Pre-Depreciated Asset Checkbox**
   - When checked, shows additional fields:
     - Original Purchase Date
     - Original Purchase Price
     - Months/Years Already Depreciated
     - Current Book Value (calculated or manual entry)

3. **Validation Rules**
   - Original purchase date must be before system entry date
   - Prior depreciation cannot exceed original cost
   - Remaining life must be positive
   - Book value must be reasonable

### Form Fields
```typescript
interface PreDepreciationFields {
  isPreDepreciated: boolean
  originalPurchaseDate?: Date
  originalPurchasePrice?: number
  originalUsefulLifeYears?: number
  originalUsefulLifeMonths?: number
  priorDepreciationAmount?: number
  priorDepreciationMonths?: number
  systemEntryBookValue?: number
}
```

## Depreciation Calculation Service Updates

### Enhanced Calculation Logic
```typescript
function calculateDepreciation(asset: Asset, targetDate: Date) {
  if (asset.isPreDepreciated && asset.useSystemEntryAsStart) {
    // Use system entry book value as starting point
    const startingBookValue = asset.systemEntryBookValue || asset.currentBookValue
    const remainingMonths = asset.remainingUsefulLifeMonths || 
                           calculateRemainingMonths(asset)
    
    return startingBookValue / remainingMonths
  } else {
    // Standard depreciation calculation
    return (asset.purchasePrice - asset.salvageValue) / 
           (asset.usefulLifeMonths || asset.usefulLifeYears * 12)
  }
}
```

## Benefits of This Approach

### 1. **Accurate Financial Reporting**
- Complete depreciation history from original purchase
- Proper book values at any point in time
- Audit trail for all depreciation

### 2. **Flexible Implementation**
- Can handle various pre-depreciation scenarios
- Supports different depreciation methods
- Maintains backward compatibility

### 3. **Compliance Ready**
- Meets accounting standards for asset tracking
- Provides complete asset lifecycle documentation
- Supports regulatory reporting requirements

### 4. **User-Friendly**
- Simple checkbox to enable pre-depreciation mode
- Automatic calculations where possible
- Clear validation and error messages

## Migration Strategy

### Phase 1: Schema Update
- Add new fields to Asset and AssetDepreciation models
- Create database migration
- Update existing assets with default values

### Phase 2: Service Layer Updates
- Enhance depreciation calculation service
- Update asset creation/update logic
- Add validation for pre-depreciation scenarios

### Phase 3: UI Implementation
- Add pre-depreciation fields to asset forms
- Implement conditional field display
- Add calculation helpers and validation

### Phase 4: Testing & Rollout
- Test with various pre-depreciation scenarios
- Validate calculations against manual calculations
- Train users on new functionality