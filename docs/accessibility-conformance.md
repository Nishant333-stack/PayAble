# Accessibility conformance report

**Product:** PayAble checkout and transactions (web)
**Standards:** WCAG 2.1 Level AA, which the revised US Section 508 standard incorporates by reference (36 CFR 1194, E205.4). WCAG 2.0 AA is a subset, so conformance to 2.1 AA also covers 2.0 AA.
**Evaluation methods:**

| Method | What it covers | How to reproduce |
| --- | --- | --- |
| axe-core automated audit | 55 rules tagged `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `section508`, `best-practice` | `npm run test:a11y` |
| Scripted browser tests | Keyboard operation, focus order, focus management, error identification, reflow at 320 px, text-spacing overrides | `npm run test:e2e` |
| Manual review | Criteria automation cannot judge (meaningful sequence, labels that make sense, error suggestions) | Checklist below |
| Screen reader pass | VoiceOver (macOS / iOS), NVDA (Windows), TalkBack (Android) | See *Assistive technology checklist* – to be completed by a tester |

The automated audit runs on **5 page states × 3 viewports (320, 768, 1280 px) × light and dark mode = 30 runs**, on Linux, macOS and Windows in CI. Current result: **0 violations**. axe marks colour contrast as "needs review" only on the 320 px transactions table, because cells scrolled out of the table's viewport can't be measured; they use the same colour tokens as the visible cells, which do pass.

## Colour pairs

| Use | Light (fg / bg) | Ratio | Dark (fg / bg) | Ratio | Requirement |
| --- | --- | --- | --- | --- | --- |
| Body text | `#14213d` / `#ffffff` | 16.0:1 | `#e8ecf4` / `#161d2f` | 14.2:1 | 4.5:1 (1.4.3) |
| Hint text | `#4a5568` / `#ffffff` | 7.5:1 | `#b5bfd1` / `#161d2f` | 9.1:1 | 4.5:1 |
| Error text | `#b3261e` / `#ffffff` | 6.5:1 | `#ff9b91` / `#161d2f` | 8.3:1 | 4.5:1 |
| Primary button | `#ffffff` / `#1434a4` | 10.2:1 | `#0b1530` / `#9db6ff` | 9.1:1 | 4.5:1 |
| Input border | `#6b7689` / `#ffffff` | 4.6:1 | `#8792a8` / `#161d2f` | 5.4:1 | 3:1 (1.4.11) |
| Status: approved / pending | `#1e6b34`, `#8a4b00` / `#ffffff` | 6.5:1, 6.8:1 | `#7ed99a`, `#ffc278` / `#161d2f` | 9.8:1, 10.6:1 | 4.5:1 |
| Focus ring | `#0b5cd5` / `#ffffff` | 6.0:1 | `#ffd166` / `#161d2f` | 11.6:1 | 3:1 (1.4.11) |

## WCAG 2.1 A and AA success criteria

