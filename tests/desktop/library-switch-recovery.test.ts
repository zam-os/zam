import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { setCurrentLocale } from "../../desktop/src/i18n.js";
import { classifyServerDbError } from "../../desktop/src/server-db.js";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

/**
 * Recovery paths of the library switch a colleague without a terminal
 * depends on (review round of 2026-09-19): the way out of the team library
 * stays on the card after the disclosure, switching decides on what is
 * configured rather than on what is painted (a vault-locked Turso is still
 * a Turso), and Entra failures point at the card's own sign-in.
 */
describe("library switch recovery", () => {
  const html = read("desktop/index.html");
  const card = read("desktop/src/server-db.ts");

  it("keeps a leave action on the card while the team library is active", () => {
    const start = html.indexOf('id="settings-server-db-card"');
    const end = html.indexOf("</article>", start);
    expect(html.slice(start, end)).toContain('id="btn-team-db-leave"');
    expect(card).toMatch(/leaveButton\.hidden = !onTeam/);
    expect(card).toMatch(
      /leaveButton\.addEventListener\("click", \(\) => void leave\(\)\)/,
    );
  });

  it("decides --replace on the configured library, not on the painted state", () => {
    expect(card).toMatch(/const replace = configured === "turso";/);
    expect(card).toMatch(/const replace = configured === "postgres";/);
    // The bitwarden-locked branch still learns what is configured.
    expect(card).toMatch(/status\.bitwardenRequired[\s\S]*?configured =/);
  });

  it("does not paint an unprovisioned or unopenable team library as local", () => {
    expect(card).toMatch(/status\.provisioned === false/);
    expect(card).toMatch(/team_db_not_provisioned/);
    expect(card).toMatch(
      /if \(!status\.success\)[\s\S]*?classifyServerDbError/,
    );
  });

  it("reports a failed verification after leaving, like after restoring", () => {
    expect(card).toMatch(/const reportSwitch[\s\S]*?library_verify_failed/);
    expect(card).toMatch(/const leave = async[\s\S]*?reportSwitch\(result\)/);
    expect(card).toMatch(/const restore = async[\s\S]*?reportSwitch\(result\)/);
  });

  it("sends Entra failures to the card's sign-in, and a missing CLI to the installer", () => {
    setCurrentLocale("en");
    expect(
      classifyServerDbError(
        "ENTRA_LOGIN_REQUIRED: The Azure CLI (az) was not found. Install it (https://aka.ms/installazurecli), then run `az login` and try again.",
      ),
    ).toMatch(/installazurecli/);
    expect(
      classifyServerDbError(
        "ENTRA_LOGIN_REQUIRED: Run `az login` and try again.",
      ),
    ).toMatch(/Sign in with Microsoft/);
    setCurrentLocale("de");
    try {
      expect(
        classifyServerDbError(
          "ENTRA_LOGIN_REQUIRED: Run `az login` and try again.",
        ),
      ).toMatch(/Mit Microsoft anmelden/);
    } finally {
      setCurrentLocale("en");
    }
  });
});
