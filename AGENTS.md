<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project architecture

- Keep the V1 marketing experience as one scrolling route at `/`; the approved product specification explicitly requires single-page navigation.
- Applications and payments are written only via server functions using security-definer DB functions (create_application / confirm_payment); tables have no public access, so pricing and slot logic can't be bypassed.
- Paystack uses redirect checkout; payment is confirmed only by server-side verify or the signed webhook at /api/public/paystack-webhook, never by the browser callback.
- /payment/callback is a utility route outside the single-page marketing experience.
