---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
inputDocuments:
  - project-proposal
  - relational-model
documentCounts:
  briefCount: 0
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 0
workflowType: 'prd'
classification:
  projectType: mobile_app (backend focus)
  domain: general (fintech/social)
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - PROYECTO-COLAB

**Author:** Ariden
**Date:** 2026-03-16T18:28:56+01:00

## Executive Summary

Proyecto-Colab (working title) bridges the logistical and financial gaps of shared living by acting as an authoritative, real-time "personal manager" for communal flats. The application centralizes task rotations, expense auditing, objective polling, and instant communication into a single, cohesive ecosystem. By capturing intent and establishing a clear, immutable ledger for responsibilities rather than processing actual funds, it drastically reduces interpersonal friction and cognitive load for flatmates.

### What Makes This Special

Unlike disjointed solutions that require roommates to juggle messaging apps for communication, spreadsheet tools for debts, and physical boards for chores, this platform unifies all communal vectors. Its core differentiator lies in its role as a trustless ledger: it handles the mathematics of complex debt liquidation and the automated rotation of recurring chores without bearing the regulatory burden or security risks of a payment processor. Roommates settle debts externally via their preferred banking methods and record the settlement within the app, fostering an environment where users can rely entirely on the system to manage the "business" of their shared home, allowing them to focus on simply living together.

## Project Classification

- **Project Type:** Mobile Application (Frontend: React Native, Backend: Node.js/NestJS, PostgreSQL, Redis)
- **Domain:** General (with distinct Fintech ledger and Social communication elements)
- **Complexity:** Medium (Driven by real-time WebSocket requirements, debt liquidation algorithms, and task scheduling)
- **Project Context:** Greenfield

## Success Criteria

### User Success

User success is fundamentally tied to the efficiency and peace of mind the system provides. The primary "aha!" moment occurs when a roommate receives an automated push notification that a chore has been completed—eliminating the need for nagging or manual tracking. Similarly, success is achieved when a user requests an expense split and sees it marked as paid by their flatmates shortly after, trusting the system's ledger without needing to follow up.

### Business/Product Success

At this stage, the primary product success metric is the delivery of a fully functional, robust backend API that can seamlessly integrate with a future frontend application. Business growth metrics (e.g., user acquisition) are secondary to establishing a solid technical foundation that correctly manages the core features (chores, expenses, chat, and polls) for a small number of initial test flats.

### Technical Success

Technical success requires the backend to reliably handle concurrent WebSocket connections for real-time chat and notifications, maintain absolute data integrity within the PostgreSQL database for expense ledgers, and correctly schedule and rotate tasks based on their defined frequencies. The API must be well-documented and predictable for frontend consumption.

### Measurable Outcomes

*   **API Completeness:** 100% of the endpoints required to support the entities in the relational model (Users, Flats, Rooms, Expenses, Tasks, Polls, Chat) are implemented and documented.
*   **Real-time Reliability:** WebSocket events for chat messages and task/expense updates are broadcasted to the correct flat rooms with <500ms latency.
*   **Ledger Accuracy:** The expense splitting logic correctly calculates and records debts without rounding errors or dropped transactions.

## Product Scope & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Technical Foundation & Mathematical Integrity MVP. The goal is to build a mathematically flawless, real-time backend that a frontend developer can easily consume, focusing entirely on reliability and core debt-liquidation rather than immediate massive scale.
**Resource Requirements:** 1 Backend Engineer (Node.js/NestJS/PostgreSQL/Sockets).

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
*   Flat Creation & Onboarding
*   Chore Creation & Rotation
*   Expense Splitting & Advanced Debt Liquidation (Graph simplification)
*   Real-time Chatting
*   Voting on Polls

**Must-Have Capabilities:**
*   JWT Authentication & RBAC
*   PostgreSQL ACID Transactions for the Ledger
*   WebSocket Gateway for Chat/Events
*   BullMQ/Redis Cron jobs for Chores/Polls

### Post-MVP Features

**Phase 2 (Growth):**
*   FCM Push Notifications.
*   "Delete Account" compliance endpoints.

**Phase 3 (Expansion):**
*   AI Flat Management capabilities.
*   Open Banking integrations for automatic payment verification.

### Risk Mitigation Strategy

**Technical Risks:** The biggest risk is race conditions in WebSockets and ledger payments. *Mitigation:* Rely heavily on PostgreSQL row-level locks and strict unit testing for the Expense module before any frontend integration.
**Market Risks:** Building an API that the frontend team finds too complex to consume. *Mitigation:* Maintain comprehensive OpenAPI/Swagger documentation from Day 1 and strictly version the API.
**Resource Risks:** Over-engineering the websocket infrastructure. *Mitigation:* Start with a single Redis-backed Socket.io instance rather than a complex multi-node mesh until actual load testing demands it.

## User Journeys

