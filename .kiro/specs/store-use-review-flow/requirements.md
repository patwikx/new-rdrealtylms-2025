# Requirements Document

## Introduction

This document specifies the requirements for implementing a "Store Use Review" step in the material request approval workflow. When a material request is marked as "Store Use" (`isStoreUse = true`), it must first be reviewed by a designated reviewer (employeeId: R-033) before proceeding to the standard approval flow. The reviewer will mark the request as "Reviewed" using a checkbox interface.

## Glossary

- **Material_Request**: A request for materials or services submitted by an employee for approval
- **Store_Use**: A flag indicating that the requested materials are for store/warehouse use rather than project-specific use
- **Store_Use_Reviewer**: The designated employee (employeeId: R-033) responsible for reviewing store use material requests
- **Review_Status**: The status indicating whether a store use request has been reviewed (PENDING, REVIEWED)
- **Approval_Flow**: The sequence of statuses a material request goes through from submission to final approval

## Requirements

### Requirement 1: Store Use Review Routing

**User Story:** As a requestor, I want my store use material requests to be routed to the designated reviewer first, so that store use requests receive proper oversight before entering the standard approval process.

#### Acceptance Criteria

1. WHEN a user submits a Material_Request with `isStoreUse = true`, THE System SHALL set the status to FOR_REVIEW
2. WHEN a user submits a Material_Request with `isStoreUse = false`, THE System SHALL follow the existing approval flow (FOR_REC_APPROVAL or PENDING_BUDGET_APPROVAL)
3. THE System SHALL assign the Store_Use_Reviewer (employeeId: R-033) as the reviewer for all store use requests

### Requirement 2: Pending Review View for Reviewer

**User Story:** As the store use reviewer (R-033), I want to see all pending store use requests assigned to me, so that I can review them efficiently.

#### Acceptance Criteria

1. WHEN the Store_Use_Reviewer accesses the pending review page, THE System SHALL display all Material_Requests with status FOR_REVIEW
2. WHEN displaying pending review requests, THE System SHALL show request details including document number, requestor, date, items, and total amount
3. THE System SHALL only show FOR_REVIEW requests to the designated Store_Use_Reviewer (R-033)

### Requirement 3: Mark as Reviewed Action

**User Story:** As the store use reviewer, I want to mark requests as reviewed using a checkbox, so that they can proceed to the next approval step.

#### Acceptance Criteria

1. WHEN the Store_Use_Reviewer marks a request as reviewed, THE System SHALL update the review status to REVIEWED
2. WHEN the Store_Use_Reviewer marks a request as reviewed, THE System SHALL record the review date and reviewer ID
3. WHEN a request is marked as reviewed, THE System SHALL transition the status to the next appropriate step (PENDING_BUDGET_APPROVAL if requestor has isRDHMRS, otherwise FOR_REC_APPROVAL)
4. THE System SHALL allow the reviewer to add optional remarks when marking as reviewed

### Requirement 4: Review Status Tracking

**User Story:** As a system administrator, I want to track the review status of store use requests, so that I can audit the review process.

#### Acceptance Criteria

1. THE System SHALL store the reviewer ID for each reviewed request
2. THE System SHALL store the review timestamp for each reviewed request
3. THE System SHALL store optional review remarks
4. WHEN displaying request details, THE System SHALL show the review information if the request was a store use request

### Requirement 5: UI Integration

**User Story:** As a user, I want to see the review status in the request details and approval history, so that I understand where my request is in the process.

#### Acceptance Criteria

1. WHEN displaying a store use request in FOR_REVIEW status, THE System SHALL show "Pending Review" as the current status
2. WHEN displaying a reviewed store use request, THE System SHALL show the reviewer name and review date in the approval timeline
3. THE System SHALL display a "Pending Review" navigation item for the Store_Use_Reviewer in the approvals menu

