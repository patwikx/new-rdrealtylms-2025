# Pre-Depreciation Asset Form - Usage Example

## How to Use the New Pre-Depreciation Feature

### Scenario: Adding a Computer Purchased 18 Months Ago

**Asset Details:**
- Computer purchased March 1, 2023 for $15,000
- 5-year useful life (60 months)
- Already depreciated for 18 months
- Being entered into system on September 1, 2024

### Step-by-Step Form Completion

#### 1. Basic Information
- **Category**: Select "Computer Equipment"
- **Item Code**: Auto-generated (e.g., COMP001)
- **Description**: "Dell Laptop Computer"
- **Status**: "Available"

#### 2. Purchase Information
- **Purchase Date**: September 1, 2024 (system entry date)
- **Purchase Price**: $15,000 (for reference)

#### 3. Depreciation Configuration
- **Method**: Straight Line
- **Useful Life**: 5 years
- **Salvage Value**: $0

#### 4. Pre-Depreciation Configuration ✨
1. **Check**: "This asset was already depreciating before system entry"

2. **Fill in the expanded fields**:
   - **Original Purchase Date**: March 1, 2023
   - **Original Purchase Price**: $15,000
   - **System Entry Date**: September 1, 2024
   - **Original Useful Life**: 5 years
   - **Prior Depreciation Amount**: $4,500 (18 months × $250/month)
   - **Prior Depreciation Months**: 18
   - **System Entry Book Value**: $10,500
   - **Check**: "Start future depreciation from system entry date"

#### 5. Preview Shows
- **Original Cost**: $15,000
- **Prior Depreciation**: $4,500
- **Calculated Book Value**: $10,500
- **Entry Book Value**: $10,500 ✅
- **Est. Monthly Depreciation**: $250/month (for remaining 42 months)

## What Happens in the Database

### Asset Record Created
```json
{
  "itemCode": "COMP001",
  "description": "Dell Laptop Computer",
  "purchaseDate": "2024-09-01",
  "purchasePrice": 15000.00,
  
  // Pre-depreciation tracking
  "originalPurchaseDate": "2023-03-01",
  "originalPurchasePrice": 15000.00,
  "originalUsefulLifeYears": 5,
  "priorDepreciationAmount": 4500.00,
  "priorDepreciationMonths": 18,
  "systemEntryDate": "2024-09-01",
  "systemEntryBookValue": 10500.00,
  "isPreDepreciated": true,
  "useSystemEntryAsStart": true,
  
  // Current values
  "currentBookValue": 10500.00,
  "accumulatedDepreciation": 4500.00,
  "monthlyDepreciation": 250.00,
  "remainingUsefulLifeYears": 3,
  "remainingUsefulLifeMonths": 6,
  "nextDepreciationDate": "2024-10-01"
}
```

### Prior Period Adjustment Entry
The system will create a depreciation record for the prior period:
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
  "isPriorPeriodAdjustment": true,
  "notes": "Prior period depreciation adjustment for 18 months"
}
```

## Benefits

### ✅ Accurate Financial Reporting
- Complete depreciation history from original purchase
- Proper book values at any point in time
- Audit trail for all depreciation

### ✅ Automated Calculations
- System calculates remaining depreciation automatically
- Validates entry book value against calculated value
- Shows warnings for discrepancies

### ✅ Future Depreciation
- Continues depreciation from correct book value
- Uses remaining useful life
- Maintains consistent monthly depreciation

### ✅ Compliance Ready
- Meets accounting standards
- Provides complete asset lifecycle
- Supports regulatory reporting

## Form Validation

The form includes smart validation:
- Original purchase date must be before system entry date
- Prior depreciation cannot exceed original cost
- Entry book value should match calculated book value (warns if different)
- Remaining life must be positive
- All required fields must be filled when pre-depreciation is enabled

## Visual Indicators

- **Blue preview box** shows pre-depreciation summary
- **Warning icon** appears if entry book value differs from calculated
- **Future depreciation preview** shows remaining depreciation calculations
- **Smart field enabling** only shows relevant fields when needed