### 1. The "First Night" Onboarding (Primary User - Success Path)
**Persona:** Alex, a 22-year-old university student who just moved into a 4-person flat. He wants to avoid the awkward "who owes what" conversations that ruined his last living situation.
**Journey:** Alex downloads the app and signs up with his email. His flatmate, Sarah, who set up the flat, sends him a 6-digit `invite_code` via WhatsApp. Alex enters the code, instantly joining "The Thunderdome" flat. He selects his room from the pre-created list. *Backend Capability Revealed:* Secure JWT authentication, invite-code validation, and relational joining of Users to Flats and Rooms.

### 2. The Sunday Cleanup (Primary User - Chore Rotation)
**Persona:** Sarah, the organized one who is tired of always taking out the trash.
**Journey:** Sarah opens the app on a Sunday morning. She creates a Task: "Take out recycling", sets the frequency to `weekly`, and assigns the first instance to Alex. The backend creates the Task and logs the initial state. When Alex actually takes out the recycling later that day, he taps "Done". The backend updates `last_completed`, automatically rotates the `assigned_to` field to the next flatmate (David), and emits a WebSocket event. Everyone's phone pushes a notification: "Alex took out the recycling. David is up next." *Backend Capability Revealed:* Cron scheduling for chore rotation, task state mutation, and real-time WebSocket broadcasting.

### 3. The Supermarket Run (Primary User - Expense Liquidation)
**Persona:** David, who just spent €45 on shared cleaning supplies and toilet paper.
**Journey:** David logs an Expense titled "Mercadona Supplies" for €45. He selects all 4 flatmates to split it equally. The backend creates the parent Expense and four ExpenseSplits of €11.25. Over the next two days, Alex and Sarah wire David the money via their bank apps and tap "Mark Paid" on their respective splits in the app. The backend validates the payment state mutation. David's app updates in real-time via WebSockets to show €22.50 recovered. *Backend Capability Revealed:* Double-entry transaction creation, debt ledger calculation, and real-time state synchronization.

### 4. The "What color sofa?" Debate (Primary User - Polling)
**Persona:** Mia, the fourth flatmate, who found a cheap sofa on Wallapop but needs consensus quickly before someone else buys it.
**Journey:** Mia creates a Poll: "Buy the blue IKEA sofa for €50?" with options "Yes", "No", and "Too expensive". She sets `expires_at` for 4 hours from now. The backend creates the Poll and the PollOptions. The other three flatmates receive a notification, log in, and cast their Votes. As each vote hits the backend, the tally updates live for everyone via WebSockets. After 4 hours, a backend worker job closes the poll, locking further votes. *Backend Capability Revealed:* Time-bound entity state management, vote aggregation, and real-time tally broadcasting.

### 5. Flat Administrator / Creator (Admin User)
**Persona:** Sarah, acting as the creator of "The Thunderdome" flat.
**Journey:** A previous flatmate moves out, and a new one is moving in. Sarah needs to remove the old flatmate's access so they don't see the chat or get assigned chores. She uses the admin panel to remove the user from the Flat. The backend must ensure this doesn't orphan historical expense data (the old flatmate's past payments must remain in the ledger for historical accuracy) while removing them from future chore rotations and terminating their active WebSocket sessions. *Backend Capability Revealed:* Soft-deletes or status flagging for users, historical data integrity, and cross-module cascading updates (e.g., re-calculating chore rotations).

### Journey Requirements Summary

These narrative journeys reveal several critical backend capabilities required for the MVP:
*   **Authentication & Access Control:** Secure account creation, invite-code logic for joining flats, and RBAC (Role-Based Access Control) for flat admins vs standard flatmates.
*   **Real-time Event Bus:** A robust WebSocket gateway (Socket.io) to instantly push updates for chore completions, new expenses, chat messages, and live poll results.
*   **Ledger & State Management:** ACID-compliant ledger operations in PostgreSQL to handle ExpenseSplits perfectly, alongside complex state machines for chore rotations and time-bound entities like Polls.
*   **Background Jobs:** A scheduled worker system (e.g., BullMQ) to rotate `assigned_to` fields on recurring Tasks and to enforce `expires_at` locks on Polls.
*   **Data Integrity & Soft Deletes:** Handling the departure of a flatmate without destroying historical financial records, requiring careful Foreign Key constraints and soft-delete architectures.

## Domain-Specific Requirements

### Financial Ledger Integrity (Fintech Domain)
*   **Immutability:** Once an `ExpenseSplit` is marked as paid and verified, the historical record must never be silently deleted or altered, even if a user leaves the flat. We must use soft-deletes (`deleted_at` timestamps) instead of hard SQL `DELETE` cascades.
*   **Concurrency & Race Conditions:** Two users marking an expense paid at the exact same millisecond must not cause the database to double-count the payment. All ledger updates must use strict PostgreSQL ACID transactions with appropriate row-level locking.

