# Aylix app

Traveler, operator and admin app for the Aylix pilot (Seoul first, Ulaanbaatar summer 2027).
One Expo codebase runs on iOS, Android and the web. Backend is Supabase.

Locked pilot model: ₮25,000 per Request · 80% operator / 20% Aylix · operator accepts within 5 min or it moves on ·
no accept in 10 min → 100% refund · 1 free rematch · 09:00–23:00 Korea time · 48 h review window and payout hold.

## Layout

| Path | What |
|---|---|
| `app/` | Expo Router app (screens follow the UX-flow IDs: TR-xx traveler, OP-xx operator, AD-xx admin, SH-xx shared) |
| `supabase/migrations/` | Database: tables, row-level security, and the Request state machine as SQL functions |
| `api/` | Old Express skeleton, no longer used |

## Run the app

```bash
cd app
npm install
npx expo start          # press i / a / w for iOS, Android, web
```

Without `app/.env` the app runs in **demo mode**: any phone number, any 6-digit code, operators reply on timers,
nothing is saved. Profile → "Demo: view the app as" switches between traveler, operator and admin.

## Supabase

Project **aylix** (`mgpkgnnnvagqdnjmmomj`, Seoul). The migrations in `supabase/migrations/` are applied, and the
`aylix-tick` cron job runs `tick()` every minute (5-min offer expiry, 10-min refund, 48 h payout release).
`app/.env.example` holds the public URL and publishable key; copy it to `app/.env`.

Still to do in the Supabase dashboard:
1. **Authentication → Providers → Phone:** turn on and connect an SMS provider (Twilio, MessageBird or Vonage).
   Until then, add test numbers with fixed codes under Phone → "Test phone numbers".
2. **Make yourself admin** after your first sign-in: `update profiles set role = 'admin' where phone = '<your phone, no +>';`
3. **Approve an operator** after their interview: they sign in once, then (as admin) `select admin_set_operator('<user id>', 'approved');`

## How a Request moves

```
awaiting_payment ──admin confirms qPay──▶ searching ──operator accepts──▶ matched ──traveler: Solved──▶ closed_solved
                                           │  5 min no answer → next operator          │ rematch (once) → searching
                                           └─ 10 min, nobody → refunded (100%)         └─ Not solved → under_review ──admin 100/50/0──▶ closed
```

All transitions are SQL functions (`create_request`, `submit_payment`, `admin_confirm_payment`, `respond_offer`,
`request_rematch`, `close_request`, `rate_request`, `admin_decide`, `tick`). Clients can't change status directly.

## Not built yet

- Card payments (Stripe) — waits for the Stripe entity (roadmap 1b). qPay/bank is confirmed by hand by an admin.
- Operator approval steps inside the app (ID + selfie upload, OP-02). Applications come from aylix.io/operators/apply.
- Operator "close with outcome" (OP-06); the traveler closes the Request for now.
- Push notifications for new offers (operators keep the app open while online).
- Payout batches (AD-04) — payouts are listed per item; batches are paid by hand twice a week.
