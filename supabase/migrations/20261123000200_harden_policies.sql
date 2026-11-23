-- Signed-in-only policies; anonymous visitors only ever insert website forms.
alter policy "admin reads help" on help_intake to authenticated;
alter policy "admin reads applications" on operator_applications to authenticated;
alter policy "own profile" on profiles to authenticated;
alter policy "edit own profile" on profiles to authenticated;
alter policy "chat partner profile" on profiles to authenticated;
alter policy "own operator row" on operators to authenticated;
alter policy "see own requests" on requests to authenticated;
alter policy "admin edits requests" on requests to authenticated;
alter policy "see own offers" on request_offers to authenticated;
alter policy "read chat" on messages to authenticated;
alter policy "write chat" on messages to authenticated;
alter policy "see own payment" on payments to authenticated;
alter policy "see rating" on ratings to authenticated;
alter policy "admin moderates" on ratings to authenticated;
alter policy "see own payouts" on payout_items to authenticated;
alter policy "admin pays" on payout_items to authenticated;

revoke execute on function is_admin, my_role, can_see_request from public, anon;
alter function settings() set search_path = public;
alter function is_open(timestamptz) set search_path = public;
