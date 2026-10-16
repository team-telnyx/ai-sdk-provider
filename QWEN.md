# Repository guidance

- Follow `.llm-repo-instructions` and its central handbook source.
- Use Node.js 22 or newer and the committed npm lockfile.
- Run `npm test`, `npm run lint`, and `npm run build` after changes.
  `lint` type-checks production source; tests run with Vitest.
- Keep `TELNYX_API_KEY` unset for offline tests. Integration tests skip
  without it; do not treat those skips as live-service validation.
- Test provider transport through injected `fetch` with synthetic keys
  and local responses, not paid API requests or a global fetch override.
- Preserve ESM imports and existing two-space TypeScript formatting.
- Name branches `<Linear issue ID>-<description>`. Use conventional commit
  titles including the issue ID. Do not hand-edit release changelog entries
  or bump the package version; release automation handles them.
