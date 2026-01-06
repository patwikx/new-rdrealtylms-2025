# Implementation Plan: Cross-Business-Unit Approval Fix

## Overview

This implementation fixes the authorization inconsistency where the special approver (C-002) can view but not approve/reject material requests from other business units. The fix adds the special approver bypass logic to `approveMaterialRequest` and `rejectMaterialRequest` functions.

## Tasks

- [ ] 1. Update approveMaterialRequest function
  - [x] 1.1 Add special approver check to approveMaterialRequest
    - Extract `userEmployeeId` from session
    - Add `isSpecialApprover` constant checking for 'C-002'
    - Modify business unit check to bypass for special approver
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Update path revalidation for cross-BU approvals
    - Add revalidation for the request's actual business unit
    - Keep existing revalidation for current business unit
    - _Requirements: 4.1_
  - [ ]* 1.3 Write unit test for special approver cross-BU approval
    - Test that C-002 can approve requests from different BU
    - Test that approval updates status correctly
    - _Requirements: 1.1_

- [x] 2. Update rejectMaterialRequest function
  - [x] 2.1 Add special approver check to rejectMaterialRequest
    - Extract `userEmployeeId` from session
    - Add `isSpecialApprover` constant checking for 'C-002'
    - Modify business unit check to bypass for special approver
    - _Requirements: 2.1, 2.2_
  - [x] 2.2 Update path revalidation for cross-BU rejections
    - Add revalidation for the request's actual business unit
    - Keep existing revalidation for current business unit
    - _Requirements: 4.2_
  - [ ]* 2.3 Write unit test for special approver cross-BU rejection
    - Test that C-002 can reject requests from different BU
    - Test that rejection updates status to DISAPPROVED
    - _Requirements: 2.1_

- [ ] 3. Checkpoint - Verify core functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 4. Write property tests for authorization logic
  - [ ]* 4.1 Write property test for cross-BU approval authorization
    - **Property 1: Special Approver Cross-BU Approval**
    - **Validates: Requirements 1.1**
  - [ ]* 4.2 Write property test for cross-BU rejection authorization
    - **Property 2: Special Approver Cross-BU Rejection**
    - **Validates: Requirements 2.1**
  - [ ]* 4.3 Write property test for non-special user cross-BU block
    - **Property 4: Non-Special User Cross-BU Block**
    - **Validates: Requirements 1.3, 2.3**

- [ ] 5. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The fix is minimal - only 2 functions need modification
- No database schema changes required
- No UI changes required - the component already passes the correct parameters
- The special approver ID ('C-002') is hardcoded as per existing pattern in `getPendingMaterialRequests`
