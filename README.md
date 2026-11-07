# PayAble

**An accessible, responsive card checkout – WCAG 2.1 AA / Section 508 conformant, with a C++ card-validation core.**

[Live demo](https://nishant333-stack.github.io/PayAble/) · [Accessibility conformance report](docs/accessibility-conformance.md) · [User research](docs/user-research.md) · [Usability testing](docs/usability-testing.md) · [Process](docs/development-process.md)

Payment forms are where accessibility failures cost the most: if a screen-reader user can't find out why a card was rejected, they can't pay. PayAble is a checkout and transaction-history web app designed so that everyone – keyboard-only users, screen-reader users, people zoomed to 200 %, people on a 320 px phone in dark mode – can complete a payment.

## Highlights

- **Accessibility first.** 0 axe-core violations across 30 audit runs (5 UI states × 3 viewports × light/dark) covering WCAG 2.0, 2.1 and Section 508 rules; every A/AA success criterion documented in a [conformance report](docs/accessibility-conformance.md).
- **Inclusive form design.** Error summary that takes focus and links to each field, `aria-describedby` hints and errors, polite live-region announcements, `autocomplete` tokens, numeric keypad on mobile, 44–48 px targets, visible 3 px focus ring, Windows High Contrast support, `prefers-reduced-motion`.
- **Responsive.** Mobile-first CSS grid; no horizontal scrolling at 320 CSS px and robust to the WCAG 1.4.12 text-spacing overrides – both enforced by tests.
- **C++ / object-oriented core.** Each card network (Visa, Mastercard, RuPay, Amex, Discover) is a class deriving from an abstract `CardNetwork`; a registry resolves overlapping IIN ranges. A JavaScript port runs in the browser, and **both are tested against the same 23 card / 7 expiry / 6 CVV vectors** so they can't drift.
- **Usability.** Validation on blur instead of on every keystroke, caret-preserving card-number formatting, card-type-aware CVV hints, plain-language error messages. Heuristic-review findings and a moderated usability test plan (tasks, SUS, think-aloud script) are in [docs/usability-testing.md](docs/usability-testing.md).
- **Reporting in Excel.** CI turns the axe results into an `.xlsx` workbook (runs, rules checked mapped to WCAG/508, violations) with live formulas; the transactions page exports a UTF-8 CSV that opens cleanly in Excel.
- **Runs on Macs and PCs.** GitHub Actions builds and tests everything on macOS, Windows and Linux.

## Architecture

```
PayAble/
├── core/                  C++17 validation library (CMake)
│   ├── include/payable/   CardNetwork hierarchy, NetworkRegistry, CardValidator
│   ├── src/               implementation + payable-cli
│   └── tests/             runs the shared vectors + unit tests
├── web/                   HTML, CSS, vanilla JavaScript (no framework, no build step)
│   ├── index.html         checkout
│   ├── transactions.html  sortable, filterable history + Excel export
│   ├── css/styles.css     design tokens, light/dark, forced-colours
│   └── js/                validator (port of core), checkout, transactions
├── test-vectors/          cards.json – single source of truth for both validators
├── tests/
│   ├── unit/              node:test – JS validator vs shared vectors
│   ├── e2e/               keyboard, focus, reflow, text-spacing (headless Chrome)
│   └── a11y/              axe-core WCAG 2.1 AA + Section 508 audit
├── tools/                 static server, Excel report generator
└── docs/                  conformance report, research, usability, process
```

```
          test-vectors/cards.json
             │              │
     ┌───────▼──────┐ ┌─────▼────────┐
     │ C++ core     │ │ JS validator │──► checkout UI (browser)
     │ CardNetwork  │ │ (same rules) │
     │  ├ Visa      │ └──────────────┘
     │  ├ Mastercard│
     │  ├ RuPay     │   ctest + node:test must agree on every vector
     │  ├ Amex      │
     │  └ Discover  │
     └──────────────┘
```

## Run it

Requires Node.js 20+, a C++17 compiler and CMake. Works the same on macOS, Windows and Linux.

```bash
# Web app
npm install
npm start                      # http://127.0.0.1:8080

# C++ core
cmake -S core -B core/build
cmake --build core/build --config Release
ctest --test-dir core/build -C Release --output-on-failure
./core/build/payable-cli "4111 1111 1111 1111"
# {"network":"visa","luhn":true,"lengthOk":true,"valid":true,"errors":[]}
```

## Test it

```bash
npm test             # 45 JS unit tests (shared vectors + formatting/parsing)
npm run test:e2e     # 16 keyboard / focus / reflow / text-spacing tests in headless Chrome
npm run test:a11y    # 30 axe-core audits → reports/axe-results.json
npm run report       # → reports/accessibility-audit.xlsx
```

The browser tests find Chrome automatically on macOS, Windows and Linux; set `CHROME_PATH` to use a different binary.

Test card numbers: Visa `4111 1111 1111 1111`, Mastercard `5555 5555 5555 4444`, RuPay `6522 0000 0000 0006`, Amex `3782 822463 10005`. Nothing is sent anywhere.

## Licence

MIT
