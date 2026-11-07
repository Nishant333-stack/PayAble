# User research plan

User-centred design starts with who will use the checkout and what gets in their way. This document sets out the research questions, the people we design for, and how findings feed the backlog.

## Research questions

1. Where do people slow down or make mistakes when entering card details on a phone?
2. How do screen-reader and keyboard-only users find out that something went wrong, and how quickly can they fix it?
3. Do people trust a checkout that says nothing is charged until they press Pay? What reassures them?
4. How do people with low vision use zoom and dark mode during payment?

## Methods

| Method | Participants | Output |
| --- | --- | --- |
| Short interviews (20 min) | 5–6 people who shop online at least monthly, including at least 2 assistive-technology users | Pain points, quotes, journey map |
| Moderated usability test | 5 per round, see [usability-testing.md](usability-testing.md) | Task success, time on task, error rate, SUS score |
| Heuristic review | Team | Issues ranked by severity |
| Analytics (production only) | All users | Field-level drop-off and error frequency |

Five participants per round is enough to surface most usability problems in a focused flow; we then fix and re-test rather than testing once with many people.

## Proto-personas

These are **assumption-based personas** written before interviews. They guide early design decisions and are replaced by evidence-based personas once research is done.

### Asha – commuter paying on a phone
Pays for rail passes and groceries one-handed on a crowded train. Small screen, patchy network, often interrupted.
**Needs:** big tap targets, a numeric keypad, card type detected automatically, no data lost if she is interrupted.
**Design response:** 48 px inputs, `inputmode="numeric"`, network badge, validation only on blur so she isn't nagged mid-typing.

### Rahul – blind, uses NVDA on a Windows laptop
Fast keyboard and screen-reader user. Abandons checkouts where errors appear silently or focus jumps unexpectedly.
**Needs:** every field labelled, errors announced and linked to fields, predictable focus.
**Design response:** error summary that receives focus and links to each field, `aria-describedby` on hints and errors, confirmation heading gets focus.

### Meera – low vision, 64, uses a Mac with 200 % zoom and dark mode
Uses browser zoom and system dark mode. Struggles with low-contrast grey text and layouts that need sideways scrolling.
**Needs:** strong contrast in both themes, layout that reflows when zoomed.
**Design response:** AA contrast tokens for light and dark, mobile-first layout that reflows at 320 CSS px, rem-based sizing.

### Kabir – small-business owner reconciling payments
Checks transactions weekly and copies them into Excel for his accountant.
**Needs:** find a payment quickly, sort by amount, export.
**Design response:** searchable, sortable transactions table and an "Export for Excel" CSV with a UTF-8 BOM so the ₹ symbol survives.

## From research to backlog

Each finding becomes a backlog item with the persona, the evidence and a severity (critical / serious / moderate / minor). Accessibility issues are never filed below "serious" if they block a task. See [development-process.md](development-process.md).
