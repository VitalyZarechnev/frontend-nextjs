# post-detail-management Specification

## Purpose

Lets a user manage the full lifecycle of a post — creating it, viewing it on its own page, editing it, and deleting it — from either the posts list or the post's detail page.

## Requirements

### Requirement: Create Post

The system SHALL send the post data to the backend when the user confirms creation in the create-post modal, and SHALL close the modal on a successful response. The system is not required to immediately show the created post in the posts list.

#### Scenario: Confirming a valid new post

- **WHEN** the user confirms creation in the create-post modal with valid title and body
- **THEN** the system sends the data to the backend and closes the modal on a successful response

### Requirement: View Post Details

The system SHALL request and display the title and body of a post when the user opens that post's detail page.

#### Scenario: Opening an existing post's detail page

- **WHEN** the user opens the detail page for a post that exists
- **THEN** the system displays that post's title and body

### Requirement: Post Not Found

The system SHALL show a "post not found" state on the detail page, instead of post content, when the backend reports the requested post does not exist.

#### Scenario: Opening the detail page for a nonexistent post

- **WHEN** the user opens the detail page for a post id that the backend reports as not found (404)
- **THEN** the system shows a "post not found" state instead of post content

### Requirement: Initiate Post Edit

The system SHALL open an edit modal pre-filled with the post's current title and body when the user initiates editing, whether from the post's card in the list or from the post's detail page.

#### Scenario: Editing from the posts list

- **WHEN** the user triggers edit from a post's card in the list
- **THEN** the system opens the edit modal pre-filled with that post's current title and body

#### Scenario: Editing from the post detail page

- **WHEN** the user triggers edit from the post's detail page
- **THEN** the system opens the edit modal pre-filled with that post's current title and body

### Requirement: Save Post Edit

The system SHALL send the updated post data to the backend when the user confirms changes in the edit modal, and SHALL close the modal on a successful response. The system is not required to immediately show the updated data on the list or detail page.

#### Scenario: Confirming edited post data

- **WHEN** the user confirms changes in the edit modal
- **THEN** the system sends the updated data to the backend and closes the modal on a successful response

### Requirement: Delete Confirmation Required

The system SHALL require the user to confirm before deleting a post, whether the deletion is initiated from the post's card in the list or from the post's detail page.

#### Scenario: Initiating delete from the posts list

- **WHEN** the user triggers delete from a post's card in the list
- **THEN** the system requests confirmation before deleting the post

#### Scenario: Initiating delete from the post detail page

- **WHEN** the user triggers delete from the post's detail page
- **THEN** the system requests confirmation before deleting the post

### Requirement: Confirm Delete From List

The system SHALL send a delete request to the backend when the user confirms deletion from the posts list. The system is not required to immediately stop showing the deleted post in the list.

#### Scenario: Confirming deletion from the list

- **WHEN** the user confirms post deletion after triggering it from the posts list
- **THEN** the system sends a delete request to the backend for that post

### Requirement: Confirm Delete From Detail Page

The system SHALL send a delete request to the backend and navigate the user back to the posts list when the user confirms deletion from the post's detail page. The system is not required to immediately stop showing the deleted post in the list.

#### Scenario: Confirming deletion from the detail page

- **WHEN** the user confirms post deletion after triggering it from the post's detail page
- **THEN** the system sends a delete request to the backend for that post and navigates the user back to the posts list

### Requirement: Cancel Delete Confirmation

The system SHALL, when the user cancels a delete confirmation, close the confirmation and leave the post undeleted, regardless of where the deletion was initiated.

#### Scenario: Cancel from the posts list

- **WHEN** the user cancels the delete confirmation that was triggered from the posts list
- **THEN** the confirmation closes and the post remains in the list, unchanged

#### Scenario: Cancel from the post detail page

- **WHEN** the user cancels the delete confirmation that was triggered from the post detail page
- **THEN** the confirmation closes, the user remains on the detail page, and the post is not deleted
