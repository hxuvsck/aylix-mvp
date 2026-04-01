# Aylix MVP Progress

## Current MVP Objective

Validate the core onboarding-to-profile loop with a simple Expo client and Express API, while keeping the system easy to change.

## Current Architecture

### Frontend

- Expo app for React Native and web
- Expo Router for screen routing
- Screens: `onboarding`, `profile`
- API access centralized in `app/lib/api.ts`
- Local profile persistence via AsyncStorage in `app/lib/storage.ts`

### Backend

- Express API
- In-memory arrays for users and profiles
- Routes:
  - `POST /users`
  - `POST /profiles`
  - `GET /profiles/:userId`
- Minimal input validation on profile and user creation

## Core User Flow

1. App launches and checks AsyncStorage for a saved profile.
2. If no saved profile exists, the user is routed to onboarding.
3. The user submits onboarding data.
4. The app creates a user through `POST /users`.
5. The app creates a profile through `POST /profiles`.
6. The created profile is saved locally.
7. The app routes to the profile screen.
8. On later launches, the app goes straight to the profile screen if saved profile data exists.
9. The user can reset the saved profile and return to onboarding.

## What Currently Works

- Expo app runs with router-based navigation
- Onboarding screen creates a user and profile through the API
- Profile screen displays saved profile data
- App remembers the created profile between launches
- App auto-routes to onboarding or profile based on saved state
- User can clear saved profile and restart the flow
- Express API exposes health, user creation, profile creation, and profile fetch endpoints
- Backend uses safer UUID-based IDs instead of timestamp IDs

## Known Limitations

- No authentication
- No database
- No persistent backend storage
- Backend data resets on server restart
- No matching, calls, trust, or review flow yet
- API validation is intentionally minimal
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
- Minimal validation is still worth doing, even in an MVP
- Simpler routing decisions reduce friction during iteration

## Safety & Constraints

- Keep the system minimal and easy to modify
- Avoid overengineering
- Avoid adding new libraries unless clearly necessary
- Reflect only implemented behavior in this document
- Treat the API as development-stage only because there is no auth or durable storage

## Current Stage

Core onboarding and profile memory loop is working in MVP form.

## Next Steps

- Stabilize the onboarding and profile experience
- Improve UI clarity and polish within the current flow
- Continue tightening the core loop before adding new major systems

## Build Principle

Build the smallest useful version of the core user loop, make it reliable, and delay heavier infrastructure until it is truly needed.
