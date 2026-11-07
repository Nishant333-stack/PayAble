# Development process

PayAble follows a lightweight **Scrum** process: short sprints, a prioritised backlog, and a definition of done that makes accessibility a release gate rather than an afterthought.

## Cadence

| Event | When | Output |
| --- | --- | --- |
| Sprint planning | Start of each 1-week sprint | Sprint goal and committed backlog items |
| Daily check-in | Async note | Blockers raised early |
| Sprint review | End of sprint | Demo, incl. a keyboard-only and screen-reader walkthrough |
| Retrospective | End of sprint | One process change to try next sprint |

## Sprint history

| Sprint | Goal | Delivered |
| --- | --- | --- |
| 1 | Validation core | C++ OOP network model, Luhn/expiry/CVV rules, shared test vectors |
| 2 | Accessible checkout | Responsive form, error summary, live announcements, dark mode |
| 3 | Transactions & reporting | Sortable/filterable table, Excel export, axe audit, Excel report |
| 4 | Hardening | Keyboard/reflow/text-spacing tests, CI on macOS/Windows/Linux, conformance report |

## Definition of done

A backlog item is done only when:

- [ ] C++ and JS validators pass the shared vectors (`ctest`, `npm test`)
- [ ] axe-core reports 0 violations at 320 / 768 / 1280 px in light and dark mode (`npm run test:a11y`)
- [ ] Keyboard and focus tests pass (`npm run test:e2e`)
- [ ] It works keyboard-only and has been checked with one screen reader
- [ ] Copy is plain language and error messages say how to fix the problem
- [ ] CI is green on Linux, macOS and Windows

## Branching

`main` is always releasable and deploys to GitHub Pages. Work happens on short-lived feature branches merged through pull requests once CI passes.

## Issue severity

| Severity | Meaning | Example |
| --- | --- | --- |
| Critical | Blocks a task for some users | Pay button not reachable by keyboard |
| Serious | Task possible but very hard | Errors not announced to screen readers |
| Moderate | Slows people down | Caret jumps while editing |
| Minor | Cosmetic | Inconsistent spacing |
