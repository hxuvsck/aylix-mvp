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
- Onboarding uses `ScrollView` to stay usable on smaller screens and with the keyboard open

### Backend

- Express API
- In-memory arrays for users and profiles
- Routes:
  - `POST /users`
  - `POST /profiles`
  - `GET /profiles/:userId`
- Input validation for user creation and profile array fields

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
- Onboarding supports display name, city, languages, interests, vibe tags, travel style, and help topics
- Profile screen displays saved profile data
- Profile screen can fetch and display top matches with score and human-readable match reasons
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
- Matching is still rule-based with simple overlap scoring
- No weighting system for stronger or weaker signal types
- No real-time presence or availability in matching
- No call functionality yet
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
- Simpler routing decisions reduce friction during iteration
- Small copy and usability improvements can make the app feel more like a product without changing the architecture

## Safety & Constraints

- Keep the system minimal and easy to modify
- Avoid overengineering
- Avoid adding new libraries unless clearly necessary
- Reflect only implemented behavior in this document
- Treat the API as development-stage only because there is no auth or durable storage

## Current Stage

Core onboarding, profile memory, and basic rule-based matching are working in stable MVP form, with match explanations now visible in the profile experience.

## Next Steps

- Refine rule-based matching quality within the current deterministic system
- Improve profile and match presentation without changing the core flow
- Continue tightening the core loop before adding heavier systems like calls or real-time state

## Build Principle

Build the smallest useful version of the core user loop, make it reliable, and delay heavier infrastructure until it is truly needed.
