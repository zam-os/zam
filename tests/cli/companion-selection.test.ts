import { describe, expect, it } from "vitest";
import {
  isPersistableSelection,
  resolveSelection,
  type SelectionCandidates,
} from "../../src/vscode-extension/companion-selection.js";

describe("companion selection precedence", () => {
  it("prefers invocation over manual, persisted, and fallback", () => {
    const candidates: SelectionCandidates<string> = {
      invocation: "test-user-0.6.2",
      manual: "manual-user",
      persisted: "persisted-user",
      fallback: "thomas",
    };
    expect(resolveSelection(candidates)).toEqual({
      value: "test-user-0.6.2",
      source: "invocation",
      sessionScoped: true,
    });
  });

  it("prefers manual over persisted and fallback when no invocation is given", () => {
    expect(
      resolveSelection<string>({
        manual: "manual-user",
        persisted: "persisted-user",
        fallback: "thomas",
      }),
    ).toEqual({ value: "manual-user", source: "manual", sessionScoped: false });
  });

  it("prefers the persisted Companion preference over the legacy fallback", () => {
    expect(
      resolveSelection<string>({
        persisted: "persisted-user",
        fallback: "thomas",
      }),
    ).toEqual({
      value: "persisted-user",
      source: "persisted",
      sessionScoped: false,
    });
  });

  it("falls back to the legacy default when nothing else is supplied", () => {
    expect(resolveSelection<string>({ fallback: "thomas" })).toEqual({
      value: "thomas",
      source: "default",
      sessionScoped: false,
    });
  });

  it("marks only an invocation-sourced result as session-scoped", () => {
    const bySource = (
      candidates: SelectionCandidates<string>,
    ): boolean => resolveSelection(candidates).sessionScoped;

    expect(bySource({ invocation: "a", fallback: "z" })).toBe(true);
    expect(bySource({ manual: "a", fallback: "z" })).toBe(false);
    expect(bySource({ persisted: "a", fallback: "z" })).toBe(false);
    expect(bySource({ fallback: "z" })).toBe(false);
  });

  it("never mutates the candidates it is given", () => {
    const candidates: SelectionCandidates<string> = {
      invocation: "test-user-0.6.2",
      fallback: "thomas",
    };
    const snapshot = { ...candidates };
    resolveSelection(candidates);
    expect(candidates).toEqual(snapshot);
  });

  it("treats only a manual selection as persistable — an explicit invocation must never silently become the new preference", () => {
    expect(
      isPersistableSelection(
        resolveSelection<string>({
          invocation: "test-user-0.6.2",
          persisted: "thomas",
          fallback: "thomas",
        }),
      ),
    ).toBe(false);
    expect(
      isPersistableSelection(
        resolveSelection<string>({ manual: "test-user-0.6.2", fallback: "thomas" }),
      ),
    ).toBe(true);
    expect(
      isPersistableSelection(resolveSelection<string>({ fallback: "thomas" })),
    ).toBe(false);
  });
});
