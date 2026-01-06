# Design Document: Store Use Review Flow

## Overview

This design implements a new review step in the material request approval workflow for "Store Use" requests. When a material request has `isStoreUse = true`, it must first be reviewed by a designated reviewer (employeeId: R-033) before proceeding to the standard approval flow.

The implementation involves:
1. Adding a new `FOR_REVIEW` status to the MRSRequestStatus enum
2. Adding review tracking fields to the MaterialRequest model
3. Creating server actions for fetching and processing review requests
4. Building UI components for the reviewer to view and mark requests as reviewed

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Material Request Flow                         │
│                                                                  │
│  isStoreUse = true:                                             │
│  DRAFT → FOR_REVIEW → PENDING_BUDGET_APPROVAL/FOR_REC_APPROVAL  │
│                                                                  │
│  isStoreUse = false:                                            │
│  DRAFT → PENDING_BUDGET_APPROVAL/FOR_REC_APPROVAL (unchanged)   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Server Actions                                │
│  (material-request-approval-actions.ts)                         │
│                                                                  │
│  - getPendingReviewRequests() - Fetch FOR_REVIEW requests       │
│  - markAsReviewed() - Mark request as reviewed                  │
│  - submitForApproval() - Modified to route store use requests   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database (Prisma)                             │
│                                                                  │
│  MaterialRequest table:                                          │
│  + reviewerId (String?)                                          │
│  + reviewedAt (DateTime?)                                        │
│  + reviewStatus (ApprovalStatus?)                                │
│  + reviewRemarks (String?)                                       │
│                                                                  │
│  MRSRequestStatus enum:                                          │
│  + FOR_REVIEW                                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Database Schema Changes

#### 1. MRSRequestStatus Enum Update

```prisma
enum MRSRequestStatus {
  DRAFT
  FOR_REVIEW              // NEW - Store use requests pending review
  PENDING_BUDGET_APPROVAL
  FOR_REC_APPROVAL
  REC_APPROVED
  FOR_FINAL_APPROVAL
  FINAL_APPROVED
  FOR_POSTING
  POSTED
  FOR_SERVING
  SERVED
  RECEIVED
  TRANSMITTED
  CANCELLED
  DISAPPROVED
  FOR_EDIT
  ACKNOWLEDGED
  DEPLOYED
}
```

#### 2. MaterialRequest Model Updates

```prisma
model MaterialRequest {
  // ... existing fields ...
  
  // Store Use Review Fields (NEW)
  reviewerId      String?
  reviewer        User?           @relation("MRSReviewer", fields: [reviewerId], references: [id])
  reviewedAt      DateTime?
  reviewStatus    ApprovalStatus?
  reviewRemarks   String?         @db.Text
}
```

### Server Actions

#### 1. `getPendingReviewRequests`

```typescript
export async function getPendingReviewRequests({
  businessUnitId,
  page = 1,
  limit = 10
}: {
  businessUnitId: string
  page?: number
  limit?: number
}): Promise<PendingReviewRequestsResponse> {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const userEmployeeId = session.user.employeeId
  
  // Only R-033 can view pending review requests
  if (userEmployeeId !== 'R-033') {
    throw new Error("Unauthorized - Only designated reviewer can access this")
  }

  const whereClause = {
    status: MRSRequestStatus.FOR_REVIEW,
    isStoreUse: true
  }

  // Fetch paginated results...
}
```

#### 2. `markAsReviewed`

