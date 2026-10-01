# oxlint `react-hooks/exhaustive-deps` misses `.current` from custom-hook refs

**Rule:** `react-hooks/exhaustive-deps` (native, under the `react-hooks` namespace)
**Version:** oxlint 1.80.0

## Setup

```bash
npm install
```

## Reproduce

```bash
npm run oxlint   # flags only `WithUseRef`; `WithCustomRef` passes silently
npm run eslint   # flags both `WithUseRef` and `WithCustomRef`
```

## What the file contains

- `WithUseRef` — ref produced by `React.useRef(...)`, used in deps as `ref.current`
- `WithCustomRef` — ref produced by a custom hook `useCustomRef()` that returns a plain object with a `current` setter/getter (same shape as `React.useRef`)

Both are the same shape: an object with a mutable `.current` property that should not be in a hook deps array.

## Expected (match eslint-plugin-react-hooks@7.1.1)

Oxlint flags both. The actual message `eslint-plugin-react-hooks` emits is:
> Mutable values like 'ref.current' aren't valid dependencies because mutating them doesn't re-render the component.

## Actual

Oxlint flags only `WithUseRef`. `WithCustomRef` has the same `.current` in its deps array but passes silently.

## Why this matters

The `useRef`-only heuristic misses a very common pattern: wrapping `useRef` behind a custom hook (e.g. `useReadinessAwareRef<T>` that returns a `.current`-shaped object). Teams migrating from `eslint-plugin-react-hooks` to oxlint lose coverage on every custom ref hook in their codebase.

## Environment

- oxlint: 1.80.0
- eslint: 10.11.0
- eslint-plugin-react-hooks: 7.1.1
- Node 22+
- macOS 26 (arm64)