### Real-Time Reliability (Social/Chat Domain)
*   **Message Ordering:** WebSocket chat messages must be guaranteed to display in the exact order they were sent. The backend must rely on precise, centralized Server-side timestamps (`created_at`) rather than trusting the client-side device time.
*   **Connection State Recovery:** If the mobile app drops cell service for 10 seconds, the frontend must be able to ask the backend "Give me any WebSocket events I missed since timestamp X" upon reconnection.

### Privacy & Security
*   **Flat Isolation:** A user in Flat A must mathematically have zero API vector to read Chat Messages, Polls, or Expenses from Flat B. Robust Role-Based Access Control (RBAC) middleware must verify `flat_id` membership on every single API request.

## Project-Type Requirements: Mobile App Backend

### Overview

As the backend for a mobile application, the API must be optimized for mobile consumption patterns, focusing on stability, low-latency responses, and resource efficiency.

### Technical Architecture Considerations

*   **Push Strategy:** For the MVP, the backend will rely exclusively on WebSocket events (`Socket.io`) to deliver real-time notifications to active clients. Integration with external push notification services (e.g., APNs/FCM) is deferred to minimize initial cost and complexity.
*   **Offline Data Strategy:** The API will require synchronous connections. The backend expects the mobile client to handle network connectivity checks. If a client attempts to mutate state (e.g., mark an expense paid) while offline, the API request will fail immediately. The backend will not implement synchronization queues for offline-first capabilities.
*   **Platform & Store Compliance:** Initial development will not prioritize Apple/Google App Store specific compliance mandates (such as instant user account deletion functionality). These features will be implemented post-MVP prior to the mobile application's store deployment.

### Implementation Considerations

*   **Payload Optimization:** Mobile endpoints should return only the necessary data to minimize bandwidth consumption over cellular networks.
*   **API Versioning:** The backend must implement strict API versioning (e.g., `/v1/`) from Day 1 to ensure that old mobile app versions do not break when the backend introduces changes, as users may not update their mobile apps immediately.

## Functional Requirements

### User & Flat Management
*   **FR1**: Users can register an account and authenticate.
*   **FR2**: Users can create a new Flat, generating a unique join code.
*   **FR3**: Users can join an existing Flat using a valid join code.
*   **FR4**: Flat Admins can remove users from a Flat.
*   **FR5**: Users can view the roster of all members in their current Flat.

### Chore & Task Automation
*   **FR6**: Users can create Tasks (recurring or one-off) assigned to specific Flat members.
*   **FR7**: Users can mark an assigned Task as completed.
*   **FR8**: The system can automatically rotate the assignment of a recurring Task to the next eligible Flat member upon completion.
*   **FR9**: Users can view the history of completed Tasks.

### Expense & Debt Ledger
*   **FR10**: Users can create an Expense and designate how the cost is split among specific Flat members.
*   **FR11**: The system can calculate and maintain a mathematically accurate ledger of absolute debts between all users in a Flat.
*   **FR12**: The system can run an advanced debt liquidation algorithm to simplify complex debt graphs into the minimum number of transactions.
*   **FR13**: Users can mark a specific debt/split as "paid" (liquidated).

### Communication & Polling
*   **FR14**: Users can send and receive real-time chat messages within their Flat's dedicated room.
*   **FR15**: Users can create time-bound Polls with customized voting options.
*   **FR16**: Users can cast a single vote on an active Poll.
*   **FR17**: The system locks Polls from further voting once their expiration time is reached.

### Notification & Event Broadcasting
*   **FR18**: The system broadcasts real-time events to connected clients when Chat messages are sent.
*   **FR19**: The system broadcasts real-time events to connected clients when Tasks are completed or Expenses are logged/paid.
*   **FR20**: The system broadcasts real-time vote tally updates when Polls are voted on.

## Non-Functional Requirements

### Performance & Responsiveness
*   **NFR-Perf-1:** The WebSocket gateway must broadcast chat messages and event updates to connected clients within 500ms of receiving the triggering request.
*   **NFR-Perf-2:** 95% of standard REST API requests (e.g., fetching a flat roster or checking a balance) must respond in under 300ms.

### Security & Privacy
*   **NFR-Sec-1:** All API endpoints (except login/registration) route must reject requests that lack a valid, signed JWT within 10ms.
*   **NFR-Sec-2:** The Role-Based Access Control logic must explicitly verify `flat_id` authorization on *every* request, ensuring mathematically zero cross-tenant data leakage.

### Reliability & Integrity
*   **NFR-Rel-1:** Ledger transaction logic must use strict ACID database transactions to guarantee 0% chance of double-counting payments under concurrent load.
*   **NFR-Rel-2:** The chronological ordering of chat messages must be guaranteed server-side, with a timestamp accuracy of at least 10ms.