```typescript
export async function markAsReviewed(
  requestId: string,
  businessUnitId: string,
  remarks?: string
): Promise<ActionResult> {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const userEmployeeId = session.user.employeeId
  
  // Only R-033 can mark as reviewed
  if (userEmployeeId !== 'R-033') {
    return { error: "Unauthorized - Only designated reviewer can review requests" }
  }

  // Fetch the request
  const materialRequest = await prisma.materialRequest.findUnique({
    where: { id: requestId },
    include: { requestedBy: true }
  })

  if (!materialRequest) {
    return { error: "Material request not found" }
  }

  if (materialRequest.status !== MRSRequestStatus.FOR_REVIEW) {
    return { error: "Request is not pending review" }
  }

  // Determine next status based on requestor's isRDHMRS flag
  const nextStatus = materialRequest.requestedBy.isRDHMRS 
    ? MRSRequestStatus.PENDING_BUDGET_APPROVAL 
    : MRSRequestStatus.FOR_REC_APPROVAL

  // Update the request
  await prisma.materialRequest.update({
    where: { id: requestId },
    data: {
      status: nextStatus,
      reviewerId: session.user.id,
      reviewedAt: new Date(),
      reviewStatus: ApprovalStatus.APPROVED,
      reviewRemarks: remarks || null,
      recApprovalStatus: nextStatus === MRSRequestStatus.FOR_REC_APPROVAL 
        ? ApprovalStatus.PENDING 
        : null
    }
  })

  revalidatePath(`/${businessUnitId}/approvals/review`)
  revalidatePath(`/${businessUnitId}/approvals/material-requests/pending`)
  
  return { success: "Request marked as reviewed successfully" }
}
```

#### 3. Modified `submitForApproval`

```typescript
export async function submitForApproval(requestId: string): Promise<ActionResult> {
  // ... existing validation ...

  // Determine next status based on isStoreUse and requestor's isRDHMRS flag
  let nextStatus: MRSRequestStatus
  
  if (existingRequest.isStoreUse) {
    // Store use requests go to review first
    nextStatus = MRSRequestStatus.FOR_REVIEW
  } else if (existingRequest.requestedBy.isRDHMRS) {
    // RDH requests go to budget approval
    nextStatus = MRSRequestStatus.PENDING_BUDGET_APPROVAL
  } else {
    // Normal flow
    nextStatus = MRSRequestStatus.FOR_REC_APPROVAL
  }

  await prisma.materialRequest.update({
    where: { id: requestId },
    data: {
      status: nextStatus,
      recApprovalStatus: nextStatus === MRSRequestStatus.FOR_REC_APPROVAL 
        ? ApprovalStatus.PENDING 
        : null,
    }
  })

  // ... rest of function ...
}
```

### UI Components

#### 1. Pending Review Page

Location: `app/(dashboard)/[businessUnitId]/approvals/review/page.tsx`

```typescript
// Server component that fetches pending review requests
export default async function PendingReviewPage({ params }) {
  const { businessUnitId } = params
  const data = await getPendingReviewRequests({ businessUnitId })
  
  return <PendingReviewView requests={data.materialRequests} />
}
```

#### 2. Pending Review View Component

Location: `components/approvals/pending-review-view.tsx`

```typescript
// Client component with checkbox to mark as reviewed
export function PendingReviewView({ requests }) {
  const handleMarkAsReviewed = async (requestId: string, remarks?: string) => {
    const result = await markAsReviewed(requestId, businessUnitId, remarks)
    if (result.success) {
      toast.success(result.success)
    } else {
      toast.error(result.error)
    }
  }

  return (
    // Table with requests and "Mark as Reviewed" checkbox for each
  )
}
```

#### 3. Review Action Component

Location: `components/approvals/review-action.tsx`

```typescript
// Checkbox component for marking request as reviewed
export function ReviewAction({ requestId, onReview }) {
  const [checked, setChecked] = useState(false)
  const [remarks, setRemarks] = useState("")
  
  const handleChange = async (checked: boolean) => {
    if (checked) {
      await onReview(requestId, remarks)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Checkbox checked={checked} onCheckedChange={handleChange} />
      <span>Mark as Reviewed</span>
    </div>
  )
}
```

## Data Models

### Updated MaterialRequest Interface

```typescript
interface MaterialRequest {
  // ... existing fields ...
  
  // Store Use Review Fields
  reviewerId: string | null
  reviewer: {
    id: string
    name: string
    employeeId: string
  } | null
  reviewedAt: Date | null
  reviewStatus: ApprovalStatus | null
  reviewRemarks: string | null
}
```

