# DigitalBusiness.fun V1

## Goal
Build the single-page DigitalBusiness.fun website from the supplied product specification, with the “100 Businesses Online” campaign and the ₦49,999 website offer as the primary conversion path.

## What will be built
- A premium near-black, lime, and mint visual system with bold editorial typography, subtle grid/glow details, and restrained motion.
- Responsive navigation and sections for Services, 100 Businesses, Process, and Apply.
- A first-screen campaign offer clearly stating: the first 100 businesses can get a website for ₦49,999.
- Build / Automate / Grow service presentation, campaign workflow, five-step process, and truthful `0 / 100` starting counter.
- An accessible application form with the required business, contact, category, phone, and challenge fields; client-side validation and a polished confirmation state.
- Mobile navigation, keyboard focus states, reduced-motion support, and responsive layouts from 320px upward.
- Route-specific page title, description, social metadata, and structured content for search visibility.

## Technical details
- Keep the existing TanStack Start architecture and implement the experience at `/`.
- Use semantic design tokens in the global Tailwind CSS theme and reusable React sections.
- Keep V1 form submission frontend-only because persistent storage is not currently connected; structure it so a future application service can replace the local confirmation without redesigning the page.
- Use Lucide icons and CSS-based visual details rather than stock imagery, matching the brief’s premium technology-product direction.

## Validation
- Check the generated preview at desktop and mobile sizes.
- Verify navigation, form validation/submission state, visual overflow, metadata, and the latest build diagnostics.
