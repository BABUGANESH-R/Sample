---
name: pr-demo-walkthrough
description: Prepare pull request summaries with a concise feature list, run instructions, and visual demo artifacts. Use when finishing app work, drafting PR bodies, or packaging screenshots and recordings for review.
disable-model-invocation: true
---

# PR demo walkthrough

Turn finished sample-app work into a clear PR that reviewers can try quickly.

## When to use

- Explicitly invoked with `/pr-demo-walkthrough`
- After an app feature is implemented and locally verified
- When packaging screenshots or a demo video for the PR

## Instructions

1. Confirm the branch has commits pushed and the working tree matches what you will describe.
2. Write a short PR summary focused on what shipped and how to try it.
3. Include run instructions that match the stack. For static apps:

```bash
python3 -m http.server 8080
```

4. Attach visual proof when the change is UI-facing:
   - Start/home state
   - Core interaction
   - Result/win/empty state if relevant
   - Optional short mp4 of the happy path
5. Keep the body scannable: summary, features, how to try, demo artifacts.
6. Do not invent features that were not implemented. If QA found gaps, list them honestly or fix them first.
7. Create or update the PR for the current branch after the description and artifacts are ready.

## Suggested PR shape

```markdown
## Summary
One or two sentences on the change.

## Features
- Bullet list of user-visible behavior

## How to try
Commands and URL

## Demo
Screenshots and/or video
```