| # | Criterion | Level | Status | How PayAble meets it |
| --- | --- | --- | --- | --- |
| 1.1.1 | Non-text content | A | Supports | Decorative SVGs are `aria-hidden`; the card-type badge has a text equivalent ("Card type: Visa"). |
| 1.2.x | Time-based media | A/AA | Not applicable | No audio or video. |
| 1.3.1 | Info and relationships | A | Supports | Real `<label>`s, `<fieldset>/<legend>` for radio groups, `<dl>` for the order summary, table `<caption>` and `<th scope>`, landmarks. |
| 1.3.2 | Meaningful sequence | A | Supports | DOM order matches visual order at every breakpoint; tab-order test enforces it. |
| 1.3.3 | Sensory characteristics | A | Supports | Instructions never rely on shape, position or colour ("the 3 digits on the back" is text). |
| 1.3.4 | Orientation | AA | Supports | No orientation lock. |
| 1.3.5 | Identify input purpose | AA | Supports | `autocomplete="cc-name"`, `cc-number`, `cc-exp`, `cc-csc`. |
| 1.4.1 | Use of colour | A | Supports | Errors use an "Error:" text prefix and a thick bar as well as colour; status pills carry text. Sorted column uses an arrow and `aria-sort`. |
| 1.4.2 | Audio control | A | Not applicable | |
| 1.4.3 | Contrast (minimum) | AA | Supports | See colour pairs; checked by axe in both themes. |
| 1.4.4 | Resize text | AA | Supports | All sizes in `rem`; layout tested at 200 % zoom equivalent. |
| 1.4.5 | Images of text | AA | Supports | None used. |
| 1.4.10 | Reflow | AA | Supports | No horizontal page scrolling at 320 CSS px (automated test). The data table scrolls inside a labelled, focusable region, which the criterion allows for tables. |
| 1.4.11 | Non-text contrast | AA | Supports | Input borders, focus ring and radio buttons meet 3:1. |
| 1.4.12 | Text spacing | AA | Supports | Automated test injects the WCAG spacing overrides and checks nothing overflows. |
| 1.4.13 | Content on hover or focus | AA | Supports | No hover-only content or tooltips. |
| 2.1.1 | Keyboard | A | Supports | Whole payment and sorting flows completed keyboard-only in tests. |
| 2.1.2 | No keyboard trap | A | Supports | |
| 2.1.4 | Character key shortcuts | A | Not applicable | No single-key shortcuts. |
| 2.2.1 | Timing adjustable | A | Supports | No session timeout in the demo. A production build would warn before timeout and allow extension. |
| 2.2.2 | Pause, stop, hide | A | Not applicable | No moving content. |
| 2.3.1 | Three flashes | A | Supports | No flashing. |
| 2.4.1 | Bypass blocks | A | Supports | Skip link is the first focusable element (test). |
| 2.4.2 | Page titled | A | Supports | Unique titles; title is prefixed "Error:" when the form has errors, and changes to "Payment complete". |
| 2.4.3 | Focus order | A | Supports | Focus moves to the error summary on failed submit and to the confirmation heading on success. |
| 2.4.4 | Link purpose | A | Supports | Error-summary links repeat the full error message. |
| 2.4.5 | Multiple ways | AA | Supports | Primary navigation on every page (two-page site). |
| 2.4.6 | Headings and labels | AA | Supports | |
| 2.4.7 | Focus visible | AA | Supports | 3 px focus ring on every interactive element. |
| 2.5.1 – 2.5.4 | Pointer gestures, cancellation, label in name, motion | A | Supports | Single-tap only; visible labels match accessible names. |
| 3.1.1 | Language of page | A | Supports | `lang="en"`. |
| 3.1.2 | Language of parts | AA | Not applicable | |
| 3.2.1 / 3.2.2 | On focus / on input | A | Supports | Focusing or typing never submits or navigates. |
| 3.2.3 / 3.2.4 | Consistent navigation / identification | AA | Supports | Shared header and footer. |
| 3.3.1 | Error identification | A | Supports | Errors in text, linked with `aria-describedby`, `aria-invalid="true"`. |
| 3.3.2 | Labels or instructions | A | Supports | Every input has a label and, where needed, a hint with an example. |
| 3.3.3 | Error suggestion | AA | Supports | Messages say how to fix ("Security code must be 4 digits."). |
| 3.3.4 | Error prevention (financial) | AA | Partially supports | Data is checked before submission and nothing is charged. A production build should add a review step before final payment. |
| 4.1.1 | Parsing | A | Supports | (Obsolete in WCAG 2.2; HTML is valid.) |
| 4.1.2 | Name, role, value | A | Supports | Native controls only; sort buttons inside headers with `aria-sort`. |
| 4.1.3 | Status messages | AA | Supports | Card-type detection, sort changes and result counts are announced through polite live regions without moving focus. |

## Assistive technology checklist

To be completed by hand – automated tools cannot confirm what a screen reader actually says.

| Task | VoiceOver + Safari (Mac) | NVDA + Chrome (PC) | TalkBack + Chrome (Android) | VoiceOver (iOS) |
| --- | --- | --- | --- | --- |
| Card type is announced after typing the first digits | ☐ | ☐ | ☐ | ☐ |
| Error summary is read when submit fails | ☐ | ☐ | ☐ | ☐ |
| Each field reads label → hint → error | ☐ | ☐ | ☐ | ☐ |
| Confirmation heading is read after payment | ☐ | ☐ | ☐ | ☐ |
| Sort state is read on table headers | ☐ | ☐ | ☐ | ☐ |
| Windows High Contrast mode keeps borders and focus visible | n/a | ☐ | n/a | n/a |
