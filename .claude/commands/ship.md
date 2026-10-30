---
description: Branch (if needed), commit, push, and open a merge request
argument-hint: '[TICKET-123] [-b] [--target branch]'
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git branch:*), Bash(git checkout:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git rev-parse:*), Bash(git remote:*), Bash(glab:*), Bash(npm run prettier), Bash(npm run eslint), Bash(npm run tsc), Bash(npm run test)
---

Arguments: $ARGUMENTS

Parse the arguments as three independent, order-free, all-optional tokens:

- `--target <branch>` (or `--target=<branch>`) — the branch the merge request should target. Defaults to `master`. Parse this **first** and consume its value, so the branch name is never mistaken for a ticket code.
- Ticket code — a ticket-looking token, e.g. `ABC-123`. If absent, omit it everywhere below.
- `-b` — a boolean flag meaning "force a new branch". It is never a branch name; you always generate the branch name yourself, and it is never the MR target.

This command knows nothing about OpenSpec: it never reads `openspec/`, never runs `openspec validate`, and never adds spec sections to anything. Use `/opsx:ship` for that.

Be fast and cheap. Do not read source files, do not review code, do not think long. The diff stat + file names + a short `git diff` skim is enough to name the change.

1. Run in one call:
   `git status --short && git branch --show-current && git diff HEAD --stat`
2. If there are no changes at all, say so and stop.
3. Skim `git diff HEAD` only if the file names alone don't tell you what changed (cap it: `git diff HEAD | head -200`).
4. If the current branch is `dev`, `main`, or `master`, OR `-b` was passed:
   create and switch to `{ticket-code}-short-kebab-summary` (no ticket code → just `short-kebab-summary`).
   Lowercase kebab-case, max ~5 words.
   Remember this as `branch_created` — it decides whether step 9 opens a merge request. If no branch
   was created, the work is continuing on an existing branch that already has its merge request.
5. Format and verify **before** staging, in one call — the same four commands the `Stop` hook runs:
   `npm run prettier && npm run eslint && npm run tsc && npm run test`
   The first two rewrite files (`prettier --write`, `eslint --fix`), and the hook runs them again once
   this turn ends — so anything they touch after a commit would land as uncommitted drift and the
   pushed commit would be missing its own formatting. Running them here puts those edits in the
   commit instead. If any of the four exits non-zero, stop, report, and do **not** commit or push:
   the hook would fail on the same code seconds later, except by then it would already be pushed.
6. `git add -A`
7. Commit with `git commit -m "<subject>" -m "<body>"`:
   - Subject: `{ticket-code}: <summary>` (no ticket code → just the summary).
     Capitalized, imperative, no trailing period, ~72 chars max. Pick the verb from what the diff
     actually does — `Fix`, `Add`, `Remove`, `Refactor`, `Rename`, `Bump`, etc. Avoid vague `Update`
     unless the change genuinely is a plain update.
   - Body: short bullet lines (`- ...`), one per meaningful change, grouped by area. Scale with the diff —
     a trivial one-file change needs no body at all, a large one may need five bullets. Never pad.
   - Prefer _why_ over _what_: the diff already shows what changed. Note the bug being fixed or the
     constraint behind a non-obvious choice when you can tell from the diff — never guess or invent a reason.
   - Never restate the subject, never list file names.
   - End the message with your standard `Co-Authored-By:` trailer, preceded by a blank line. Use the
     model name you are actually running as — never a hardcoded one. Include it even when there is
     no body; then the trailer is the whole second `-m`.
     No emoji.
8. `git push -u origin <branch>` (capture stderr — GitLab prints a "create a merge request" URL there).
9. **Open the merge request — only if `branch_created` is true.** Otherwise skip to step 10.

   Check `glab` for this repo's host only: take the host from `git remote get-url origin` and run
   `glab auth status --hostname <host>`. Judge only that host's lines — without `--hostname` it reports
   every configured host, so an unrelated tokenless host (commonly a leftover `gitlab.com`) prints a red
   `401` that says nothing about this repo. Never read that as a failure here.

   If `glab` is missing or that host is not authenticated, skip MR creation and give the "create a merge
   request" URL from step 8 plus a one-line hint that `glab` (see README) would have opened it
   automatically. The commit and push already succeeded — this is not a failure.

   The MR targets the `--target` value, or `master` if none was passed. If that branch does not exist on
   the remote, stop before creating the MR and report it — the commit and push already succeeded.

   Otherwise, passing the description via a quoted heredoc so backticks and quotes survive:

   ```bash
   glab mr create \
     --title "<the commit subject, verbatim>" \
     --target-branch <the --target value, or master> \
     --assignee @me \
     --yes \
     --description "$(cat <<'MRDESC'
   <the commit body bullets, as markdown>

   Co-Authored-By: <model name you are actually running as> <noreply@anthropic.com>
   MRDESC
   )"
   ```

   The description is the **same content as the commit body** — the same changelog bullets, rendered as
   markdown — followed by the `Co-Authored-By:` trailer. No section headers, no extra narrative. Leave the
   trailer **bare, never in backticks or a code block**, so GitLab autolinks the address and renders it with
   an avatar the way it does on the commit. If the diff was trivial enough that the commit had no body, the
   description is just the trailer. If `glab` rejects `--assignee @me`, resolve the username with
   `glab api user` and pass that instead.

10. Reply with at most: branch name, commit subject, and the merge request URL (from `glab`, or the manual
    one from the push output). Nothing else.
