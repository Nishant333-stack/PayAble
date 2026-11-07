# Usability testing

## Plan

**Goal:** confirm that people – including screen-reader, keyboard-only and zoom users – can pay by card and find a past transaction without help.

**Format:** moderated, think-aloud, 30 minutes, remote or in person. Participants use their own device (Mac, Windows PC, Android or iPhone) and their own assistive technology.

### Tasks

| # | Task given to participant | Success means |
| --- | --- | --- |
| 1 | "Pay for the annual plan using this test card." (card printed on a slip) | Confirmation page reached |
| 2 | "Try paying again; this time the card number on the slip has a typo." | Notices the error and fixes it |
| 3 | "Your Amex card's security code is 1234. Pay with it." | Finds the 4-digit code hint, pays |
| 4 | "Find how much you spent at Skyways Airlines." | States the correct amount |
| 5 | "Get your approved transactions into a spreadsheet." | CSV opened in Excel or Numbers |

### Metrics

- Task completion rate (per task)
- Time on task
- Errors per task and whether the participant recovered without help
- System Usability Scale (SUS) questionnaire after the session
- Single Ease Question (1–7) after each task

### Moderator script (excerpt)

> Thanks for helping. We're testing the website, not you, so there are no wrong answers. Please think out loud as you go – what you're looking for, what you expect to happen. I can't help during the tasks, but I'll answer questions at the end. You can stop at any time.

### Results template

| Participant | Device / AT | T1 | T2 | T3 | T4 | T5 | SUS | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | | | | | | | | |

## Heuristic review (team, before user testing)

Issues found by reviewing the build against Nielsen's heuristics and by the automated browser tests. All were fixed before the first user session.

| Issue | Heuristic / WCAG | Severity | Fix |
| --- | --- | --- | --- |
| Showing a field error on blur shifted the layout when the user clicked Pay, so the click landed on empty space at tablet width | Error prevention; 3.2.2 | Serious | Skip blur validation when focus is moving to Pay; submit validates everything |
| Card-type badge overlapped long numbers on narrow screens | Aesthetic & minimalist design; 1.4.10 | Moderate | Badge moves below the input under 24 em |
| Live region announced on every keystroke | Recognition over recall | Moderate | Announce only when detected card type changes |
| Amex security code is on the front, not the back | Match between system and real world | Moderate | Hint text updates with card type |
| Errors shown only in red | 1.4.1 Use of colour | Serious | "Error:" prefix and left bar |
| Caret jumped to the end when editing the middle of the card number | User control and freedom | Moderate | Caret position preserved by counting digits (automated test) |
