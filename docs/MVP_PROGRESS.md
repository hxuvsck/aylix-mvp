# Aylix MVP Progress

## Current MVP Objective

Validate the core onboarding-to-profile loop with a simple Expo client and Express API, while keeping the system easy to change.

## Current Architecture

### Frontend

- Expo app for React Native and web
- Expo Router for screen routing
- Screens: `onboarding`, `profile`, `request`, `call`, `review`
- API access centralized in `app/lib/api.ts`
- Local profile, latest review, and trust persistence via AsyncStorage in `app/lib/storage.ts`
- Onboarding uses `ScrollView` to stay usable on smaller screens and with the keyboard open
- Onboarding includes a simple local availability selector for helper readiness

### Backend

- Express API
- In-memory arrays for users, profiles, help requests, and operator nominations
- Routes:
  - `POST /users`
  - `POST /profiles`
  - `GET /profiles/:userId`
  - `POST /requests/match`
  - `GET /requests/:requestId`
  - `POST /requests/:requestId/respond`
  - `POST /requests/:requestId/reserve`
  - `POST /requests/:requestId/start`
  - `POST /requests/:requestId/complete`
  - `POST /requests/:requestId/cancel`
  - `POST /requests/:requestId/expand`
  - `POST /requests/:requestId/retry`
  - `POST /requests/:requestId/no-show`
  - `POST /requests/:requestId/refund`
- Input validation for user creation, profile availability, role-based profile fields, and request payloads

## Core User Flow

1. App launches and checks AsyncStorage for a saved profile.
2. If no saved profile exists, the user is routed to onboarding.
3. The user submits onboarding data.
4. The app creates a user through `POST /users`.
5. The app creates a profile through `POST /profiles`.
6. The created profile is saved locally.
7. The app routes to the profile screen.
8. The user can see whether their profile is currently available to help.
9. The user starts a help request from the profile screen by answering `What do you need?`
10. The API ranks available operators by intent fit, role relevance, trust, and availability.
11. The top operators are nominated to the request and the request enters a live response flow.
12. The request screen polls for request state and shows selected, accepted, and pending operators.
13. Once an operator accepts, the request can be reserved with an estimated session price before the call starts.
14. Once one accepted operator is chosen, the session is locked to that operator and the request enters `in_call`.
15. The call screen shows a short connecting state, then a connected state with a simple timer.
16. Ending the call routes the user to a review screen.
17. The user submits a lightweight review, which also updates local trust for the reviewed user and completes the request.
18. Completing a reserved request also advances its payment placeholder state to `paid`.
19. The user returns to the profile screen and can see review memory still reflected in the app.
20. On later launches, the app goes straight to the profile screen if saved profile data exists.
21. The user can reset the saved profile and return to onboarding.

## What Currently Works

- Expo app runs with router-based navigation
- Onboarding screen creates a user and profile through the API
- Onboarding supports display name, city, languages, interests, vibe tags, travel style, and help topics
- Onboarding lets new profiles default to available and optionally mark themselves not available
- Onboarding now supports roles, capabilities, and personality traits for operator matching
- Profile screen loads route params safely, falls back to AsyncStorage, and avoids the earlier render loop issue
- Profile screen shows whether the current profile is available to help
- Profile screen now acts as the entry point into request-based matching
- Request screen lets users choose an intent, optional description, and urgency
- Matching now ranks operators by intent fit, role relevance, trust score, and availability while keeping older profiles backward compatible
- Request creation now produces nominations for the top 3 ranked operators
- Request screen polls live request state and separates selected, accepted, and pending operators
- Request screen supports pre-session cancellation and terminal-state messaging
- Request screen now shows an estimated session price and a lightweight reservation step before call start
- Accepted operators can be reserved through a payment placeholder flow before the session begins
- Operator cards display roles, capabilities, trust, and human-readable reasons
- Session start now locks one accepted operator to the request
- Completing a reserved request automatically moves its payment placeholder state to `paid`
- Call screen simulates a basic call lifecycle with connecting and connected states
- Call screen starts a simple MM:SS timer after the connected state begins
- Review submit now updates a local per-user trust snapshot using the latest rating
- Review submit also completes the active request session explicitly
- App remembers the created profile between launches
- App auto-routes to onboarding or profile based on saved state
- User can clear saved profile and restart the flow
- Onboarding remains usable on small screens because the form scrolls correctly
- Onboarding and profile copy now feel more product-oriented and less like raw dev screens
- Express API exposes health, user creation, profile creation, profile fetch, and match endpoints
- Backend uses safer UUID-based IDs instead of timestamp IDs
- Profile creation now validates array-based profile fields consistently and returns `400` for malformed input
- Matching returns the top 5 rule-based results, excludes zero-score matches, and includes reasons based on shared profile categories

## Known Limitations

- No authentication
- No database
- No persistent backend storage
- Backend data resets on server restart
- Matching is still rule-based with simple scoring weights
- Trust is frontend-only and stored locally on-device
- Trust uses a simple averaging formula with defaults instead of a richer reputation model
- Availability is a simple profile flag and not a real-time presence system
- Call screen is only a placeholder flow and does not implement real audio
- Request polling is client-side and lightweight rather than event-driven realtime
- Request expiry and timeout are applied lazily instead of through a background worker
- Pricing is fixed by intent and does not yet support operator-specific rates
- Payment status is a structural placeholder and does not process or move real money
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
- The shift from static matching into request state creates a more credible coordination loop without requiring heavy infrastructure
- Adding a reservation step creates a useful commitment layer before real payment rails exist
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

Core onboarding, profile memory, local readiness, intent-based role matching, nomination, reservation, session locking, local trust, simulated call states, and the review loop are working in stable MVP form. The app now has a credible request-to-session backbone with an economic placeholder layer and remains in a tightening and QA-focused phase.

## Next Steps

- Refine rule-based matching quality within the current deterministic system
- Continue tightening request lifecycle, nomination handling, reservation, session locking, trust, call, and review behavior for reliability
- Improve profile and match presentation without changing the core flow
- Hold the architecture simple until the current loop feels consistently stable

## Build Principle

Build the smallest useful version of the core user loop, make it reliable, and delay heavier infrastructure until it is truly needed.

## System Boundaries

- Reality vs simulation:
  Profile data, request creation, role-based matching, nominations, reservation state, and session locking are real within the current app flow. The call layer is simulated and does not provide real audio. Reviews, trust, and saved state are local-only and stored on-device.
- Single-device limitation:
  The current system behaves as a single-device simulation. There is no shared backend state that synchronizes user activity across devices.
- Identity limitation:
  There is no authentication, and user identity is not persistent across devices or installs.
- Interaction limitation:
  There are no real audio sessions, and operator responses are still exercised through lightweight MVP request-state mechanics rather than a full operator product surface.
- Operator system missing:
  The current MVP supports dynamic support roles in matching, but not a separate authenticated operator application or workflow.
- Platform limitations:
  There is no full realtime system, no backend persistence, no real payment rail, and no global reputation model.
- Purpose of current system:
  This MVP is designed to validate the flow, validate the matching concept, and validate the interaction loop.

## Stage Names

- Day 16: Intent-Based Role Matching
- Day 17: Operator Nomination & Acceptance
- Day 18: Session Locking & Commitment Layer
- Day 19: Fulfillment Recovery + Expand Search + No-Show Handling
- Day 20: Payment Placeholder & Reservation Layer
