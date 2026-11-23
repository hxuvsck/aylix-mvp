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

With no Supabase keys the app runs in **demo mode**: any phone number, any 6-digit code, operators reply on timers,
nothing is saved. Profile → "Demo: view the app as" switches between traveler, operator and admin.

## Connect Supabase

1. Create a Supabase project (region: Seoul `ap-northeast-2`).
2. Run `supabase/migrations/20261123000000_aylix_core.sql` in the SQL editor (or `supabase db push`).
3. Database → Extensions → enable `pg_cron`, then run
   `select cron.schedule('aylix-tick', '* * * * *', 'select public.tick()');`
   (moves offers on after 5 min, refunds after 10 min, releases payouts after 48 h).
4. Authentication → Providers → Phone: turn on and connect an SMS provider (Twilio, MessageBird or Vonage).
5. Copy `app/.env.example` to `app/.env` and fill in the project URL and anon key.
6. Make yourself admin: `update profiles set role = 'admin' where phone = '<your phone>';`
7. Approve an operator (after their interview): sign them in once in the app, then
   `select admin_set_operator('<their user id>', 'approved');` while signed in as admin, or update `operators` in the dashboard.

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
