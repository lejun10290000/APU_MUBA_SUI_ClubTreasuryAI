"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { ZodType } from "zod";
import { demoSessionChangedEvent } from "@/src/domain/demo-workflow";

export function useDemoSessionValue<T>(
  key: string,
  schema: ZodType<T>,
): T | null {
  const storedValue = useSyncExternalStore(
    subscribeToDemoSession,
    () => window.sessionStorage.getItem(key),
    () => null,
  );

  return useMemo(() => {
    if (!storedValue) {
      return null;
    }

    try {
      const result = schema.safeParse(JSON.parse(storedValue));
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }, [schema, storedValue]);
}

export function writeDemoSessionValue(key: string, value: unknown): void {
  window.sessionStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(demoSessionChangedEvent));
}

export function removeDemoSessionValue(key: string): void {
  window.sessionStorage.removeItem(key);
  window.dispatchEvent(new Event(demoSessionChangedEvent));
}

function subscribeToDemoSession(callback: () => void) {
  window.addEventListener(demoSessionChangedEvent, callback);
  return () => window.removeEventListener(demoSessionChangedEvent, callback);
}
