# Aylix MVP Progress

## Current MVP Objective

Validate the role-based onboarding, dashboard, and request loop with a simple Expo client and Express API, while keeping the system easy to change.

## Current Architecture

### Frontend

- Expo app for React Native and web
- Expo Router for screen routing
- Screens: `entry`, `onboarding`, `traveler/home`, `traveler/requests`, `traveler/request`, `operator/home`, `profile`, `request`, `operator/inbox`, `operator/request`, `session`, `call`, `review`, `history`, `operator/history`, `operator/earnings`
- API access centralized in `app/lib/api.ts`
- Local profile, selected role, traveler request summaries, latest review, and trust persistence via AsyncStorage in `app/lib/storage.ts`
- Entry screen routes first-time users into role-aware onboarding and returning users into the correct home screen
- Onboarding uses `ScrollView` to stay usable on smaller screens and with the keyboard open
- Operator onboarding now uses grouped sections for identity, languages, role, capabilities, experience, response sample, and availability

### Backend

- Express API
- In-memory arrays for users, profiles, help requests, and operator nominations
- Routes:
  - `POST /users`
  - `POST /profiles`
  - `GET /profiles/:userId`
  - `POST /requests/match`
  - `GET /requests/:requestId`
  - `GET /requests/:requestId/responses`
  - `GET /requests/:requestId/summary`
  - `POST /requests/:requestId/respond`
  - `POST /requests/:requestId/reserve`
  - `POST /requests/:requestId/start`
  - `POST /requests/:requestId/complete`
  - `POST /requests/:requestId/review`
  - `POST /requests/:requestId/cancel`
  - `POST /requests/:requestId/expand`
  - `POST /requests/:requestId/retry`
  - `POST /requests/:requestId/no-show`
  - `POST /requests/:requestId/refund`
  - `GET /operator/requests`
  - `GET /users/:userId/requests/completed`
  - `GET /operators/:userId/sessions/completed`
  - `GET /operators/:operatorId/earnings`
- Input validation for user creation, profile availability, role-based profile fields, and request payloads

## Core User Flow

1. App launches and checks AsyncStorage for a saved profile.
2. If no saved profile exists, the user lands on Entry and chooses traveler or operator.
3. The selected role is saved locally and the user enters role-aware onboarding.
4. The app creates a user through `POST /users`.
5. The app creates a profile through `POST /profiles`.
6. The created profile is saved locally.
7. The user is routed to the correct role home.
8. Travelers can open `Find Operator`, `My Requests`, and `Profile` from Traveler Home.
9. Operators can open `Inbox` and `Profile` from Operator Home and can see local availability state.
10. In the current QA baseline, the API returns all operators whose `isAvailable` value is not `false`.
11. The request flow no longer blocks a traveler who already has another active request.
12. All available operators are nominated in QA mode so the traveler can always see candidates.
13. QA-mode nominations are auto-accepted so the traveler can select an operator immediately.
14. The traveler request screen polls for request state and shows selected, accepted, declined, and pending operators.
15. The traveler can reserve a visible operator with an estimated session price.
16. Reservation locks the request to one selected operator and finishes the marketplace-selection step.
17. Traveler and selected operator can both move into a shared reserved-session handoff screen.
18. Starting the session from the handoff screen moves the request into `in_call`.
19. Traveler and selected operator can both see a shared active-session placeholder with the current request snapshot.
20. The active session can be completed explicitly from the shared session screen.
21. Completing the session moves the request to `completed` and payment state to `paid`.
22. The user can then enter the review screen and submit a lightweight review.
23. Review submission is saved against the completed request and updates local trust for the reviewed user.
24. Traveler and operator can both view completed session history from their side of the app.
25. Operators can view a lightweight earnings snapshot derived from completed paid sessions.
26. On later launches, the app goes straight to the correct role home if saved profile data exists.
27. The user can reset the saved profile and return to Entry.

## What Currently Works

