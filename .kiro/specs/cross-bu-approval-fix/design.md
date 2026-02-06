# Design Document: Cross-Business-Unit Approval Fix

## Overview

This design addresses the authorization inconsistency in the material request approval system where the special approver (employeeId: C-002) can view material requests from all business units but cannot approve or reject them when the request's business unit differs from the currently viewed business unit.

The fix involves adding the same special approver bypass logic that exists in `getPendingMaterialRequests` to the `approveMaterialRequest` and `rejectMaterialRequest` functions.

## Architecture

The material request approval system follows a server action pattern in Next.js:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client Component                              │
│  (MaterialRequestApprovalActions)                               │
│                                                                  │
│  - Receives businessUnitId from URL params                      │
│  - Calls server actions with requestId + businessUnitId         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Server Actions                                │
│  (material-request-approval-actions.ts)                         │
│                                                                  │
│  - getPendingMaterialRequests() ✅ Has special approver logic   │
│  - approveMaterialRequest()     ❌ Missing special approver     │
│  - rejectMaterialRequest()      ❌ Missing special approver     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database (Prisma)                             │
│                                                                  │
│  MaterialRequest table with businessUnitId foreign key          │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Modified Functions

#### 1. `approveMaterialRequest`

**Current Implementation:**
```typescript
export async function approveMaterialRequest(
  requestId: string,
  businessUnitId: string,
  comments?: string
) {
  // ...
  if (materialRequest.businessUnitId !== businessUnitId) {
    return { error: "Unauthorized" }  // Always blocks cross-BU
  }
  // ...
}
```

**Proposed Implementation:**
```typescript
export async function approveMaterialRequest(
  requestId: string,
  businessUnitId: string,
  comments?: string
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const userId = session.user.id
  const userEmployeeId = session.user.employeeId
  
  // Special approver can approve across all business units
  const isSpecialApprover = userEmployeeId === 'C-002'

  // ...fetch materialRequest...

  // Only enforce business unit check for non-special approvers
  if (!isSpecialApprover && materialRequest.businessUnitId !== businessUnitId) {
    return { error: "Unauthorized" }
  }
  
  // ...rest of approval logic...
  
  // Revalidate paths for both business units
  revalidatePath(`/${businessUnitId}/approvals/material-requests/pending`)
  revalidatePath(`/${materialRequest.businessUnitId}/approvals/material-requests/pending`)
  revalidatePath(`/${materialRequest.businessUnitId}/mrs-coordinator/to-serve`)
}
```

#### 2. `rejectMaterialRequest`

**Current Implementation:**
```typescript
export async function rejectMaterialRequest(
  requestId: string,
  businessUnitId: string,
  comments: string
) {
  // ...
  if (materialRequest.businessUnitId !== businessUnitId) {
    return { error: "Unauthorized" }  // Always blocks cross-BU
  }
  // ...
}
```

**Proposed Implementation:**
```typescript
export async function rejectMaterialRequest(
  requestId: string,
  businessUnitId: string,
  comments: string
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const userId = session.user.id
  const userEmployeeId = session.user.employeeId
  
  // Special approver can reject across all business units
  const isSpecialApprover = userEmployeeId === 'C-002'

  // ...fetch materialRequest...

  // Only enforce business unit check for non-special approvers
  if (!isSpecialApprover && materialRequest.businessUnitId !== businessUnitId) {
    return { error: "Unauthorized" }
  }
  
  // ...rest of rejection logic...
  
  // Revalidate paths for both business units
  revalidatePath(`/${businessUnitId}/approvals/material-requests/pending`)
  revalidatePath(`/${materialRequest.businessUnitId}/approvals/material-requests/pending`)
}
```

## Data Models

No changes to data models are required. The fix only modifies the authorization logic in server actions.

### Existing Relevant Models

```typescript
// Session user (from auth)
interface SessionUser {
  id: string
  employeeId: string
  // ...other fields
}

// Material Request (from Prisma)
interface MaterialRequest {
  id: string
  businessUnitId: string
  recApproverId: string | null
  finalApproverId: string | null
  status: MRSRequestStatus
  recApprovalStatus: ApprovalStatus | null
  finalApprovalStatus: ApprovalStatus | null
  // ...other fields
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Special Approver Cross-BU Approval

*For any* material request in business unit A where the special approver (C-002) is assigned as the final approver, calling `approveMaterialRequest` with business unit B (where A ≠ B) should succeed and update the request status appropriately.

**Validates: Requirements 1.1**

### Property 2: Special Approver Cross-BU Rejection

*For any* material request in business unit A where the special approver (C-002) is assigned as the final approver, calling `rejectMaterialRequest` with business unit B (where A ≠ B) should succeed and update the request status to DISAPPROVED.

**Validates: Requirements 2.1**

### Property 3: Same-BU Actions for Assigned Approvers

*For any* material request and any user assigned as an approver (recommending or final), calling approve or reject with the same business unit as the request should succeed if the request is in the appropriate status.

**Validates: Requirements 1.2, 2.2**

### Property 4: Non-Special User Cross-BU Block

*For any* material request in business unit A and any non-special user (employeeId ≠ 'C-002'), calling `approveMaterialRequest` or `rejectMaterialRequest` with business unit B (where A ≠ B) should return an "Unauthorized" error.

**Validates: Requirements 1.3, 2.3**

### Property 5: Special Approver View All Assigned Requests

*For any* set of material requests across multiple business units where the special approver (C-002) is assigned as an approver, calling `getPendingMaterialRequests` should return all such requests regardless of the businessUnitId parameter.

**Validates: Requirements 3.2**

## Error Handling

| Scenario | Error Response | HTTP-like Status |
|----------|---------------|------------------|
| User not authenticated | `{ error: "Unauthorized" }` | 401 |
| Material request not found | `{ error: "Material request not found" }` | 404 |
| Non-special user cross-BU action | `{ error: "Unauthorized" }` | 403 |
| User not assigned as approver | `{ error: "You are not authorized to approve/reject this request" }` | 403 |
| Missing rejection comments | Client-side validation | 400 |

## Testing Strategy

### Unit Tests

Unit tests will verify specific scenarios:

1. **Special approver approval from different BU** - Verify C-002 can approve when viewing different BU
2. **Special approver rejection from different BU** - Verify C-002 can reject when viewing different BU
3. **Non-special user blocked from cross-BU approval** - Verify regular users get unauthorized
4. **Non-special user blocked from cross-BU rejection** - Verify regular users get unauthorized
5. **Same-BU approval still works** - Regression test for normal flow
6. **Same-BU rejection still works** - Regression test for normal flow

### Property-Based Tests

Property-based tests will use generated test data to verify the authorization logic holds across many scenarios:

- Generate random business unit IDs
- Generate random user sessions (special vs non-special)
- Generate material requests with various approver assignments
- Verify authorization decisions match expected behavior

### Test Configuration

- Testing framework: Jest with Prisma mocking
- Minimum 100 iterations per property test
- Each property test tagged with: **Feature: cross-bu-approval-fix, Property {N}: {description}**

### Test File Location

Tests will be added to:
- `lib/actions/mrs-actions/__tests__/material-request-approval-actions.test.ts`
