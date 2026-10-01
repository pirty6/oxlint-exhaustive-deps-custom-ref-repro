import * as React from 'react';

// Custom hook that returns a ref-shaped object (not React.useRef directly).
// `useReadinessAwareRef` in the host repo uses this exact pattern — a plain object
// with a settable `current` getter/setter wrapped in `React.useMemo`.
function useCustomRef<T>(): { current: T | null } {
  return React.useMemo(() => {
    let current: T | null = null;
    return {
      get current(): T | null {
        return current;
      },
      set current(value: T | null) {
        current = value;
      }
    };
  }, []);
}

export const WithUseRef = ({ x }: { x: number }) => {
  const ref = React.useRef<{ setValue: (v: number) => void } | null>(null);
  React.useLayoutEffect(() => {
    ref.current?.setValue(x);
    // oxlint reports `react-hooks(exhaustive-deps)`: unnecessary dependency `ref`.
  }, [ref.current, x]);
  return null;
};

export const WithCustomRef = ({ x }: { x: number }) => {
  const ref = useCustomRef<{ setValue: (v: number) => void }>();
  React.useLayoutEffect(() => {
    ref.current?.setValue(x);
    // oxlint reports NOTHING — `ref` is produced by a custom hook, so the exhaustive-deps
    // rule does not know its `.current` is a mutable ref value.
  }, [ref.current, x]);
  return null;
};
