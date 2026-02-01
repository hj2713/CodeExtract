You are extracting a code example from a source codebase into an isolated, runnable Next.js page.

## Source

**Path:** src/source
**Analysis:** 
this was cloned from github. this is a landing page

## Target Directory

**Path:** src/app/extracted

It contains the following files -- first you should read it. 
THIS IS YOUR WORKING DIRECTORY
YOU MUST DO YOUR BEST TO NOT CREATE MANY FOLDERS OR FILES OUTSIDE OF THIS DIRECTORY!

- page.tsx — Next.js page demonstrating the requirement
- actions.ts — Server actions or API calls (if needed)
- types.ts — All TypeScript types/interfaces
- utils.ts — Helper functions, fixtures, mocks
- README.md — Explanation of the example

## Requirement

Extract and isolate: {{VARIABLE_REQUIREMENT}}

## Additional Context

{{VARIABLE_CONTEXT}}

## Dependency Handling

As you extract, you will encounter dependencies. Handle them as follows:

**NPM packages:**
If genuinely required, include them and note in README. If only used for one small thing, consider inlining the logic instead.

**Internal code from source repo:**
- If portable (small, self-contained utility/type/hook): Copy it over with a comment noting origin (e.g., `// Ported from: src/utils/shapes.ts`)
- If not portable (deeply entangled): Mock it with hardcoded values or fixture data
- In both cases, do these in a seperate folder/file inside the working dir ("extracted")

**Databases / APIs / Auth / External services:**
Always mock. Use hardcoded fixture data. Never require actual infrastructure.
Example: Instead of database query, use `const MOCK_DATA = [...]`
Example: Instead of auth, use `const CURRENT_USER = { id: "user_1", name: "Demo User" }`

**State management:**
Simplify to React useState/useReducer unless state management IS the pattern being extracted.

## Output Requirements

The code example must be:
1. **Runnable** — Works in a Next.js 14 app (app router)
2. **Isolated** — No imports from source codebase
3. **Minimal** — Only code necessary to demonstrate the requirement
4. **Clear** — A developer understands the pattern in <5 minutes

## README.md Must Include

# [Requirement Title]

## What this demonstrates
[One paragraph explanation]

## Original implementation
[Brief description of how source repo did it]

Key files from source:
- [file path] — [what it did]
- [file path] — [what it did]

## Dependencies

### NPM packages required
- [package] — [why needed]

### Code ported from source
- [util name] from [original path] — [description]

### Mocked in this example
- [what was mocked] — [how it was mocked]

## How to use
[Any setup or usage instructions]

---

Execute: Analyze the source, extract relevant code, handle dependencies as encountered, produce the code example.
