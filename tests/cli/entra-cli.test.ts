import { describe, expect, it } from "vitest";
import {
  EntraLoginRequiredError,
  type ExecFn,
  type ExecResult,
  entraCliAccessToken,
  entraCliSignedInUpn,
  isEntraLoginRequired,
} from "../../src/cli/db/entra-cli.js";

/**
 * ADR 2026-09-04 Decision 3: the Azure CLI is the token source, and its three
 * failure shapes — no `az`, not logged in, an unexpected error — all become
 * one typed `ENTRA_LOGIN_REQUIRED` with a message the learner can act on.
 * Nothing here spawns a process; the exec function is injected.
 */
function fakeExec(result: Partial<ExecResult>): ExecFn {
  return async () => ({
    code: 0,
    stdout: "",
    stderr: "",
    ...result,
  });
}

describe("Azure CLI token source", () => {
  it("returns the trimmed access token", async () => {
    const exec = fakeExec({ stdout: "eyJ.token.value\r\n" });
    await expect(entraCliAccessToken(exec)).resolves.toBe("eyJ.token.value");
  });

  it("asks for the right resource and reads the token as tsv", async () => {
    const calls: string[][] = [];
    const exec: ExecFn = async (file, args) => {
      calls.push([file, ...args]);
      return { code: 0, stdout: "tok", stderr: "" };
    };
    await entraCliAccessToken(exec);
    expect(calls[0]).toEqual([
      "az",
      "account",
      "get-access-token",
      "--resource-type",
      "oss-rdbms",
      "--query",
      "accessToken",
      "-o",
      "tsv",
    ]);
  });

  it("names a missing Azure CLI", async () => {
    const enoent = Object.assign(new Error("spawn az ENOENT"), {
      code: "ENOENT",
    }) as NodeJS.ErrnoException;
    const exec = fakeExec({ code: null, spawnError: enoent });
    const error = await entraCliAccessToken(exec).catch((e) => e);
    expect(error).toBeInstanceOf(EntraLoginRequiredError);
    expect((error as EntraLoginRequiredError).failure).toBe("az-missing");
    expect((error as Error).message).toMatch(/ENTRA_LOGIN_REQUIRED/);
    expect((error as Error).message).toMatch(/not found/i);
  });

  it("recognises the shell's own 'not recognized' message on Windows", async () => {
    const exec = fakeExec({
      code: 1,
      stderr:
        "'az' is not recognized as an internal or external command,\r\noperable program or batch file.",
    });
    const error = await entraCliAccessToken(exec).catch((e) => e);
    expect((error as EntraLoginRequiredError).failure).toBe("az-missing");
  });

  it("tells a signed-out learner to run az login", async () => {
    const exec = fakeExec({
      code: 1,
      stderr:
        "ERROR: Please run 'az login' to setup account.\nAADSTS700082: The refresh token has expired",
    });
    const error = await entraCliAccessToken(exec).catch((e) => e);
    expect((error as EntraLoginRequiredError).failure).toBe("not-logged-in");
    expect((error as Error).message).toMatch(/az login/);
  });

  it("keeps the last stderr line of an unexpected failure", async () => {
    const exec = fakeExec({
      code: 1,
      stderr: "WARNING: something\nERROR: The subscription is disabled.",
    });
    const error = await entraCliAccessToken(exec).catch((e) => e);
    expect((error as EntraLoginRequiredError).failure).toBe("az-error");
    expect((error as Error).message).toMatch(/subscription is disabled/);
  });

  it("rejects an empty token", async () => {
    const error = await entraCliAccessToken(fakeExec({ stdout: "\n" })).catch(
      (e) => e,
    );
    expect((error as EntraLoginRequiredError).failure).toBe("no-token");
  });

  it("reads the signed-in principal name for the setup wizard", async () => {
    // Lower-cased: `zam team add-member` creates Entra principals in lower
    // case, and PostgreSQL role names are case-sensitive.
    const exec = fakeExec({ stdout: "Learner@Example.org\n" });
    await expect(entraCliSignedInUpn(exec)).resolves.toBe(
      "learner@example.org",
    );
  });

  it("is recognisable from the message alone across module boundaries", () => {
    expect(
      isEntraLoginRequired(new EntraLoginRequiredError("az-error", "x")),
    ).toBe(true);
    expect(
      isEntraLoginRequired(
        new Error("ENTRA_LOGIN_REQUIRED: wrapped elsewhere"),
      ),
    ).toBe(true);
    expect(isEntraLoginRequired(new Error("connection refused"))).toBe(false);
  });
});
