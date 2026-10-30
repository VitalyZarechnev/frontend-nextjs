---
name: 'OPSX: Ship'
description: 'Branch (if needed), commit, push, and open a merge request, with OpenSpec-aware validation and a formatted MR description'
argument-hint: '[TICKET-123] [-b] [--target branch]'
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git branch:*), Bash(git checkout:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git rev-parse:*), Bash(git remote:*), Bash(openspec:*), Bash(glab:*), Bash(ls:*), Bash(npm run prettier), Bash(npm run eslint), Bash(npm run tsc), Bash(npm run test)
category: 'Workflow'
tags: ['workflow', 'ship', 'git', 'experimental']
---

Branch (if needed), commit, push, and open a merge request — the OpenSpec-aware sibling of `/ship`. Same base behavior, plus: gates on `openspec validate --strict`, references the change by id, and opens a merge request whose description is formatted markdown.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`list`, `status`, `validate`). Without a store, commands act on the nearest local `openspec/` root.

Arguments: $ARGUMENTS

Parse the arguments as three independent, order-free, all-optional tokens:

- `--target <branch>` (or `--target=<branch>`) — the branch the merge request should target. Defaults to `master`. Parse this **first** and consume its value, so the branch name is never mistaken for a ticket code.
- Ticket code — a ticket-looking token, e.g. `ABC-123`. If absent, omit it everywhere below.
- `-b` — a boolean flag meaning "force a new branch". Never a branch name; you always generate the branch name yourself, and it is never the MR target.

Be fast and cheap. Do not read source files or review code beyond what's needed to name the change and summarize the spec delta.

**Two different formats — do not mix them**

- **Commit message: plain text.** No markdown — no headers, no bold, no backticks, no links. Plain `- ` bullets are fine.
- **MR description: markdown.** GitLab renders it, so use headers, bold, backticks, and lists freely.

**Steps**

1. Run in one call:
   `git status --short && git branch --show-current && git diff HEAD --stat`
   If there are no changes at all, say so and stop.
   Skim `git diff HEAD` only if the file names alone don't tell you what changed (cap it: `git diff HEAD | head -200`).

2. **Decide whether to create a branch — this also decides whether an MR is opened**

   Create and switch to a new branch if the current branch is `dev`, `main`, or `master`, OR `-b` was passed:
   `{ticket-code}-short-kebab-summary` (no ticket code → just `short-kebab-summary`). Lowercase kebab-case, max ~5 words.

   Remember this decision as `branch_created`. If no branch was created, the work is continuing on an existing branch that already has its merge request, so **step 10 must not open a second one**.

3. **Detect the relevant OpenSpec change(s)**

   `/opsx:ship` normally runs **after** `/opsx:archive`, so the change is usually already archived. The CLI cannot see archived changes: `openspec list --json` returns only active ones (there is no `--archived` flag), and `openspec status --change <name>` **errors** with "Change not found" for an archived change, with or without its date prefix. So locate the change on disk, not through those commands:

   - **Active:** directories directly under `openspec/changes/`, excluding `archive/`.
   - **Archived:** directories under `openspec/changes/archive/`, named `<YYYY-MM-DD>-<change-id>`. Strip the date prefix to get the change id.

   Then:
   - If exactly one change's id or artifacts plausibly match the diff, use it. When several archived changes exist, prefer the most recent by date prefix.
   - If several plausibly match, ask which one(s) this commit covers.
   - If none match, this is a plain commit: skip step 5, omit the OpenSpec parts of the commit and MR description, and otherwise continue normally.

4. **Validate**

   Run `openspec validate --all --strict`. Do **not** run a bare `openspec validate --strict` — with no active change it prints "Nothing to validate" and exits 0, which passes the gate without checking anything. `--all` covers the main specs, which is what still exists after archiving.

   If it fails, stop, report the failure, and do not commit or push — same fail-stop treatment as the format/lint/tsc/test gate in step 6.

5. **Read the change's artifacts**

   From the directory resolved in step 3, read:
   - `specs/<capability>/spec.md` — extract the requirement names listed under ADDED / MODIFIED / REMOVED. Use these verbatim; do not re-derive them from the code diff.
   - `proposal.md` — extract its Non-goals section, if it has one.

   If the delta spec has no ADDED/MODIFIED/REMOVED headers (some archived deltas are merged and rewritten), fall back to the requirement names in the merged spec at `openspec/specs/<capability>/spec.md` and say in the MR description that they come from the merged spec.

6. Format and verify **before** staging, in one call — the same four commands the `Stop` hook runs:
   `npm run prettier && npm run eslint && npm run tsc && npm run test`
   The first two rewrite files (`prettier --write`, `eslint --fix`); running them here puts their edits in the commit instead of leaving post-commit drift. If any of the four exits non-zero, stop, report, and do **not** commit or push.

