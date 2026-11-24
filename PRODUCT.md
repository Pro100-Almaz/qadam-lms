# Product

## Register

product

## Users
Staff and families of Qadam School, working in Russian, Kazakh or English:
- **Homeroom teachers** need the whole picture of one child (grades across subjects, attendance, wellbeing), often right before a parent meeting.
- **Admins, principals and supervisors** need to spot students at risk quickly: falling grades, absences, flags.
- **Psychologists** track wellbeing states and their history over time.
- **Subject teachers** check how a student is doing in their own subject.
- **Parents** follow their own child through a read-only view of the same data.

Most visits are short and purposeful. The user wants to understand "how is this student doing, and what changed?" without digging.

## Product Purpose
Qadam LMS runs the school's academic life: subjects, lessons, grading, homework, attendance, clubs, wellbeing and AI student reports. It succeeds when a teacher or parent can answer a question about a student in seconds, and act on it: talk to the family, adjust support, or celebrate progress.

## Brand Personality
Calm, clear, caring. The voice is respectful and formal («Вы» / «Сіз»): it says what happened and what to do next, and never blames the user. Data is told as a story. Trends and comparisons come first and the exact numbers sit one step deeper, so understanding comes before detail. No emoji, no hype.

## Anti-references
- Generic SaaS admin dashboards: identical stat-card grids, hero metrics with gradient accents, TailAdmin stock blue `#465FFF`.
- Walls of cards where a table or a chart would read faster.
- Grade data that looks alarming or gamified: academic grades should not look like psych-state stars, and red should be kept for real problems.
- One endless scroll that mixes unrelated lists.

## Design Principles
1. **Story before spreadsheet.** Lead with the trend and the comparison (student vs class, this quarter vs last). Put raw records in tables one level down.
2. **One scale, one meaning.** Each kind of score keeps its own consistent scale, colour and label everywhere it appears.
3. **Calm by default, loud only for risk.** Show semantic colour only when something needs attention, and make colour never the only signal.
4. **Respect the reader's role.** Show each role what it came for first, and hide what it cannot act on.
5. **Never fail silently.** Every section has explicit loading, empty and error states with a retry.

## Accessibility & Inclusion
- WCAG 2.1 AA. Text contrast rules are in `docs/brand-guidelines.md`: brand-500 is never used for body text.
- Charts carry labels and legends and have a table or text equivalent, so they are never colour-only.
- Every action must be reachable by keyboard and on touch screens (no hover-only controls).
- Respect `prefers-reduced-motion`.
- Text must survive the longer Kazakh and Russian strings, so layouts cannot depend on English lengths.
