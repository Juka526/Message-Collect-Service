create policy "deny_direct_public_access"
on public.messages_213c66c3
for all
to anon, authenticated
using (false)
with check (false);
