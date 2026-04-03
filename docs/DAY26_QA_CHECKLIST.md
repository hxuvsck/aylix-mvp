# Day 26 QA Coverage

## Global
- [ ] App boots without crash
- [ ] No blank screens
- [ ] No infinite loading on normal flow
- [ ] No obvious API failure during normal use
- [ ] Navigation works
- [ ] Back navigation does not break state
- [ ] Titles and main CTAs are visible on each page
- [ ] No overlapping or cut-off UI
- [ ] Scroll works where needed
- [ ] No duplicate buttons from rerender
- [ ] Empty states look intentional
- [ ] Loading states appear where needed
- [ ] Error states appear where needed

## Home
- [ ] Home page loads
- [ ] Main CTA buttons are visible
- [ ] No leftover placeholder or dev text
- [ ] Traveler entry is understandable
- [ ] Operator entry is understandable
- [ ] Every CTA routes correctly
- [ ] No dead buttons
- [ ] No routes point to missing pages

## Onboarding
- [ ] Onboarding page opens
- [ ] Required fields are visible
- [ ] Traveler profile can be created
- [ ] Operator profile can be created
- [ ] Availability toggle works
- [ ] Invalid form input is blocked
- [ ] Missing required fields are blocked
- [ ] Loading state appears during submit
- [ ] Rapid repeated submit does not create duplicates

## Profile
- [ ] Saved profile data loads
- [ ] Role-specific fields display correctly
- [ ] Availability is visible for operators
- [ ] Profile shortcuts render correctly
- [ ] Earnings shortcut works if shown
- [ ] Profile save/edit still works
- [ ] Updated profile persists after refresh

## Request Flow
- [ ] Request screen opens
- [ ] Request intent can be selected
- [ ] Request details can be entered
- [ ] Valid request submits successfully
- [ ] Invalid request is blocked
- [ ] Loading state appears during request submit
- [ ] Quote is shown
- [ ] Currency is shown correctly
- [ ] `paymentStatus` starts as `quoted`
- [ ] Initial request status is correct
- [ ] Only available operators appear
- [ ] Operator cards render correctly
- [ ] No duplicate results from refresh
- [ ] No-operator state renders cleanly

## Request Detail
- [ ] Request info loads correctly
- [ ] Selected operator is shown correctly
- [ ] Quote amount is correct
- [ ] Payment state is correct
- [ ] Request state is correct
- [ ] Reserve action works
- [ ] `paymentStatus` moves from `quoted` to `reserved`
- [ ] Request becomes reserved
- [ ] Reserved state persists after reload
- [ ] Repeat reserve is blocked or handled safely
- [ ] Double tap does not create inconsistent state

## Session
- [ ] Session page opens from reserved request
- [ ] Correct request is linked
- [ ] Correct operator is linked
- [ ] No missing data in session summary
- [ ] Reserved state is clearly distinct from active state
- [ ] Active session state is understandable
- [ ] Wrong or unrelated sessions cannot be started
- [ ] Complete action works
- [ ] Duplicate complete action is blocked
- [ ] Request status becomes `completed`
- [ ] `paymentStatus` becomes `paid`
- [ ] `completedAt` is set
- [ ] `operatorEarnings` is set
- [ ] `platformFeePercent` is set
- [ ] `payoutStatus` becomes `available` unless already paid

## Review
- [ ] Only completed requests can be reviewed
- [ ] Uncompleted requests do not show review action
- [ ] Completed unreviewed requests show review action
- [ ] Rating can be selected
- [ ] Optional review text works
- [ ] Submit succeeds
- [ ] Loading state appears during submit
- [ ] Success confirmation appears
- [ ] Review persists after refresh
- [ ] Duplicate review is blocked
- [ ] Reviewed request no longer allows repeat review
- [ ] Rating appears in traveler history
- [ ] Rating appears in operator history
- [ ] Rating contributes to operator average
- [ ] Rating appears in earnings transaction row when available

## Traveler History
- [ ] Traveler history loads
- [ ] Completed requests appear
- [ ] Ordering makes sense
- [ ] No duplicate items
- [ ] Completed state is visible
- [ ] Reviewed state is visible
- [ ] Unreviewed completed requests show a clean fallback
- [ ] Empty history state works
- [ ] Older requests missing newer accounting fields render safely

