# Depreciation Reports Implementation

## Overview
Implementation of comprehensive depreciation reporting system with proper accounting integration and lapsing considerations.

## Reports Implemented

### 1. Summary Dashboard Reports ✅
- **Location**: `components/reports/depreciation-summary-view.tsx`
- **Features**:
  - Total asset value vs. current book value by business unit/department
  - Depreciation expense by category, method, and time period
  - Assets approaching full depreciation (next 6-12 months)
  - Fully depreciated assets still in use
  - Monthly/quarterly/yearly depreciation schedules

### 2. Detailed Analysis Reports ✅
- **Location**: `components/reports/depreciation-analysis-view.tsx`
- **Features**:
  - Asset-by-asset depreciation breakdown with remaining useful life
  - Depreciation method comparison and efficiency analysis
  - Book value vs. purchase price variance analysis
  - Accumulated depreciation trends over time
  - Units of production depreciation tracking

## Accounting Integration

### Debit/Credit Structure
```
Monthly Depreciation Entry:
DR: Depreciation Expense Account (Income Statement)     $XXX
    CR: Accumulated Depreciation Account (Balance Sheet)     $XXX

Asset Disposal Entry:
DR: Cash/Accounts Receivable                           $XXX
DR: Accumulated Depreciation                           $XXX
DR: Loss on Disposal (if any)                         $XXX
    CR: Asset Account (Original Cost)                        $XXX
    CR: Gain on Disposal (if any)                           $XXX
```

### GL Account Mapping in Schema
- **Asset Account**: `assetAccountId` - Original asset cost (Normal DR balance)
- **Depreciation Expense**: `depreciationExpenseAccountId` - Period expense (Normal DR balance)
- **Accumulated Depreciation**: `accumulatedDepAccountId` - Contra asset (Normal CR balance)

### Account Types and Normal Balances
- `ASSET` accounts: Normal DR balance (increases with debits)
- `EXPENSE` accounts: Normal DR balance (increases with debits)
- Accumulated Depreciation: ASSET type but with CR `normalBalance` (contra asset)

### Journal Entry Generation
The system can generate proper journal entries using:
```typescript
// Monthly depreciation entry
const depreciationEntry = {
  debit: {
    accountId: asset.depreciationExpenseAccountId,
    amount: monthlyDepreciation
  },
  credit: {
    accountId: asset.accumulatedDepAccountId,
    amount: monthlyDepreciation
  }
};
```

## Lapsing Considerations

### Depreciation Lapsing Rules
1. **Fully Depreciated Assets**: 
   - `isFullyDepreciated = true`
   - `currentBookValue = salvageValue`
   - No further depreciation calculated
   - Asset remains on books at salvage value until disposal

2. **Asset Disposal/Retirement**:
   - Depreciation stops on disposal/retirement date
   - Final depreciation entry calculated pro-rata for partial month
   - Accumulated depreciation is removed from books
   - Gain/loss on disposal calculated: `Proceeds - (Cost - Accumulated Depreciation)`

3. **Asset Transfer Between Business Units**:
   - Depreciation continues with new business unit
   - Historical depreciation preserved in `AssetDepreciation` records
   - Transfer doesn't affect depreciation schedule
   - GL accounts may change based on new business unit settings

4. **Maintenance/Repair Impact**:
   - **Major Improvements (Capitalized)**: May extend useful life or increase book value
   - **Regular Maintenance**: Expensed immediately, no depreciation impact
   - **Betterments**: May require depreciation schedule adjustment

### Automatic Lapsing Triggers
- `currentBookValue <= salvageValue` (mathematical limit reached)
- Asset status changes to `RETIRED`, `DISPOSED`, `LOST`
- `usefulLifeMonths` fully elapsed from `depreciationStartDate`
- Manual override with `isAdjustment = true` and `adjustmentReason`

### Lapsing Prevention Controls
- System prevents depreciation below salvage value
- Validates depreciation dates against asset lifecycle events
- Requires approval for manual depreciation adjustments
- Maintains audit trail of all lapsing events

### Post-Lapsing Asset Management
- Fully depreciated assets remain trackable for:
  - Physical inventory verification
  - Insurance purposes
  - Regulatory compliance
  - Disposal planning
- Status can be `FULLY_DEPRECIATED` while still `DEPLOYED`
- Disposal process removes from active asset register

## Data Flow

### Depreciation Calculation Process
1. **Monthly Batch Process**:
   - Query assets where `nextDepreciationDate <= current_date`
   - Calculate depreciation based on method
   - Create `AssetDepreciation` record
   - Update asset `currentBookValue`, `accumulatedDepreciation`
   - Update `lastDepreciationDate`, `nextDepreciationDate`

2. **Method-Specific Calculations**:
   - **STRAIGHT_LINE**: `(purchasePrice - salvageValue) / usefulLifeMonths`
   - **DECLINING_BALANCE**: `currentBookValue * depreciationRate`
   - **UNITS_OF_PRODUCTION**: `(purchasePrice - salvageValue) * (unitsInPeriod / totalExpectedUnits)`
   - **SUM_OF_YEARS_DIGITS**: Complex fraction-based calculation

## Report Types

### Summary Reports
- **Depreciation Dashboard**: High-level metrics and KPIs
- **Expense Summary**: Depreciation expense by period/category
- **Asset Aging**: Assets by depreciation status
- **Upcoming Lapses**: Assets approaching full depreciation

### Detailed Reports
- **Asset Depreciation Schedule**: Individual asset depreciation timeline
- **Method Analysis**: Comparison across depreciation methods
- **Variance Analysis**: Planned vs actual depreciation
- **Adjustment History**: Manual depreciation adjustments

## Technical Implementation

### Database Queries
- Efficient indexing on `nextDepreciationDate`, `isFullyDepreciated`
- Aggregation queries for summary statistics
- Time-series queries for trend analysis

### Performance Considerations
- Pagination for large asset lists
- Caching for frequently accessed summaries
- Background processing for complex calculations

## Future Enhancements

### Phase 2 (Planned)
- [ ] Financial & Compliance Reports
- [ ] Operational Reports
- [ ] Advanced Analytics

### Phase 3 (Future)
- [ ] Predictive depreciation modeling
- [ ] Integration with external accounting systems
- [ ] Automated depreciation adjustments
- [ ] Multi-currency depreciation support

## Files Created
- `components/reports/depreciation-summary-view.tsx`
- `components/reports/depreciation-analysis-view.tsx`
- `lib/actions/depreciation-reports-actions.ts`
- `app/(dashboard)/[businessUnitId]/reports/depreciation/page.tsx`

## Testing Checklist
- [ ] Summary report displays correct totals
- [ ] Filters work properly (date range, category, method)
- [ ] Export functionality (CSV, Print)
- [ ] Mobile responsiveness
- [ ] Performance with large datasets
- [ ] Accounting accuracy (debit/credit validation)
- [ ] Lapsing logic correctness

## Notes
- All monetary values use `Decimal` type for precision
- Depreciation calculations preserve audit trail
- GL account integration ready for journal entry generation
- Lapsing rules prevent over-depreciation beyond salvage value