# GDABVI — Life Beyond Sight (Multi-Page Redesign)

Soft-modern design: airy white space, rounded corners, pill buttons, gentle blue/sand washes. Brand colors from the GDABVI logo.

## Structure

| File | Page |
|---|---|
| index.html | Home |
| about.html | About (mission, history timeline, team, board, careers) |
| services.html | Services (zigzag rows, paratransit, get-started stepper) |
| eye-health.html | Eye Health (vision-loss accordion, courtesy rules) |
| resources.html | Resources for Basic Needs (with staff-review banner) |
| get-involved.html | Donate spotlight, ways to give, sponsorship |
| contact.html | Contact info + message form |
| styles.css / script.js | Shared design system and accessibility scripts |
| images/ | All photos and logos |

## Accessibility (every page)

Listen-to-page + per-section 🔊 read-aloud, A−/A/A+ text sizing (remembered), high-contrast toggle (remembered), Atkinson Hyperlegible body font, Nunito headings, 19px base text, skip link, keyboard navigation, alt text everywhere.

## Board feedback still honored

Live PayPal donate button (header, hero, footer, Get Involved) · no all-caps small blue text · no black backgrounds by default · email in contact info (confirm info@gdabvi.org — only jsmock@gdabvi.org verified from archive) · Life Beyond Sight tagline throughout · Resources page flagged "under staff review."

## Deploy

**GitHub Pages:** upload the folder contents to a repo → Settings → Pages → main branch, root. Done.

**Wix:** either embed the GitHub Pages URL via Embed → Embed a site, or rebuild page-by-page in the Wix editor using these files as the spec — the multi-page structure maps 1:1 to Wix pages.

## Before go-live checklist

- [ ] Confirm general email address (info@gdabvi.org is unverified)
- [ ] Confirm PayPal button is active
- [ ] Staff fact-check Resources page, then delete the review banner
- [ ] Confirm schedules (support group, Learning Lab)
- [ ] Update team/board if changed; add next Walk date when scheduled
