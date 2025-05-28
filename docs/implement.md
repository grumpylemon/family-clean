// Best Practice Note: This project uses 'undefined' (not 'null') for optional fields in TypeScript models, such as 'familyId' in the User interface. This ensures type safety and avoids linter errors. The User interface was updated to reflect this best practice. See the implementation plan below for details.

Raphael.jpg# Implementation Plan: Family Chore Rotation System

## Overview
This document outlines the plan to implement an automated rotation system for "family" chores in the Family Clean App, as specified in the PRD and development task list. The goal is to ensure that family chores are fairly and automatically assigned to active family members in a rotating order, with support for member exclusion and cooldowns.

---

## 1. Data Model Changes

### Family Model (`types/index.ts`)
- **Add:**
  - `memberRotationOrder: string[]` // Array of user IDs representing the rotation order
  - `nextFamilyChoreAssigneeIndex: number` // Index of the next member to assign a family chore

### Chore Model (`types/index.ts`)
- No changes required for rotation, but ensure `assignedTo` and `type` fields are present.

---

## 2. Backend Logic

### a. Initializing Rotation
- When a family is created, initialize `memberRotationOrder` with all active (non-excluded) member user IDs, shuffled randomly.
- Set `nextFamilyChoreAssigneeIndex` to 0.
- When a new member is added, append to the end of the rotation order (unless excluded).
- When a member is excluded or re-included, update the rotation order accordingly.

### b. Assigning Family Chores
- When a new family chore is created:
  - Assign it to the member at `memberRotationOrder[nextFamilyChoreAssigneeIndex]`.
  - Increment `nextFamilyChoreAssigneeIndex` (wrap around if at end).
- When a family chore is completed and its cooldown ends:
  - Reassign it to the next eligible member in the rotation order (skip excluded/inactive members).
  - Update `nextFamilyChoreAssigneeIndex`.

### c. Edge Cases
- If all members are excluded, leave the chore unassigned and log a warning.
- If a member rejoins (is re-included), insert them back into the rotation at the appropriate position.

### d. Firestore Integration
- Update the `Family` document with the new fields.
- Ensure all rotation logic is reflected in Firestore updates.

---

## 3. UI/UX Updates

- In the Chore Management and Chores screens, display the current and next assignee for family chores.
- Optionally, show the full rotation order in the Family Management/Admin panel.
- Provide admin controls to manually reshuffle or reset the rotation order if needed.

---

## 4. Testing & Validation

- Unit test the rotation logic (assignment, exclusion, re-inclusion, wrap-around).
- Test with various family sizes and exclusion scenarios.
- Validate that chores are always assigned to the correct member and that the rotation order is maintained.

---

## 5. Future Enhancements

- Allow custom rotation orders (drag-and-drop in UI).
- Support for multiple simultaneous family chores (staggered assignments).
- Analytics on chore distribution and fairness.

---

## 6. Backend Enhancements for Chore Completion Flow (2024-06-08)

- The `completeChore` function in `services/firestore.ts` was enhanced to:
  - Award points and XP based on chore difficulty.
  - Update user streaks and points.
  - Set cooldown (`lockedUntil`) after completion.
  - Mark the chore as completed with `completedBy` and `completedAt`.
  - Prepare for future integration of rotation logic for family chores (to reassign after cooldown).
- These changes lay the groundwork for full rotation automation as described in this plan.

---

## 7. UI Enhancements for Chore Completion (Planned)

- The next step is to update the UI to:
  - Allow users to mark chores as complete directly from the Chores screen.
  - Show feedback (e.g., success message, points awarded) upon completion.
  - Display cooldown/locked state for chores that are not yet available for completion.
- Relevant files:
  - `app/(tabs)/chores.tsx` (ChoresScreen): Handles displaying chores, completion actions, and feedback.
  - `components/ChoreManagement.tsx`: Admin interface for managing chores, may need updates for cooldown/locked state.
- Planned steps:
  1. Add UI indicators for locked/cooldown state on each chore card.
  2. Disable or hide the "Complete" button if the chore is locked.
  3. Show a toast or alert when a chore is completed, including points/streak info.
  4. Ensure the UI updates in real time after completion.

**Status:**
- [x] ChoresScreen (`app/(tabs)/chores.tsx`) now displays locked/cooldown state, disables the Complete button for locked chores, and provides user feedback on completion.
- [x] ChoreManagement (`components/ChoreManagement.tsx`) now displays locked/cooldown state for chores, consistent with the user-facing screen.
- [ ] Next: Implement robust cooldown/reassignment logic and integrate with the rotation system.

