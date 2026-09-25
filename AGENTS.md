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
- Keep application submission presentation-only until persistent storage is connected; this avoids implying that business details were saved.
- Persist the light/dark theme choice in browser storage and apply it before page rendering to prevent a visible theme flash.
