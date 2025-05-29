# Family Chore App – Requirements

**Document Version:** 1.0  
**Date:** May 25, 2025  

---

## 1. Project Overview

**Objective:**  
Build a cross-platform family chore app (iOS, Android, Web) using Expo React Native, with Firebase for hosting, auth, real-time database, and cloud logic.

**Tech Stack:**  
- **Frontend:** Expo React Native (shared codebase for iOS/Android/Web)  
- **Backend:** Firebase Firestore (data), Firebase Auth, Firebase Hosting  
- **Server Logic:** Firebase Cloud Functions (scheduling, auto-assignment, notifications)

**Key Differentiators:**  
- **Automated Chore Rotation:** Equitable, dynamic assignment and cooldown logic  
- **Gamification:** Points, leaderboards, rewards store with real-time updates  
- **Pet & Shared-Space Support:** Auto-generated pet chores + shared-space rotations  
- **Admin Panel:** Full CRUD for chores, members, pets, rewards, and family settings  

---

## 2. Functional Requirements

### 2.1 Authentication & Authorization  
- **Signup / Initial Setup:**  
  - Admin creates family and first user (Google Signin)  
  - Generates `families/{familyId}` + admin user doc  
- **Login / Logout:**  
  - Standard Google Authentication  
  - Firebase Auth → load corresponding `members/{userId}`  
- **Roles:**  
  - **Admin:** full access to Admin Panel  
  - **Member:** complete chores, redeem rewards, view leaderboard  

### 2.2 Chore Management  
- **Create / Read / Update / Delete (CRUD):**  
  - Name, description, points, type (Individual, Family, Pet, SharedSpace), cooldown, assignees  
- **Auto-Rotation & Claiming:**  
  - Family & non-claimable pet chores rotate through active members  
  - Claimable pet chores (“Walk Dog(s)”, etc.) can be claimed by any active user  
- **Completion Workflow:**  
  - Tap to complete → applies cooldown, awards points, logs history  
- **Filters:**  
  - All, My Chores, Open Family, Pet, Individual, Shared Spaces  

### 2.3 Pet Management  
- **CRUD Pets:** name, kind (Dog, Cat, Other), avatar  
- **Default Pet Chore Reconciliation:**  
  - Auto-create/update/remove standard pet chores based on current pet list  
  - Dynamic naming (e.g. “Walk Fido (& Spot)”)  

### 2.4 Rewards Store  
- **View Rewards:** grid of items (image, name, cost)  
- **Redeem:** deduct points, update user totals, confirm success/failure  
- **Admin Quick-Add:** predefined suggestions  

### 2.5 Leaderboard  
- **Weekly Champions:** sorted by `weeklyPoints`  
- **All-Time Legends:** sorted by `totalPoints`  
- **Visuals:** top 3 highlighted (trophies, colors)  

### 2.6 Settings & Profile  
- **User Profile:** name, avatar (emoji or URL), update  
- **Family Settings (Admin):**  
  - Default points & cooldown  
  - Week start day  
  - Point-transfer toggle + transfer UI  
  - Theme colors (primary, secondary, accent, background, text)  

### 2.7 Admin Panel  
- **Sections:** Chores, Members, Pets, Rewards, Settings  
- **Member Management:**  
  - CRUD members, set family/role, temp exclusion with end date, shared-space links  
- **Pet Management:** same as Pets screen  
- **Reward Management:** same as Rewards screen  
- **Chore Management Table:** inline assign, rotate-next, delete  

---

## 3. Technical Specifications

### 3.1 Firestore Data Model  
- **families** (doc = familyId)  
  - Fields: `name`, `joinCode`, `settings` (map), `memberRotationOrder` (array), `nextFamilyChoreAssigneeIndex`, `initialSetupStepsCompleted`  
  - Subcollections: `members`, `chores`, `pets`, `rewards`, `choreHistory`

- **members**  
  - `id`, `name`, `avatarUrl`, `role`, `familyRole`, `weeklyPoints`, `totalPoints`, `sharesRoomWith`, `sharesBathroomWith`, `isTemporarilyExcluded`, `exclusionEndDate`

- **chores**  
  - `id`, `name`, `description`, `type`, `points`, `assignedTo`, `currentAssignees`, `isRecurring`, `defaultChoreType`, `petId`, `sharedSpaceId`, `sharedSpaceParticipants`, `nextSharedSpaceAssigneeIndex`, `completed`, `lockedUntil`, `completedAt`

- **pets**, **rewards**: simple CRUD docs  
- **choreHistory**: append-only records of completions  

### 3.2 Cloud Functions  
- **advanceAndReassignChores:** scheduled recompletion & rotation  
- **weeklyPointReset:** resets `weeklyPoints` per family’s `weekStartsOn`  
- **reconcileDefaultPetChores:** on pet/member changes  
- **FCM notifications:** new assignment, overdue reminders  

### 3.3 Security Rules  
- **Read:** only authenticated users in the same family  
- **Write:**  
  - Members → own profile, choreHistory  
  - Admins → full family doc + subcollections  
- **Validation:** enforce enums, non-negative points, valid color hex codes  

---

## 4. Non-Functional Requirements

- **Performance:**  
  - List screens load in <1s with real-time listeners & local cache  
- **Offline Support:**  
  - Firestore offline persistence for queueing updates  
- **Security:**  
  - RLS in Firestore, secure storage of API keys  
- **Accessibility:**  
  - Dynamic type support, sufficient contrast  
- **Testing:**  
  - Unit tests for core ViewModel/logic  
  - Integration tests for Cloud Functions  

---

## 5. Development Milestones

| Phase                          | Duration | Deliverables                                        |
| ------------------------------ | -------- | --------------------------------------------------- |
| 1. Firebase Setup & Auth Flow  | 2 days   | Firestore schema, Auth UI, initial setup screen     |
| 2. Core CRUD & Data Flows      | 3 days   | Chores, Pets, Rewards, Members CRUD + state sync    |
| 3. Gamification & Rotation     | 3 days   | Auto-assignment, completion logic, history logging  |
| 4. Admin Panel & Settings      | 2 days   | Full admin UIs, point transfers, theming            |
| 5. Leaderboard & UX Polish     | 2 days   | Leaderboards, dashboard, animations, accessibility  |
| 6. Cloud Functions & Testing   | 3 days   | Scheduled jobs, security rules, unit/integration    |
| 7. Beta QA & Launch Prep       | 2 days   | Bug fixes, performance tuning, app-store packaging  |

---

## 6. Risk Management

| Risk                                      | Mitigation                                     |
| ----------------------------------------- | ---------------------------------------------- |
| Over-assignment due to Cloud Function lag | Use client-side backup timer & FCM notifications |
| Firestore CICD schema drift               | Define indexes in `firebase.json`, CI validation |
| Network outages                           | Enable offline persistence and exponential retry |
| Auth misconfiguration                     | Staging & prod projects with separate rules     |
| Theme color misuse (bad contrast)         | Validate hex codes and test with color-blind simulators |

---

## 7. Appendix

- **Firebase Docs:** https://firebase.google.com/docs  
- **Expo Router:** https://expo.github.io/router  
- **Firestore Indexes:** reference in `firebase.json`  
- **Design Tokens Spec:** (Link to internal style guide)  