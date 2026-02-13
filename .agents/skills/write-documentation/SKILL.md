---
name: write-documentation
description: Updates JSDoc, README, AGENTS.md, and docs content to match behavior and API changes. Use whenever implementation changes affect users, contributors, or future agents.
---

# Write Documentation

Use this skill to keep code and documentation synchronized as part of the same change.

## When To Use

- Public API additions or signature changes
- User-facing behavior changes
- Internal workflow or architecture changes
- New modules or systems that need discoverable guidance

## Prerequisite Checks

- Identify whether the change is public API, internal workflow, or architecture.
- Identify all touched entry points and exports.
- Identify which docs are currently source-of-truth for the affected behavior.

## Documentation Targets

- Public exports: add complete JSDoc (`description`, `@param`, `@returns`, `@throws`, `@example`).
- User-facing usage changes: update `README.md`.
- Agent workflow or internal pattern changes: update `AGENTS.md`.
- New architecture or subsystem docs: update `docs/`.

## Workflow

1. Classify the change type before finalizing implementation.
2. Build a docs-impact checklist from changed files and exports.
3. Update JSDoc while writing code, not as a post-pass.
4. Update `README.md` usage snippets for any user-facing behavior change.
5. Update `AGENTS.md` for contributor or internal policy updates.
6. Update `docs/` for architecture-level changes.
7. Verify examples match current signatures and behavior.
8. Re-check docs during quality gate run to prevent stale guidance.

## Commonly Missed Cases

- Return-type changes with unchanged function names.
- New error tags introduced without JSDoc `@throws` updates.
- Configuration and environment variable changes not reflected in docs.
- Internal behavior changes that invalidate AGENTS guidance.

## Example: Public API Change

If `createSession(input)` now requires `tenantId`, update all of:

- JSDoc in source:
  - Add `@param tenantId` details and update example.
- `README.md`:
  - Update usage snippets and migration notes.
- `AGENTS.md`:
  - Add any new contributor rule or workflow impact.

## Review Checklist

- Public exports have complete and accurate JSDoc.
- README usage examples compile logically against current API.
- AGENTS guidance reflects current internal patterns.
- Architecture docs cover any new subsystem or integration.
- No contradictory statements remain across docs.

## References

- https://jsdoc.app/
- https://effect.website/docs/
- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
