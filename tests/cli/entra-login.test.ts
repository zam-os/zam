import { describe, expect, it } from "vitest";
import {
  EntraLoginRequiredError,
  type ExecFn,
  entraCliLogin,
} from "../../src/cli/db/entra-cli.js";

/**
 * "Sign in with Microsoft" in the Studio (pilot plan phase 7) runs `az login`
 * for the learner and reports who is signed in afterwards. Nothing here
 * spawns a process; the exec function is injected.
 */
describe("entraCliLogin", () => {
  it("runs az login for accounts without a subscription and returns the lower-cased UPN", async () => {
    const calls: string[][] = [];
    const exec: ExecFn = async (file, args) => {
      calls.push([file, ...args]);
      return args[0] === "login"
        ? { code: 0, stdout: "", stderr: "" }
        : { code: 0, stdout: "Jane.Doe@Example.org\n", stderr: "" };
    };
    await expect(entraCliLogin(exec)).resolves.toBe("jane.doe@example.org");
    expect(calls[0]).toEqual([
      "az",
      "login",
      "--allow-no-subscriptions",
      "--output",
      "none",
    ]);
    expect(calls[1]?.slice(0, 4)).toEqual([
      "az",
      "ad",
      "signed-in-user",
      "show",
    ]);
  });

  it("reports a cancelled or failed browser sign-in as a retryable Entra error", async () => {
    const exec: ExecFn = async () => ({
      code: 1,
      stdout: "",
      stderr: "ERROR: User cancelled the Accounts Control Operation.",
    });
    const error = await entraCliLogin(exec).catch((e) => e);
    expect(error).toBeInstanceOf(EntraLoginRequiredError);
    expect((error as EntraLoginRequiredError).failure).toBe("az-error");
    expect((error as Error).message).toMatch(/did not complete/);
    expect((error as Error).message).toMatch(/User cancelled/);
  });

  it("tells a machine without the Azure CLI to install it", async () => {
    const exec: ExecFn = async () => ({
      code: null,
      stdout: "",
      stderr: "",
      spawnError: Object.assign(new Error("spawn az ENOENT"), {
        code: "ENOENT",
      }),
    });
    const error = await entraCliLogin(exec).catch((e) => e);
    expect((error as EntraLoginRequiredError).failure).toBe("az-missing");
  });
});
