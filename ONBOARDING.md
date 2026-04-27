# Contributor Onboarding

Welcome to **vetted-field-connect**. This document outlines the requirements every new contributor must satisfy before any pull request is merged. These steps exist to protect the integrity of the platform, our users, and the workers we vet.

---

## 1. Mandatory Vetting Requirements

Before your first pull request can be merged, you **must** submit the following to a project maintainer:

### 1.1 LinkedIn Profile
- A link to your active LinkedIn profile.
- Your profile must list your real name and accurate work history.
- Profiles that are private, empty, or fewer than 30 days old will require additional verification.

### 1.2 References From Your Last 3 Jobs
- Provide **one professional reference per role** from your three most recent positions (3 references total).
- For each reference include:
  - Full name
  - Job title and company
  - Working email address (no personal Gmail/Yahoo unless that is the company's primary email)
  - Phone number
  - Your relationship to them (e.g., direct manager, team lead, peer)
  - Approximate dates you worked together
- References will be contacted before merge approval. Please notify them in advance.

### 1.3 Submission Process
1. Fork the repository and complete your work in a feature branch.
2. Open a pull request as a **draft**.
3. Email the LinkedIn link and three references to the maintainers (see `MAINTAINERS.md` or contact the repo owner) — **do not** post personal contact information in the PR, issues, or commit messages.
4. Once vetting is complete, a maintainer will mark your PR ready for review.

> **No PR will be merged until vetting is complete.** This applies to all contributors, including first-time documentation fixes.

---

## 2. Code of Conduct

We are building a platform rooted in trust. We expect that same trust between contributors.

### 2.1 Our Standards
Examples of behavior that contributes to a positive environment:
- Using welcoming and inclusive language.
- Being respectful of differing viewpoints and experiences.
- Gracefully accepting constructive criticism.
- Focusing on what is best for the community and the product.
- Showing empathy toward other community members.

### 2.2 Unacceptable Behavior
- Harassment, intimidation, or discrimination of any kind.
- Personal attacks, insults, or derogatory comments.
- Public or private harassment, including unwelcome sexual attention.
- Publishing others' private information (doxxing) without explicit permission.
- Sharing or soliciting credentials, API keys, or user data outside of secure channels.
- Any conduct that would be inappropriate in a professional setting.

### 2.3 Scope
This Code of Conduct applies in all project spaces — the repository, issues, pull requests, discussions, code review, and any public or private channels where you represent the project.

### 2.4 Enforcement
Violations may be reported privately to the repository owner. Maintainers will:
1. Review the report confidentially.
2. Determine an appropriate response (warning, temporary ban, or permanent removal).
3. Notify the reporter of the outcome.

Maintainers who do not follow or enforce the Code of Conduct in good faith may face temporary or permanent consequences as determined by project leadership.

---

## 3. Contribution Guidelines

### 3.1 Before You Start
- Open an issue describing the bug or feature **before** writing significant code, so maintainers can confirm scope and avoid duplicate work.
- Check existing issues and PRs — your idea may already be in flight.
- For anything affecting worker vetting, hiring compliance, or user data, tag the issue `compliance-review` so a maintainer can weigh in early.

### 3.2 Branching and Commits
- Branch from `main` using a descriptive name: `feat/...`, `fix/...`, `docs/...`, `chore/...`.
- Write clear, imperative commit messages (e.g., `Add LinkedIn validation to onboarding form`).
- Keep commits focused — one logical change per commit when possible.
- Rebase on `main` before opening a PR; do not merge `main` into your branch.

### 3.3 Pull Request Checklist
Every PR must:
- [ ] Reference the related issue (e.g., `Closes #123`).
- [ ] Include a clear description of *what* changed and *why*.
- [ ] Include screenshots or screen recordings for any UI change.
- [ ] Pass all CI checks (lint, type-check, tests, build).
- [ ] Include or update tests for new behavior.
- [ ] Update relevant documentation (`README.md`, in-app copy, etc.).
- [ ] Confirm the contributor has completed the vetting in Section 1 (3 references + project photos).

### 3.4 Code Review
- At least **one maintainer approval** is required before merge.
- Address review comments by pushing additional commits — do not force-push during active review.
- Once approved, a maintainer will squash-merge to keep `main` history clean.

### 3.5 Lovable Sync Notes
This repository is synced with **Lovable**. Please keep these in mind:
- Avoid editing auto-generated files unless you understand how Lovable will reconcile them.
- After merging, verify the change appears correctly in the Lovable preview.
- If a change must be made directly in Lovable, document it in the PR so maintainers can keep both sides in sync.

### 3.6 Security and Compliance
- Never commit secrets, API keys, `.env` files, or production credentials.
- Treat any worker, applicant, or reference data as confidential — even in tests use synthetic data.
- Report suspected vulnerabilities privately to the repository owner; do **not** open a public issue.

### 3.7 Licensing
By submitting a contribution, you agree that your work will be licensed under the same license as this repository, and you certify that you have the right to contribute the code.

---

## 4. Questions

If anything in this document is unclear, open a discussion or contact the repository owner before starting work. Welcome aboard.