7. `git add -A`

8. **Commit** with `git commit -m "<subject>" -m "<body>"` — **plain text only**:
   - Subject: `{ticket-code}: <summary>` (no ticket code → just the summary). Capitalized, imperative, no trailing period, ~72 chars max. Pick the verb from what the diff actually does — `Fix`, `Add`, `Remove`, `Refactor`, `Rename`, `Bump`, etc. Avoid vague `Update` unless the change genuinely is a plain update.
   - Body: short `- ` bullets, one per meaningful change, grouped by area, scaled to the diff. Prefer _why_ over _what_. Never restate the subject, never list file names.
   - End the message with, separated from the body by a blank line:
     - `OpenSpec-Change: <id>` — one line per change referenced (omit entirely if none was detected)
     - `Co-Authored-By:` trailer — use the model name you are actually running as, never a hardcoded one. No emoji.

9. `git push -u origin <branch>` (capture stderr — GitLab prints a "create a merge request" URL there).

10. **Open the merge request — only if `branch_created` is true**

    If `branch_created` is false, skip this step entirely and go to step 11.

    Check `glab` is available and authenticated **for this repo's host only**: take the host from `git remote get-url origin` and run `glab auth status --hostname <host>`. Judge only that host's lines. `glab auth status` without `--hostname` reports every host in the user's config, so an unrelated host with no token (commonly a leftover `gitlab.com` entry) prints a red `401` that says nothing about this repo — never read that as a failure here.

    If `glab` is not installed, or that host is not authenticated, skip MR creation, and in your reply give the "create a merge request" URL captured from step 9's stderr plus a one-line hint that `glab` (see README) would have opened it automatically. The commit and push already succeeded — this is not a failure.

    The MR targets the `--target` branch if one was passed, otherwise `master`. If the target branch does not exist on the remote, stop before creating the MR and report it — the commit and push have already succeeded, so nothing is lost.

    Otherwise create the MR, passing the markdown description via a quoted heredoc so backticks and quotes survive:

    ```bash
    glab mr create \
      --title "<same text as the commit subject, plain>" \
      --target-branch <the --target value, or master if not given> \
      --assignee @me \
      --yes \
      --description "$(cat <<'MRDESC'
    <markdown body, see below>
    MRDESC
    )"
    ```

    If `glab` rejects `--assignee @me`, resolve the username with `glab api user` and pass that instead.

    **MR description — markdown, sections in this order.** Omit any section that would be empty; never emit an empty header.

    ```markdown
    ## What and why

    A few sentences — roughly three, not a hard count — in plain language: what this MR does and why it exists. Written for a human reviewer, not a changelog. No file names, no task ids.

    ## Spec changes

    **ADDED**

    - `<requirement name>`

    **MODIFIED**

    - `<requirement name>`

    **REMOVED**

    - `<requirement name>`

    ## Non-goals

    - `<what this MR deliberately does not do>`

    ---

    **OpenSpec change:** `<change-id>`

    Co-Authored-By: <model name you are actually running as> <noreply@anthropic.com>
    ```

    Section rules:
    - **What and why** — always present.
    - **Spec changes** — only when an OpenSpec change was detected. Drop any of ADDED/MODIFIED/REMOVED that has no entries.
    - **Non-goals** — optional. Source it from the change's `proposal.md` Non-goals section; you may add your own observations about what was deliberately left out. If there is nothing real to say, omit the whole section rather than padding it.
    - **OpenSpec change** — only when one was detected.
    - **Attribution** — always present, and always the same `Co-Authored-By:` trailer used in the commit, with the model name you are actually running as. No emoji, no "Generated with" line. Leave it **bare — never wrapped in backticks or a code block** — so GitLab autolinks the address and renders it with an avatar, the same way it renders the trailer on the commit itself.

11. Reply with at most: branch name, commit subject, OpenSpec change id(s) referenced (if any), and the merge request URL (from `glab`, or the manual one from the push output). Nothing else.

**Guardrails**

- Never commit or push if `openspec validate --all --strict` or the format/lint/tsc/test gate failed.
- Resolve changes from disk, not from `openspec list`/`openspec status` — neither can see an archived change, and by ship time the change is usually archived.
- Never open a merge request when no branch was created this run — the existing branch already has one.
- A missing or unauthenticated `glab` never blocks the commit or push; it only means the MR is opened by hand.
- Scope the `glab` auth check to this repo's host. A failing unrelated host in `glab auth status` is not a reason to skip MR creation.
- Keep the commit message plain text and the MR description markdown. Do not let markdown leak into the commit.
- Only cite a change actually detected and confirmed against the diff in step 3 — never invent a reference.
- Don't copy `openspec/config.yaml` context or operation guidance into the commit message or MR description.
- If no OpenSpec change applies, ship without the OpenSpec sections — don't force empty ones in.
