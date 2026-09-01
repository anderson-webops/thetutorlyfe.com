# The Tutor Lyfe design QA

Date: 2026-09-01

## Comparison target

- Source visual truth: `design-evidence/source/`, captured from `https://thetutorlyfe.com` before implementation.
- Rendered implementation: `http://127.0.0.1:3333`, captured through the in-app browser.
- Routes: `/`, `/about`, `/programs`, and `/contact`.
- State: light theme, unauthenticated public site, source copy and assets, reveal animations settled unless an interaction
  state is named explicitly.

## Capture normalization

All comparisons used CSS pixels at device scale factor 1 with no browser chrome in the capture.

| Route | Desktop source and implementation | Mobile source and implementation |
| --- | --- | --- |
| Home | 1440 x 5012, viewport 1440 x 900 | 390 x 8680, viewport 390 x 844 |
| About | 1440 x 3219, viewport 1440 x 900 | 390 x 5354, viewport 390 x 844 |
| Programs | 1440 x 3427, viewport 1440 x 900 | 390 x 6092, viewport 390 x 844 |
| Contact | 1440 x 1609, viewport 1440 x 900 | 390 x 3111, viewport 390 x 844 |

The source and implementation document heights match on every route at both target widths. Temporary Nuxt developer
tool chrome was disabled before final captures so it could not affect page dimensions.

## Full-view comparison evidence

- Home desktop: `design-evidence/comparisons/home-desktop-full-source-left.png`
- Programs desktop: `design-evidence/comparisons/programs-desktop-full-source-left.png`
- Final home top: `design-evidence/comparisons/home-desktop-top-source-left.png`
- Final programs mobile top: `design-evidence/comparisons/programs-mobile-top-source-left.png`

The source is on the left and the implementation is on the right. Full-view inspection and section-boundary measurements
confirmed matching order, proportions, grid width, section rhythm, image crops, card surfaces, footer height, and responsive
collapse behavior.

## Focused comparison evidence

- Open desktop FAQ, normalized to the same 800 x 505 component crop:
  `design-evidence/comparisons/programs-desktop-faq-region-source-left.png`
- Focused desktop contact form: `design-evidence/comparisons/contact-desktop-focus-source-left.png`
- Open mobile navigation: `design-evidence/comparisons/home-mobile-menu-source-left.png`
- Mobile program-card typography and color: `design-evidence/comparisons/programs-mobile-top-source-left.png`

Focused regions were required because the full-page scale was too small to judge form controls, FAQ spacing, focus rings,
navigation text, and program-card typography accurately.

## Required fidelity surfaces

- Fonts and typography: the captured Poppins, Nunito Sans, and Caveat files are served locally. Families, weights, sizes,
  line heights, letter spacing, wrapping, and hierarchy match the source at both target widths.
- Spacing and layout rhythm: the 1140-pixel desktop container, section padding, grid tracks, card gaps, radii, borders,
  shadows, hero geometry, and mobile stacking match. Every route has the same source and implementation document height.
- Colors and tokens: the source brand palette, gradients, shadows, status colors, and surface colors are retained. Two
  low-contrast source treatments were deliberately strengthened: primary navigation button text is white, and breadcrumb
  links use the darker green with an underline.
- Image quality and asset fidelity: all four source JPEGs are stored locally with matching hashes, subjects, dimensions,
  crops, aspect ratios, and border treatments. No hotlinked or substitute imagery is used.
- Copy and content: all four public pages preserve the captured text, including the source's explicit notice that real
  testimonials are still forthcoming. No implementation prompt or placeholder developer copy is visible.
- Icons: the source uses platform emoji for its visible symbols, so the implementation preserves those same symbols and
  sizes. It does not replace any source image asset with code art.
- Responsiveness: desktop and mobile page widths have no horizontal overflow, overlap, clipping, broken grids, or unusable
  controls. Tap targets and the mobile navigation remain usable at 390 x 844.
- Accessibility: native focus indicators, semantic controls, labels, alternative text, reduced-motion behavior, keyboard
  reachability, and menu focus return were checked. The accessibility smoke test reported no WCAG A or AA violations on
  all four routes in both configured color-scheme passes.

## States and interactions tested

- Header navigation and all primary route links.
- Mobile menu open, close, and Escape-key focus return.
- All five FAQ controls, including independently open states and keyboard semantics.
- Contact required-field validation, focus placement, sending state, fail-closed unconfigured-destination state, and
  successful mocked 202 state with form reset.
- Browser console errors and warnings after final route navigation: none.
- External visual asset and font requests from the rendered page: none.

The production contact destination remains intentionally unconfigured. This is an operational handoff item, not a visual
QA blocker, and no lead was transmitted to the former site's endpoint.

## Comparison history

### Pass 1

- Finding: **P1 inherited utility-style collision**. The implementation rendered a 1280-pixel container instead of the
  source's 1140-pixel container, flattened pill buttons to 4-pixel corners, reduced button padding, and lowered heading
  weight. Evidence: `design-evidence/implementation/pass-01/home-desktop-1440x900-top.png` against
  `design-evidence/source/home-desktop-1440x900-00-top.png`.
- Fix: disabled the inherited UnoCSS Nuxt module so its generated `.container`, `.btn`, and heading styles could not
  override the captured source stylesheet.
- Post-fix evidence: `design-evidence/comparisons/home-desktop-top-source-left.png`. Computed hero, button, heading, image,
  and container geometry matched the source.

### Pass 2

- Finding: **P2 program grade color specificity**. Program grade labels inherited muted card text instead of the source
  green because the replacement class was less specific than `.card p`.
- Fix: scoped the helper as `.card .program-grade`.
- Post-fix evidence: `design-evidence/comparisons/programs-mobile-top-source-left.png`.

### Accessibility correction

- Finding: the source's dark-on-green navigation CTA and color-only breadcrumb links triggered serious contrast and
  link-distinguishability findings.
- Fix: used white navigation CTA text and a darker, underlined breadcrumb link while preserving all layout geometry.
- Post-fix evidence: final browser captures plus a clean accessibility smoke run across four routes and two configured
  color-scheme passes.

## Findings

No actionable P0, P1, or P2 visual, behavioral, responsive, content, icon, image, or accessibility findings remain.

The only remaining work is operational: configure and verify a new owner-controlled contact destination before accepting
production submissions.

final result: passed
