---
name: java-conventions
description: Maintain Java source in this repository, especially Demo.java. Use when adding methods, fixing control flow, or compiling and running Java samples.
paths:
  - "**/*.java"
---

# Java conventions

Treat Java files here as small, compile-and-run samples. Keep them self-contained and free of accidental infinite loops.

## When to use

- Editing `Demo.java` or adding new `.java` samples
- Fixing `main` methods, class structure, or basic arithmetic helpers
- Compiling or running Java demos locally

## Instructions

1. Keep one public class per file, with the filename matching the public class name.
2. Provide a safe `main` that demonstrates the class without hanging (no empty `for (;;)` loops).
3. Prefer clear instance methods for operations (`add`, `sub`, `display`) and keep side effects obvious.
4. Compile and run from the repo root when validating changes:

```bash
javac Demo.java && java Demo
```

5. Avoid introducing build systems (Maven/Gradle) unless the user asks for a fuller Java project.

## Conventions

- Use straightforward Java SE syntax that works with a common JDK.
- Keep methods short; return values rather than printing unless the method is clearly for display.
- Initialize fields intentionally; do not rely on surprising default state in demos.
- If expanding beyond a single file, keep package structure simple or stay in the default package for samples.
