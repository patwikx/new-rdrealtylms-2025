# Implementation Plan: Store Use Review Flow

## Overview

This implementation adds a review step for store use material requests. When `isStoreUse = true`, requests go to FOR_REVIEW status first, where the designated reviewer (R-033) must mark them as reviewed before they proceed to the standard approval flow.

## Tasks

- [x] 1. Database schema updates
  - [x] 1.1 Add FOR_REVIEW status to MRSRequestStatus enum
    - Add `FOR_REVIEW` after `DRAFT` in the enum
    - _Requirements: 1.1_
  - [x] 1.2 Add review fields to MaterialRequest model
    - Add `reviewerId` (String?)
    - Add `reviewer` relation to User
    - Add `reviewedAt` (DateTime?)
    - Add `reviewStatus` (ApprovalStatus?)
    - Add `reviewRemarks` (String? @db.Text)
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 1.3 Add User relation for MRSReviewer
    - Add `reviewedRequests` relation on User model
    - _Requirements: 4.1_
  - [x] 1.4 Run database migration
    - Generate and apply Prisma migration
    - _Requirements: 1.1, 4.1, 4.2, 4.3_

- [ ] 2. Checkpoint - Verify schema changes
  - Ensure migration runs successfully, ask the user if questions arise.

- [x] 3. Update submitForApproval action
  - [x] 3.1 Modify submitForApproval to route store use requests
    - Check `isStoreUse` flag on the request
    - If true, set status to `FOR_REVIEW`
    - If false, follow existing logic (PENDING_BUDGET_APPROVAL or FOR_REC_APPROVAL)
    - _Requirements: 1.1, 1.2_
  - [ ]* 3.2 Write property test for store use routing
    - **Property 1: Store Use Routing**
    - **Validates: Requirements 1.1, 1.2**

- [x] 4. Create getPendingReviewRequests action
  - [x] 4.1 Implement getPendingReviewRequests function
    - Verify user is R-033 (throw unauthorized if not)
    - Query MaterialRequest where status = FOR_REVIEW and isStoreUse = true
    - Include requestedBy, businessUnit, department, items
    - Return paginated results
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ]* 4.2 Write property test for review authorization
    - **Property 2: Review Authorization**
    - **Validates: Requirements 2.1, 2.3**

- [x] 5. Create markAsReviewed action
  - [x] 5.1 Implement markAsReviewed function
    - Verify user is R-033 (return error if not)
    - Verify request exists and is in FOR_REVIEW status
    - Update reviewerId, reviewedAt, reviewStatus, reviewRemarks
    - Determine next status based on requestor's isRDHMRS flag
    - Update request status to next status
    - Revalidate relevant paths
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 5.2 Write property test for mark as reviewed
    - **Property 3: Mark as Reviewed State Transition**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  - [ ]* 5.3 Write property test for non-reviewer authorization
    - **Property 4: Non-Reviewer Cannot Mark as Reviewed**
    - **Validates: Requirements 2.3, 3.1**

- [ ] 6. Checkpoint - Verify server actions
  - Ensure all server actions work correctly, ask the user if questions arise.

- [x] 7. Create pending review page
  - [x] 7.1 Create page route at approvals/review
    - Create `app/(dashboard)/[businessUnitId]/approvals/review/page.tsx`
    - Fetch pending review requests using getPendingReviewRequests
    - Pass data to PendingReviewView component
    - _Requirements: 2.1, 5.3_
  - [x] 7.2 Create PendingReviewView component
    - Create `components/approvals/pending-review-view.tsx`
    - Display table of pending review requests
    - Show docNo, requestor, date, items count, total
    - Include "Mark as Reviewed" checkbox for each row
    - _Requirements: 2.2, 3.1, 5.1_

- [x] 8. Update navigation and status labels
  - [x] 8.1 Add "Pending Review" to approvals navigation
    - Update sidebar navigation for R-033 user
    - Add link to `/[businessUnitId]/approvals/review`
    - _Requirements: 5.3_
  - [x] 8.2 Add FOR_REVIEW to status labels and colors
    - Update REQUEST_STATUS_LABELS in material-request-types.ts
    - Update REQUEST_STATUS_COLORS for FOR_REVIEW
    - _Requirements: 5.1_

- [x] 9. Update request detail view
  - [x] 9.1 Display review information in request details
    - Show reviewer name and review date if reviewed
    - Show "Pending Review" status badge for FOR_REVIEW requests
    - _Requirements: 4.4, 5.1, 5.2_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The designated reviewer ID ('R-033') is hardcoded as per existing pattern
- No changes to existing approval flow for non-store-use requests
- The review step is mandatory for all store use requests before they can proceed
