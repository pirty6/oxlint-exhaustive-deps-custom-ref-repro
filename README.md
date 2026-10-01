# oxlint `react-hooks/exhaustive-deps` misses `.current` method-calls on custom-hook refs

**Rule:** `react-hooks/exhaustive-deps` (native, `react` plugin / `react-hooks` namespace)
**Version:** oxlint 1.80.0

## Summary

When a ref is produced by a **custom hook** (not `React.useRef` directly) and its `.current`
is used as a **method call** inside an effect body — e.g. `ref.current?.doThing(x)` — oxlint
does **not** flag `[ref.current, x]` in the deps array. `eslint-plugin-react-hooks` does.

Plain reads (`ref.current ?? 0`) and assignments (`ref.current = x`) on the same custom-ref
value **are** correctly flagged by oxlint. Only the method-call pattern slips through.

## Setup

```bash
npm install
```

## Reproduce

```bash
npm run oxlint   # flags WithUseRef, CustomRef_PlainRead, CustomRef_Assignment. MISSES CustomRef_MethodCall.
npm run eslint   # flags all four cases.
```

## Cases

| Component                 | Access pattern on `.current`       | oxlint 1.80.0 | eslint-plugin-react-hooks 7.1.1 |
|---------------------------|------------------------------------|:-------------:|:-------------------------------:|
| `WithUseRef`              | method call via `React.useRef`     | ✓ flags       | ✓ flags                          |
| `CustomRef_PlainRead`     | plain read `ref.current ?? 0`      | ✓ flags       | ✓ flags                          |
| `CustomRef_MethodCall`    | method call `ref.current?.m(x)`    | **✗ MISSES**  | ✓ flags                          |
| `CustomRef_Assignment`    | assignment `ref.current = x`       | ✓ flags       | ✓ flags                          |

## Why this is a bug (not just the `useRef`-only stability heuristic)

Oxlint's `is_stable_value` only treats `useRef` and `useEffectEvent` as stable — that narrow
list is intentional and matches `eslint-plugin-react-hooks`. **That is not what causes this
miss.** The miss is in the visitor, not the stability check:

In `visit_static_member_expression` (`crates/oxc_linter/src/rules/react/exhaustive_deps.rs`),
when the parent is a `CallExpression` (i.e. we're visiting `ref.current.method` as a callee),
the visitor inserts only the full chain `ref.current.method` into `found_dependencies` and
recurses into `ref.current` with `skip_reporting_dependency = true`. The special `property.name
== "current"` branch — which normally also inserts the base identifier `ref` as a found dep —
is never reached, because `property.name` on the outer visit is `"method"`, not `"current"`.

Net result:
- `found_dependencies` for `ref.current?.m(x)` contains `ref.current.m` and `ref.current`, but **not** `ref`.
- `declared_dependencies` contains `ref.current`.
- `undeclared = found - declared` → empty. No diagnostic.

For `ref.current` as a plain read or on the LHS of an assignment the outer visit sees
`property.name == "current"` and inserts `ref` as a found dep. For `useRef`-produced refs the
"unnecessary outer scope dependency" path fires on the declared dep via the stability check.
Only the custom-ref + method-call combination falls through both paths.

## Expected

Oxlint flags `CustomRef_MethodCall` with the same diagnostic ESLint emits:
> React Hook React.useLayoutEffect has a missing dependency: 'ref'. Either include it or
> remove the dependency array. Mutable values like 'ref.current' aren't valid dependencies
> because mutating them doesn't re-render the component.

## Environment

- oxlint: 1.80.0
- eslint: 10.11.0
- eslint-plugin-react-hooks: 7.1.1
- Node 22+
- macOS 26 (arm64)