- Expo app runs with router-based navigation
- Entry screen supports first-time role selection and returning-user continuation
- Onboarding screen creates a user and profile through the API
- Onboarding supports display name, city, languages, interests, vibe tags, travel style, and help topics through predefined selections
- Onboarding city is constrained to the current mock operator city list for exact-value consistency
- Operator onboarding now supports required languages, roles, capabilities, response sample, availability, and optional experience details
- Operator onboarding uses backend validation that mirrors frontend required fields
- Traveler and operator homes now act as the main role-based dashboards
- Traveler home shows quick actions, request summary, and a current active request card when present
- Operator home shows quick actions, local availability state, and a current work card when present
- My Requests now shows real traveler request summaries from local storage
- Traveler request detail and operator request detail use a shared friendly lifecycle vocabulary
- Profile screen loads route params safely, falls back to AsyncStorage, and shows saved operator onboarding details
- Request screen lets users choose an intent, optional description, and urgency
- Request screen now includes a `DEBUG: Fetch Operators` action for QA
- QA-mode request matching now returns every operator with `isAvailable !== false`
- Request creation in QA mode no longer blocks travelers who already have another active request
- Request creation in QA mode now produces nominations for all available operators
- Operator inbox now shows active nominated traveler requests for the saved local operator profile
- Operator request detail now supports accept and decline responses through the existing nomination flow
- Request screen polls live request state and separates selected, accepted, declined, and pending operators
- QA-mode nominations are auto-accepted so travelers can select an operator without waiting on a second response loop
- Request screen supports pre-session cancellation and terminal-state messaging
- Request screen now shows an estimated session price and a lightweight reservation step before call start
- Accepted operators can be reserved through a payment placeholder flow before the session begins
- Traveler request view now supports explicit operator selection before the session starts
- Operator cards display roles, capabilities, trust, and human-readable reasons
- Backend logs now print total operators, available operators, and returned matches during QA matching
- Request screen now shows `No operators found (QA mode)` instead of a blank operator area if the array is empty
- Session start now requires a reserved selected operator and locks the request to that operator
- Traveler and selected operator now share a lightweight reserved-session handoff screen before call
- Shared session screen now supports reserved, in-progress, and completed states
- Traveler and selected operator can both complete the active session from the shared session screen
- Session summary now includes request state, payment state, `startedAt`, and completion timing for the current handoff flow
- Completing a reserved request automatically moves its payment placeholder state to `paid`
- Call screen simulates a basic call lifecycle with connecting and connected states
- Call screen starts a simple MM:SS timer after the connected state begins
- Review submit now saves one lightweight review per completed request through the API
- Review submit continues to update a local per-user trust snapshot using the latest rating
- Review now acts as the post-session entry point instead of completing the request itself
- Traveler history now lists completed sessions with operator summary, payment state, completion time, and review status
- Operator history now lists completed sessions with traveler summary, quoted amount, rating, and paid-session context when available
- Request completion now finalizes lightweight accounting fields such as `completedAt`, `platformFeePercent`, `operatorEarnings`, and `payoutStatus`
- Operator earnings screen now shows net earnings, gross earnings, pending, paid out, completed sessions, average rating, and recent transactions
- App remembers the created profile between launches
- App auto-routes to Entry or the correct role home based on saved state
- User can clear saved profile and restart the flow
- Onboarding remains usable on small screens because the form scrolls correctly
- Onboarding and profile copy now feel more product-oriented and less like raw dev screens
- Express API exposes health, user creation, profile creation, profile fetch, and match endpoints
- Backend uses safer UUID-based IDs instead of timestamp IDs
- Profile creation now validates array-based profile fields consistently and returns `400` for malformed input
- A dedicated mock operator dataset now lives in `api/src/mock-operators.ts`
- QA mode currently bypasses normal request-time filtering and ranking to force a stable baseline

## Known Limitations

- No authentication
- No database
- No persistent backend storage
- Backend data resets on server restart
- QA mode currently bypasses request-time ranking and most request-time filtering to keep operator results non-empty during testing
- Trust is frontend-only and stored locally on-device
- Trust uses a simple averaging formula with defaults instead of a richer reputation model
- Availability is a simple profile flag and not a real-time presence system
- Operator onboarding currently uses existing internal role and capability values behind friendlier labels rather than a fully separate operator taxonomy
- Call screen is only a placeholder flow and does not implement real audio
- Request polling is client-side and lightweight rather than event-driven realtime
- Request expiry and timeout are applied lazily instead of through a background worker
- Pricing is fixed by intent and does not yet support operator-specific rates
- Payment status is a structural placeholder and does not process or move real money
- Operator identity still depends on the saved local profile because there is no auth layer
- Travelers can currently create multiple active requests in QA mode because duplicate-active-request blocking is temporarily disabled
- Deposit-backed activation, payment authorization, and request spam throttling are not implemented yet
- Reserved-session handoff is a lightweight state transition and not yet a true pre-call coordination layer
- Active session state is still a placeholder layer and not a real live-call transport
- Reviews are single-submit only and do not support editing, deletion, or moderation
- Completed session history is lightweight and does not include advanced filtering or analytics
- Earnings are mock-only snapshots derived from completed paid requests, without real payouts or reconciliation
- API validation is still intentionally light beyond required fields and array shape checks
- Frontend profile state is stored only on-device