### Response Types

```typescript
interface PendingReviewRequestsResponse {
  materialRequests: PendingReviewRequest[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface PendingReviewRequest {
  id: string
  docNo: string
  series: string
  type: "ITEM" | "SERVICE"
  status: MRSRequestStatus
  datePrepared: Date
  dateRequired: Date
  total: number
  purpose: string | null
  isStoreUse: boolean
  requestedBy: {
    id: string
    name: string
    employeeId: string
  }
  businessUnit: {
    id: string
    name: string
  }
  department: {
    id: string
    name: string
  } | null
  items: {
    id: string
    description: string
    quantity: number
    uom: string
    unitPrice: number | null
  }[]
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Store Use Routing

*For any* material request, if `isStoreUse = true` then submitting for approval should set the status to `FOR_REVIEW`, otherwise it should set the status to either `PENDING_BUDGET_APPROVAL` (if requestor has isRDHMRS) or `FOR_REC_APPROVAL`.

**Validates: Requirements 1.1, 1.2**

### Property 2: Review Authorization

*For any* user attempting to access pending review requests, if the user's employeeId is not 'R-033', the system should return an unauthorized error. If the user is R-033, the system should return only requests with status `FOR_REVIEW`.

**Validates: Requirements 2.1, 2.3**

### Property 3: Mark as Reviewed State Transition

*For any* material request in `FOR_REVIEW` status, when the designated reviewer (R-033) marks it as reviewed, the system should:
- Set `reviewStatus` to APPROVED
- Set `reviewerId` to the reviewer's user ID
- Set `reviewedAt` to the current timestamp
- Transition status to `PENDING_BUDGET_APPROVAL` if requestor has isRDHMRS, otherwise to `FOR_REC_APPROVAL`

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: Non-Reviewer Cannot Mark as Reviewed

*For any* user with employeeId not equal to 'R-033', attempting to mark a request as reviewed should return an unauthorized error.

**Validates: Requirements 2.3, 3.1**

## Error Handling

| Scenario | Error Response | HTTP-like Status |
|----------|---------------|------------------|
| User not authenticated | `{ error: "Unauthorized" }` | 401 |
| Material request not found | `{ error: "Material request not found" }` | 404 |
| Non-reviewer accessing review page | `{ error: "Unauthorized - Only designated reviewer can access this" }` | 403 |
| Non-reviewer marking as reviewed | `{ error: "Unauthorized - Only designated reviewer can review requests" }` | 403 |
| Request not in FOR_REVIEW status | `{ error: "Request is not pending review" }` | 400 |

## Testing Strategy

### Unit Tests

Unit tests will verify specific scenarios:

1. **Store use request routing** - Verify isStoreUse=true routes to FOR_REVIEW
2. **Non-store use request routing** - Verify isStoreUse=false follows normal flow
3. **R-033 can access pending reviews** - Verify authorized access
4. **Non-R-033 blocked from pending reviews** - Verify unauthorized access blocked
5. **Mark as reviewed updates fields** - Verify all review fields are set
6. **Mark as reviewed transitions status** - Verify correct next status based on isRDHMRS
7. **Remarks are stored** - Verify optional remarks are saved

### Property-Based Tests

Property-based tests will use generated test data to verify the routing and authorization logic:

- Generate random material requests with varying isStoreUse values
- Generate random user sessions (R-033 vs non-R-033)
- Verify routing and authorization decisions match expected behavior

### Test Configuration

- Testing framework: Jest with Prisma mocking
- Minimum 100 iterations per property test
- Each property test tagged with: **Feature: store-use-review-flow, Property {N}: {description}**

### Test File Location

Tests will be added to:
- `lib/actions/mrs-actions/__tests__/material-request-actions.test.ts`
- `lib/actions/mrs-actions/__tests__/material-request-approval-actions.test.ts`
