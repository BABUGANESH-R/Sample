---
name: python-scripting
description: Write and fix Python scripts in this repository. Use when editing Test.py or adding Python utilities, demos, or local helper scripts.
paths:
  - "**/*.py"
---

# Python scripting

Keep Python code small, readable, and safe to run. This repo uses simple scripts (for example `Test.py`) rather than a packaged application.

## When to use

- Creating or updating Python demos, helpers, or tests
- Replacing unsafe infinite loops or blocking scripts with controlled behavior
- Adding local tooling that should run with `python3`

## Instructions

1. Prefer `python3` and standard-library modules first.
2. Never leave intentional infinite loops (`while True:` without a clear exit) in committed sample code unless the user explicitly wants a long-running process and documents how to stop it.
3. Put executable logic behind `if __name__ == "__main__":` when the file may be imported.
4. Use clear function names and short docstrings for non-obvious helpers.
5. Fail fast with helpful errors for bad arguments or missing files.
6. Keep scripts runnable from the repo root:

```bash
python3 Test.py
```

## Conventions

- Match existing simple style: minimal dependencies, obvious control flow.
- Prefer argparse (or plain `sys.argv` for tiny tools) over hard-coded paths.
- Print concise status messages; avoid noisy logs.
- If adding tests, keep them next to the script or under a dedicated `tests/` folder and document the run command.