## Key Decisions

- Keep the backend in memory for now
- Postpone database work until the core loop is stable
- Postpone authentication until after the MVP flow proves useful
- Keep API logic minimal and avoid extra libraries unless necessary
- Deprioritize mobile debugging in favor of shipping the core loop

## Lessons Learned

- A small API layer keeps frontend networking easier to change
- Local persistence adds meaningful product feel early without backend complexity
- Minimal validation is still worth doing, even in an MVP, especially when profile data becomes more structured
- A forced QA baseline is sometimes more valuable than elegant matching when the team needs one end-to-end flow to stop breaking
- Adding a reservation step creates a useful commitment layer before real payment rails exist
- Adding operator inbox and explicit traveler selection makes the two-sided flow easier to understand without needing a full marketplace backend
- A shared session placeholder makes the active state clearer without forcing a premature realtime architecture
- A small completed-history layer makes the product loop feel inspectable without adding a heavy analytics or ledger system
- Lightweight earnings visibility helps the operator-side flow feel commercially complete without adding real payment infrastructure
- Simpler routing decisions reduce friction during iteration
- Stabilizing screen load behavior matters as much as feature work in small MVP flows
- Small copy and usability improvements can make the app feel more like a product without changing the architecture

## Safety & Constraints

- Keep the system minimal and easy to modify
- Avoid overengineering
- Avoid adding new libraries unless clearly necessary
- Reflect only implemented behavior in this document
- Treat the API as development-stage only because there is no auth or durable storage

## Current Stage

Role-based entry, operator onboarding, local profile memory, dashboard routing, forced QA-mode operator visibility, traveler selection, reservation, session handoff, active session placeholder state, session locking, review submission, completed session history, operator earnings snapshots, local trust, simulated call states, and the review loop are working in a stabilized MVP QA baseline. The app now has a forced working role-to-home-to-request backbone for manual testing, with the matching layer temporarily simplified so operators reliably appear.

## Next Steps

- Restore or refine non-QA matching only after the current forced baseline is consistently reliable
- Extend the new operator onboarding fields into future trust scoring and operator quality filtering
- Continue tightening request lifecycle, reservation, session handoff, active session state, session locking, trust, review, history, and earnings behavior for reliability
- Improve profile and match presentation without changing the core flow
- Hold the architecture simple until the current loop feels consistently stable

## Build Principle

Build the smallest useful version of the core user loop, make it reliable, and delay heavier infrastructure until it is truly needed.

## System Boundaries

- Reality vs simulation:
  Profile data, request creation, role-based matching, operator nominations, traveler selection, reservation state, active session state, session locking, completed history, and operator earnings snapshots are real within the current app flow. The call layer is simulated and does not provide real audio. Trust and saved profile state are local-only on-device, while request reviews and accounting snapshots are stored only in the in-memory MVP backend.
- Single-device limitation:
  The current system behaves as a single-device simulation. There is no shared backend state that synchronizes user activity across devices.
- Identity limitation:
  There is no authentication, and user identity is not persistent across devices or installs.
- Interaction limitation:
  There are no real audio sessions, and operator responses plus reserved and active session states are still exercised through lightweight MVP request-state mechanics rather than a full operator product surface.
- Operator system missing:
  The current MVP supports dynamic support roles in matching, but not a separate authenticated operator application or workflow.
- Platform limitations:
  There is no full realtime system, no backend persistence, no real payment rail, no real payout system, and no global reputation model.
- Purpose of current system:
  This MVP is designed to validate the flow, validate the matching concept, and validate the interaction loop.

## Stage Names

- Day 16: Intent-Based Role Matching
- Day 17: Operator Nomination & Acceptance
- Day 18: Session Locking & Commitment Layer
- Day 19: Fulfillment Recovery + Expand Search + No-Show Handling
- Day 20: Payment Placeholder & Reservation Layer
- Day 21: Operator Inbox
- Day 22: Operator Response & Traveler Selection
- Day 23: Reserved Session State & Pre-Call Handoff
- Day 24: Active Session Placeholder & Post-Call Review Entry
- Day 25: Review Submission & Completed Session History
- Day 26: Operator Earnings Snapshot & Final MVP Flow Polish
- Day 27: QA Matching Baseline & Request Unblocking
- Day 28: Role-Based Entry & Navigation
- Day 29: Local Identity & Role-Aware Onboarding Flow
- Day 30: Traveler and Operator Dashboards
- Day 31: Unified Request Lifecycle
- Day 32: Active Request and Work Cards
- Day 33: Operator Onboarding MVP
