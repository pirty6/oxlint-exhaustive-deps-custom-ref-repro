import * as React from 'react';

// Custom hook returning a `.current`-shaped object. Mirrors the real-world
// `useReadinessAwareRef` pattern — a plain object with a settable `current`
// getter/setter wrapped in `React.useMemo`.
function useCustomRef<T>(): { current: T | null } {
  return React.useMemo(() => {
    let current: T | null = null;
    return {
      get current(): T | null {
        return current;
      },
      set current(value: T | null) {
        current = value;
      },
    };
  }, []);
}

// =======================================================================
// Baseline: React.useRef — oxlint flags this (via its stable-value path).
// =======================================================================
export const WithUseRef = ({ x }: { x: number }) => {
  const ref = React.useRef<{ setValue: (v: number) => void } | null>(null);
  React.useLayoutEffect(() => {
    ref.current?.setValue(x);
  }, [ref.current, x]);
  // oxlint: react-hooks(exhaustive-deps) — "unnecessary dependency: ref"
  // eslint: react-hooks/exhaustive-deps — "unnecessary dependency: 'ref.current'"
  return null;
};

// =======================================================================
// Custom-ref hook, three access patterns through `.current`.
// Oxlint handles two of them, misses one. ESLint handles all three.
// =======================================================================

// Case A: plain read of ref.current — ✓ oxlint flags, ✓ eslint flags
export const CustomRef_PlainRead = ({ x }: { x: number }) => {
  const ref = useCustomRef<number>();
  React.useLayoutEffect(() => {
    const value = ref.current ?? 0;
    console.log(value + x);
  }, [ref.current, x]);
  return null;
};

// Case B: method call via ref.current — ✗ oxlint MISSES, ✓ eslint flags
// This is the real-world pattern from the host repo:
//   commandingRef.current?.setChatFullScreen({ ... })
export const CustomRef_MethodCall = ({ x }: { x: number }) => {
  const ref = useCustomRef<{ setValue: (v: number) => void }>();
  React.useLayoutEffect(() => {
    ref.current?.setValue(x);
  }, [ref.current, x]);
  return null;
};

// Case C: assignment to ref.current — ✓ oxlint flags, ✓ eslint flags
export const CustomRef_Assignment = ({ x }: { x: number }) => {
  const ref = useCustomRef<number>();
  React.useLayoutEffect(() => {
    ref.current = x;
  }, [ref.current, x]);
  return null;
};
