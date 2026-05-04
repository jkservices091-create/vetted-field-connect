# Trade Entrance Quizzes

This folder contains entrance knowledge tests for every trade involved in building a house, inside and out. Workers must pass the quiz for any trade they want to be eligible to take jobs in.

## Trades Covered

1. Site Prep & Excavation
2. Concrete & Foundations
3. Framing & Rough Carpentry
4. Roofing
5. Siding & Exterior Finish
6. Windows & Doors
7. Insulation & Air Sealing
8. Drywall & Plaster
9. Painting (Interior & Exterior)
10. Finish Carpentry & Trim
11. Flooring
12. Tile & Stone
13. Plumbing
14. Electrical
15. HVAC
16. Cabinetry & Countertops
17. Landscaping & Hardscaping
18. Handyman / Punch-List

## Format

Every quiz follows the same structure:

- **20 multiple-choice questions** per trade
- **4 options per question** (A–D)
- **Passing score: 80%** (16 of 20 correct)
- **Time limit:** 30 minutes (suggested, enforced by the platform)
- **Question mix:**
  - ~25% safety / PPE / OSHA basics
  - ~25% materials, tools, and equipment
  - ~25% technique, sequencing, and best practices
  - ~15% code and standards basics
  - ~10% judgment / scenario questions

## File Layout

```
/quizzes/
  README.md                       (this file)
  <trade-name>.md                 (worker-facing quiz, no answers)
  answer-keys/
    <trade-name>-key.md           (correct answers + brief explanations)
```

## Scoring Rules

- Each correct answer = 1 point. No partial credit, no negative marking.
- 16/20 (80%) is required to qualify for that trade.
- A worker may retake a failed quiz **after a 7-day cooldown**, up to 3 attempts in any 90-day window.
- Quiz results are stored on the worker's profile with a timestamp and version number.
- Quizzes are versioned. When a quiz is updated, previously-passed workers retain qualification for 12 months before being prompted to retake.

## Integration Notes (for Lovable / app)

- Each `.md` file is plain Markdown. Questions are numbered `1.` through `20.` and options are labeled `A.` `B.` `C.` `D.`.
- Answer keys use the format `1. **C** — short explanation.` so a parser can extract the correct letter and the rationale.
- Treat the quizzes as the source of truth — render them in-app from this folder rather than duplicating the content in code.
- Randomize the order of questions and the order of options on each attempt to discourage memorization.
- Photo-based or scenario-based question banks can be added per trade later under `/quizzes/<trade-name>-scenarios.md`.

## Authoring Standards

When adding or editing questions:

- Keep stems short and unambiguous. One concept per question.
- Avoid trick wording, double negatives, or "all of the above."
- Distractors must be plausible — wrong answers should reflect common real-world mistakes, not nonsense.
- Cite a code section, manufacturer instruction, or OSHA standard in the answer key when relevant.
- Avoid region-specific code questions in the entrance quiz (use job-specific add-on quizzes for those).

## Disclaimer

These quizzes are a screening tool, not a substitute for licensure. Workers performing trades that require state or local licenses (electrical, plumbing, HVAC, roofing in some jurisdictions) must still hold and submit valid licenses through the standard vetting flow described in `ONBOARDING.md`. A passing quiz score does **not** authorize unlicensed work.
