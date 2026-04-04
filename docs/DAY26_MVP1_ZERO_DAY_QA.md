# Day 26 MVP 1 Zero-Day QA

## Foundation Validation
- [ ] Required text fields reject `""`
- [ ] Required text fields reject whitespace-only values like `"   "`
- [ ] Stored identity fields are trimmed after submit
- [ ] Invalid UUID-like ids return `4xx` errors
- [ ] Missing ids return `4xx` errors
- [ ] Duplicate logical records are rejected instead of silently created

## Onboarding And Profile Integrity
- [ ] Onboarding rejects whitespace-only name input
- [ ] Onboarding trims city before submit
- [ ] Profile creation fails cleanly if `userId` is invalid
- [ ] Profile creation fails cleanly if `userId` does not exist
- [ ] Duplicate profile creation for the same user is rejected
- [ ] Rapid double tap on profile create does not create duplicate users or profiles
- [ ] Invalid saved profile data is cleared instead of breaking profile-dependent screens

## Profile Completeness
- [ ] `displayName` is required for every profile
- [ ] `city` is required for every profile
- [ ] Whitespace-only `displayName` is rejected
- [ ] Whitespace-only `city` is rejected
- [ ] Empty array values do not count toward completeness
- [ ] Helper/operator-intent profile requires at least one role
- [ ] Helper/operator-intent profile requires at least one capability
- [ ] Helper/operator-intent profile requires at least one language
- [ ] Backend rejects bypassed incomplete profile payloads
- [ ] Incomplete saved local profile is cleared instead of reused
- [ ] Incomplete operator profile cannot participate in matching

## Request Flow Validation
- [ ] Request creation rejects invalid traveler `userId`
- [ ] Request creation rejects duplicate active request creation for the same traveler
- [ ] Request description is trimmed before submit
- [ ] Request creation shows a loading state while pending
- [ ] Repeated tap on `Find operators` does not create duplicate active requests
- [ ] Expand search does not re-nominate already nominated operators
- [ ] Retry request does not create a fresh request while another active request still exists

## Reserve, Complete, Review Negative Cases
- [ ] Reserve rejects invalid `requestId`
- [ ] Reserve rejects invalid `operatorId`
- [ ] Reserve rejects non-accepted operators
- [ ] Reserve twice for the same operator is blocked
- [ ] Reserve for a different operator after selection is blocked
- [ ] Start session rejects unreserved requests
- [ ] Start session rejects wrong operator ids
- [ ] Complete rejects requests that are not `in_call`
- [ ] Complete twice is blocked
- [ ] Review rejects incomplete requests
- [ ] Review rejects invalid ratings
- [ ] Review rejects duplicate review submission for the same request
- [ ] Review submit button stays disabled while pending

## Earnings Integrity
- [ ] Earnings include only `completed` + `paid` requests
- [ ] Earnings exclude requests without the selected operator
- [ ] Completed request sets `completedAt`
- [ ] Completed request sets `paymentStatus = paid`
- [ ] Completed request sets `platformFeePercent`
- [ ] Completed request sets `operatorEarnings`
- [ ] Completed request sets `payoutStatus` if missing
- [ ] Review rating appears in earnings transactions when present

## Double-Submit Prevention
- [ ] Onboarding submit is blocked while pending
- [ ] Request create is blocked while pending
- [ ] Reserve/select operator is blocked while pending
- [ ] Cancel request is blocked while pending
- [ ] Expand search is blocked while pending
- [ ] Retry request is blocked while pending
- [ ] No-show reporting is blocked while pending
- [ ] Start session is blocked while pending
- [ ] Complete session is blocked while pending
- [ ] Review submit is blocked while pending

## Invalid ID Handling
- [ ] Invalid `userId` on `/profiles/:userId` returns `400`
- [ ] Invalid `requestId` on request detail routes returns `400`
- [ ] Invalid `operatorId` on reserve/no-show/earnings routes returns `400`
- [ ] Unknown but well-formed ids return `404`
- [ ] Traveler-only routes reject unrelated `userId`
- [ ] Reserved/start/complete routes reject wrong selected operator ids

## Legacy And Bad-Data Fallbacks
- [ ] Blank `userId` legacy users are excluded from normal flows
- [ ] Whitespace-only `displayName` legacy profiles are excluded from normal flows
- [ ] Duplicate logical profiles are de-duped in memory
- [ ] Duplicate request ids are excluded from normal flows
- [ ] Duplicate reviews for one request are excluded from normal flows
- [ ] Old records missing `completedAt`, `platformFeePercent`, `operatorEarnings`, or `payoutStatus` still render safely
- [ ] Invalid saved local profile is removed instead of causing broken navigation
- [ ] Invalid saved latest review is removed instead of causing broken review UI

## End-To-End Integrity Check
- [ ] Create traveler profile
- [ ] Create operator profile
- [ ] Create request
- [ ] Accept nomination
- [ ] Reserve selected operator
- [ ] Start session
- [ ] Complete session
- [ ] Submit review once
- [ ] Confirm traveler history shows completed + reviewed state
- [ ] Confirm operator history shows completed state + rating
- [ ] Confirm operator earnings reflect the same request exactly once
