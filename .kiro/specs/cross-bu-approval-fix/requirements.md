# Requirements Document

## Introduction

This document specifies the requirements for fixing the cross-business-unit material request approval functionality for the special approver user (employeeId: C-002). Currently, this user can view material requests from all business units but cannot approve or reject them when viewing from a different business unit than the request's origin, resulting in an "Unauthorized" error.

## Glossary

- **Material_Request**: A request for materials or services submitted by an employee for approval
- **Business_Unit**: An organizational unit within the company (e.g., different branches or departments)
- **Special_Approver**: A user with employeeId 'C-002' who has authority to approve material requests across all business units
- **Final_Approver**: The user assigned to give final approval on a material request
- **Recommending_Approver**: The user assigned to give initial/recommending approval on a material request
- **Cross_BU_Approval**: The act of approving a material request that belongs to a different business unit than the one currently being viewed

## Requirements

### Requirement 1: Cross-Business-Unit Approval for Special Approver

**User Story:** As the special approver (C-002), I want to approve material requests from any business unit regardless of which business unit I am currently viewing, so that I can fulfill my role as the overall final approver for all material requests.

#### Acceptance Criteria

1. WHEN the Special_Approver attempts to approve a Material_Request from a different Business_Unit, THE System SHALL allow the approval if the Special_Approver is assigned as the final approver for that request
2. WHEN the Special_Approver attempts to approve a Material_Request from the same Business_Unit, THE System SHALL allow the approval if the Special_Approver is assigned as the final approver for that request
3. WHEN a non-special user attempts to approve a Material_Request from a different Business_Unit, THE System SHALL return an "Unauthorized" error

### Requirement 2: Cross-Business-Unit Rejection for Special Approver

**User Story:** As the special approver (C-002), I want to reject material requests from any business unit regardless of which business unit I am currently viewing, so that I can fulfill my role as the overall final approver for all material requests.

#### Acceptance Criteria

1. WHEN the Special_Approver attempts to reject a Material_Request from a different Business_Unit, THE System SHALL allow the rejection if the Special_Approver is assigned as the final approver for that request
2. WHEN the Special_Approver attempts to reject a Material_Request from the same Business_Unit, THE System SHALL allow the rejection if the Special_Approver is assigned as the final approver for that request
3. WHEN a non-special user attempts to reject a Material_Request from a different Business_Unit, THE System SHALL return an "Unauthorized" error

### Requirement 3: Consistent Authorization Logic

**User Story:** As a developer, I want the authorization logic for viewing, approving, and rejecting material requests to be consistent, so that the system behaves predictably for all user types.

#### Acceptance Criteria

1. THE System SHALL use the same special approver check (employeeId === 'C-002') across all material request approval functions
2. WHEN the Special_Approver views pending Material_Requests, THE System SHALL display requests from all Business_Units where they are assigned as an approver
3. WHEN the Special_Approver performs any approval action, THE System SHALL bypass the Business_Unit matching check

### Requirement 4: Path Revalidation for Cross-Business-Unit Actions

**User Story:** As the special approver, I want the UI to properly refresh after approving or rejecting a cross-business-unit request, so that I see the updated state immediately.

#### Acceptance Criteria

1. WHEN the Special_Approver approves a Material_Request from a different Business_Unit, THE System SHALL revalidate the approval paths for both the current Business_Unit and the request's Business_Unit
2. WHEN the Special_Approver rejects a Material_Request from a different Business_Unit, THE System SHALL revalidate the approval paths for both the current Business_Unit and the request's Business_Unit