## Operator Inbox
- [ ] Operator inbox loads
- [ ] Assigned or nominated work renders correctly
- [ ] Missing request fields do not crash the screen
- [ ] Traveler summary is visible
- [ ] Request state is visible
- [ ] Buttons match actual behavior
- [ ] No dead buttons

## Operator History
- [ ] Operator history loads
- [ ] Completed items appear
- [ ] Ordering makes sense
- [ ] Completed state is clearly shown
- [ ] Rating is shown when review exists
- [ ] Sessions without ratings show a clean fallback
- [ ] `Included in earnings` appears for completed paid sessions
- [ ] Operator history aligns with traveler history for the same request

## Earnings
- [ ] Earnings page opens from profile
- [ ] Earnings page opens from operator history
- [ ] Loading state appears first
- [ ] Empty state works with zero earnings
- [ ] Error state works on fetch failure
- [ ] Only completed and paid requests are included
- [ ] Only requests for the selected operator are included
- [ ] Gross total is correct
- [ ] Net total is correct
- [ ] Pending total is correct
- [ ] Paid out total is correct
- [ ] Completed session count is correct
- [ ] Review count is correct
- [ ] Average rating is correct
- [ ] Each transaction shows traveler name
- [ ] Each transaction shows intent
- [ ] Each transaction shows completed date
- [ ] Each transaction shows gross and net
- [ ] Each transaction shows payout status
- [ ] Rating appears when available
- [ ] Transactions are sorted newest first
- [ ] Null or missing dates do not break the list

## Data Consistency
- [ ] One request can be tracked end-to-end across all screens
- [ ] Request ID stays consistent across request, session, review, history, and earnings
- [ ] Quote remains consistent across the lifecycle
- [ ] `paymentStatus` transitions correctly
- [ ] Review exists only once
- [ ] Operator rating updates correctly
- [ ] Earnings update correctly
- [ ] Completed paid request is marked as included in earnings

## Regression
- [ ] Home page still loads
- [ ] Onboarding still works
- [ ] Profile save still works
- [ ] Request creation still works
- [ ] Reserve still works
- [ ] Complete still works
- [ ] Review still works
- [ ] No previously working route is broken by Day 26 changes

## Edge Cases
- [ ] Double tapping submit does not break state
- [ ] Double tapping reserve does not break state
- [ ] Double tapping complete does not break state
- [ ] Double tapping review submit does not break state
- [ ] Reopening the app still shows correct state
- [ ] Older requests without `completedAt` render safely
- [ ] Older requests without `platformFeePercent` render safely
- [ ] Older requests without `operatorEarnings` render safely
- [ ] Older requests without `payoutStatus` render safely
- [ ] No-requests empty state looks intentional
- [ ] No-earnings empty state looks intentional
- [ ] No-history empty state looks intentional
- [ ] Invalid operator ID for earnings fails gracefully
- [ ] Invalid request ID fails gracefully
- [ ] Invalid review attempt fails gracefully
- [ ] Invalid reserve attempt fails gracefully
- [ ] Invalid complete attempt fails gracefully

## Suggested Test Matrix
- [ ] Traveler can create profile
- [ ] Traveler can create request
- [ ] Traveler can select operator
- [ ] Traveler can reserve request
- [ ] Traveler can complete session
- [ ] Traveler can review session
- [ ] Traveler can view history
- [ ] Operator can create profile
- [ ] Operator can appear in matching
- [ ] Operator can see work in inbox
- [ ] Operator can see completed request in history
- [ ] Operator can see rating
- [ ] Operator can see earnings
- [ ] Review twice is blocked
- [ ] Complete twice is blocked
- [ ] Reserve twice is blocked
- [ ] Completed unreviewed item renders correctly
- [ ] Operator with zero earnings renders correctly
- [ ] Operator with mixed reviewed and unreviewed completed sessions renders correctly

## Lifecycle Test
- [ ] Create request
- [ ] Match operator
- [ ] Select operator
- [ ] Reserve request
- [ ] Open session
- [ ] Complete request
- [ ] Submit review
- [ ] Check traveler history
- [ ] Check operator history
- [ ] Check operator earnings
