# Decimal Conversion Fix Summary

## Problem
React client components cannot receive Prisma `Decimal` objects from server components. The error occurred because the new pre-depreciation fields (`priorDepreciationAmount`, `originalPurchasePrice`, `systemEntryBookValue`) were being passed as Decimal objects instead of plain numbers.

## Files Updated

### 1. `lib/actions/create-asset-actions.ts`
- **Added**: Pre-depreciation fields to `CreateAssetData` interface
- **Fixed**: Added Decimal conversion for all new pre-depreciation fields in the return data
- **Enhanced**: Depreciation calculation logic to handle pre-depreciated assets

### 2. `lib/actions/asset-details-actions.ts`
- **Added**: Pre-depreciation fields to `AssetDetailsData` interface
- **Fixed**: Added Decimal conversion in `getAssetDetails()` function
- **Fixed**: Added Decimal conversion in `updateAssetStatus()` function
- **Fixed**: Added Decimal conversion in `updateAssetLocation()` function
- **Fixed**: Added Decimal conversion in `updateAsset()` function

### 3. `lib/actions/asset-management-actions.ts`
- **Added**: Pre-depreciation fields to `AssetWithDetails` interface
- **Fixed**: Added Decimal conversion in asset transformation logic

## Decimal Fields Converted

### Original Fields (already handled)
- `purchasePrice`
- `salvageValue`
- `currentBookValue`
- `accumulatedDepreciation`
- `monthlyDepreciation`
- `depreciationRate`
- `depreciationPerUnit`

### New Pre-Depreciation Fields (now handled)
- `originalPurchasePrice`
- `priorDepreciationAmount`
- `systemEntryBookValue`

## Conversion Pattern Used

```typescript
// Convert Decimal fields to numbers for client serialization
const serializedAsset = {
  ...asset,
  purchasePrice: asset.purchasePrice ? Number(asset.purchasePrice) : null,
  originalPurchasePrice: asset.originalPurchasePrice ? Number(asset.originalPurchasePrice) : null,
  salvageValue: asset.salvageValue ? Number(asset.salvageValue) : null,
  currentBookValue: asset.currentBookValue ? Number(asset.currentBookValue) : null,
  accumulatedDepreciation: Number(asset.accumulatedDepreciation),
  monthlyDepreciation: asset.monthlyDepreciation ? Number(asset.monthlyDepreciation) : null,
  depreciationRate: asset.depreciationRate ? Number(asset.depreciationRate) : null,
  depreciationPerUnit: asset.depreciationPerUnit ? Number(asset.depreciationPerUnit) : null,
  priorDepreciationAmount: Number(asset.priorDepreciationAmount),
  systemEntryBookValue: asset.systemEntryBookValue ? Number(asset.systemEntryBookValue) : null
}
```

## Key Points

1. **Nullable vs Non-nullable**: 
   - `priorDepreciationAmount` defaults to 0, so always convert with `Number()`
   - `originalPurchasePrice` and `systemEntryBookValue` can be null, so use conditional conversion

2. **Consistency**: All functions that return asset data now consistently convert Decimal fields

3. **Type Safety**: TypeScript interfaces updated to reflect number types instead of Decimal types

## Result
✅ **Fixed**: "Decimal objects are not supported" error
✅ **Enhanced**: Pre-depreciation functionality fully working
✅ **Maintained**: All existing functionality preserved
✅ **Consistent**: All asset-related actions now handle Decimal conversion properly

The asset creation form with pre-depreciation fields should now work without any Decimal serialization errors.