---

## 8. Backend Enhancements: Robust Cooldown & Automatic Rotation (2024-06-08)

- Chores cannot be completed if their `lockedUntil` is in the future; attempts are blocked with an error.
- After completion, family/shared chores are automatically reassigned to the next eligible member in the rotation order (skipping excluded/inactive members).
- The `nextFamilyChoreAssigneeIndex` and `memberRotationOrder` are updated in the Family document to reflect the new rotation state.
- If all members are excluded, the chore is left unassigned and a warning is logged for admin review.
- All changes are persisted to Firestore for consistency and reliability.
- See the updated `completeChore` logic in `services/firestore.ts` for implementation details.

---

## 9. User & Family Management UI Improvements (2025-06-08)

- Member profile avatars are now displayed in the Manage Members UI, using each member's photoURL or a fallback with their initials.
- Activity indicators (colored dots) show whether a member is active (green) or excluded (red).
- All member actions (add, remove, exclude, re-include, promote/demote) now use clear success/error alerts for feedback, improving the user experience.
- See the updated `ManageMembers.tsx` for implementation details.

---

## 10. Chore Management System UI/UX Enhancements (Planned)

- **Chore History:**
  - Add a view for users to see their completed chores, including dates and points earned.
  - Helps users track their contributions and progress over time.
- **Progress Bar:**
  - Show a visual progress bar for weekly/lifetime points or streaks on the dashboard and/or chores screen.
  - Motivates users by making progress toward goals visible.
- **Animated Feedback:**
  - Add celebratory animations (e.g., confetti) when a chore is completed.
  - Provides positive reinforcement and delight for users.
- **Locked Chore Tooltip:**
  - Display a tooltip or info icon for chores that are locked, explaining when they will unlock and why.
  - Reduces confusion and improves transparency.

Relevant files for implementation:
- `app/(tabs)/chores.tsx` (ChoresScreen)
- `components/ChoreManagement.tsx`
- `components/ui/ProgressBar.tsx` (to be created)
- `components/ui/Confetti.tsx` (to be created)

---

## 11. Animation Libraries for UI Feedback (2025-06-08)

- **Lottie:**
  - `lottie-react-native` will be installed and used for confetti/celebration animations when a chore is completed.
  - Lottie is ideal for designer-created, high-quality vector animations (e.g., confetti, checkmarks).
- **Reanimated:**
  - `react-native-reanimated` may be used in the future for custom, programmatic UI effects, transitions, or gesture-driven animations.
  - Reanimated is best for interactive or dynamic UI elements.

This approach ensures both beautiful feedback animations and flexibility for advanced UI/UX enhancements.

---

## 12. Summary of Installations, Enhancements, and Updates (2025-06-08)

**Installations:**
- Initialized Taskmaster-AI and parsed PRD for task generation.
- Installed `lottie-react-native` and `lottie-ios` for Lottie animation support.
- (Planned) May use `react-native-reanimated` for future custom UI effects.

**Backend/Data Model:**
- Updated Family and User models to support rotation, exclusion, and best practices for optional fields.
- Implemented robust family chore rotation system (memberRotationOrder, nextFamilyChoreAssigneeIndex).
- Enhanced `completeChore` backend logic for points, streaks, cooldown, and automatic reassignment/rotation.

**UI/UX Enhancements:**
- Member profile avatars and activity indicators in Manage Members UI.
- Confirmation alerts for all member actions.
- Added Chore History as a new tab in the Chores screen.
- Added a weekly points progress bar to the Chores screen.
- Integrated Lottie confetti animation on chore completion.
- Added info icon/tooltip for locked chores explaining cooldown.

**Relevant Files Updated:**
- `types/index.ts` (data models)
- `services/firestore.ts` (backend logic)
- `components/ManageMembers.tsx` (member UI)
- `app/(tabs)/chores.tsx` (Chores screen, tabs, progress bar, confetti, tooltip)
- `assets/animations/confetti.json` (Lottie animation placeholder)
- `docs/implement.md` (this document)

**Testing Notes:**
- All enhancements are ready for programmer review and QA.
- See each section above for implementation details and file references.

**Prepared by Agent**
**Date:** 2025-06-08 