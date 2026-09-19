import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { setCurrentLocale, t } from "../../desktop/src/i18n.js";
import { describeLibraryStatus } from "../../desktop/src/server-db.js";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

/**
 * Pilot plan phase 7: one machine, one library, and the switch in both
 * directions lives in the Studio's server-database card (ADR 2026-09-04
 * Decision 9). The wiring is what a learner without a terminal depends on,
 * so it is pinned here: the markup, the bridge commands the card drives, the
 * confirmation before a switch, and the disclosure with its two answers.
 */
describe("library switch wiring", () => {
  const html = read("desktop/index.html");
  const card = read("desktop/src/server-db.ts");
  const main = read("desktop/src/main.ts");
  const bridge = read("src/cli/commands/bridge.ts");

  it("keeps the team-library form, the disclosure and the switch-back inside the server-database card", () => {
    const start = html.indexOf('id="settings-server-db-card"');
    const end = html.indexOf("</article>", start);
    const inCard = html.slice(start, end);
    for (const id of [
      "server-db-turso-section",
      "team-db-section",
      "team-db-host",
      "team-db-database",
      "btn-team-db-signin",
      "btn-team-db-connect",
      "team-db-status",
      "team-db-notice",
      "team-db-disclosure",
      "btn-team-db-understood",
      "btn-team-db-learn-locally",
      "library-switch-back",
      "btn-library-restore",
    ]) {
      expect(inCard, id).toContain(`id="${id}"`);
    }
  });

  it("drives the switch through the bridge commands that retire the serve host", () => {
    for (const cmd of [
      "team-db-connect",
      "entra-login",
      "library-restore",
      "team-db-disconnect",
      "server-db-connect",
    ]) {
      expect(card).toContain(`"${cmd}"`);
      expect(bridge).toContain(`.command("${cmd}")`);
    }
    // Both directions replace the other library only after the learner
    // confirmed, and always keep it as the previous library.
    expect(card).toMatch(
      /library_switch_confirm_team[\s\S]*?"team-db-connect"[\s\S]*?"--replace"/,
    );
    expect(card).toMatch(
      /library_switch_confirm_turso[\s\S]*?"server-db-connect"[\s\S]*?"--replace"/,
    );
    expect(card).toMatch(/library_restore_confirm[\s\S]*?"library-restore"/);
  });

  it("shows the disclosure once with Understood / Learn locally instead, and keeps the text", () => {
    expect(card).toMatch(/team_db_understood/);
    expect(card).toMatch(/team_db_learn_locally[\s\S]*?"team-db-disconnect"/);
    expect(card).toContain("zam.teamLibraryDisclosure.");
    setCurrentLocale("de");
    try {
      expect(t("team_db_disclosure")).toMatch(/Organisation betreibt/);
    } finally {
      setCurrentLocale("en");
    }
    // The wording is the parent ADR's (2026-07-04 Decision 6), verbatim.
    expect(t("team_db_disclosure")).toBe(
      "Your learning progress is stored in a database operated by your organisation. Other learners cannot see it. Database administrators technically can.",
    );
  });

  it("translates every new label in every pack and the status header knows the team library", () => {
    const keys = [
      "server_db_turso_title",
      "server_db_err_library_configured",
      "team_db_title",
      "team_db_help",
      "team_db_host",
      "team_db_database",
      "team_db_signin",
      "team_db_signing_in",
      "team_db_signed_in",
      "team_db_connect",
      "team_db_connecting",
      "team_db_active",
      "team_db_not_member",
      "team_db_not_provisioned",
      "team_db_fields_required",
      "team_db_disclosure",
      "team_db_understood",
      "team_db_learn_locally",
      "library_switch_confirm_team",
      "library_switch_confirm_turso",
      "library_restore_btn",
      "library_restore_confirm",
      "library_restoring",
      "library_switched",
      "library_verify_failed",
      "library_kind_turso",
      "library_kind_postgres",
      "database_status_team",
    ];
    // Seven locales, seven definitions per key — en/de live in the base table,
    // the other five in TRANSLATION_PACKS; a source count covers both.
    const i18n = read("desktop/src/i18n.ts");
    for (const key of keys) {
      const definitions = i18n.match(new RegExp(`^\\s+${key}:`, "gm")) ?? [];
      expect(definitions.length, key).toBe(7);
    }
    expect(main).toMatch(
      /result\.target\.kind === "postgres"[\s\S]*?database_status_team/,
    );
    for (const key of [
      "team_db_title",
      "team_db_signin",
      "team_db_disclosure",
    ]) {
      expect(main).toContain(`t("${key}")`);
    }
  });

  it("describes the team library state in the words a colleague acts on", () => {
    setCurrentLocale("en");
    try {
      const base = {
        success: true,
        target: {
          kind: "postgres",
          location: "postgres://team.example.org:5432/zam_test",
        },
        connected: true,
        provisioned: true,
        userId: "01JALICE0000000000000000",
        role: "alice@example.org",
        member: true,
        previous: null,
      };
      expect(describeLibraryStatus(base)).toContain("alice@example.org");
      expect(describeLibraryStatus(base)).toContain("01JALICE0000000000000000");
      expect(
        describeLibraryStatus({ ...base, userId: null, member: false }),
      ).toContain("zam team add-member alice@example.org");
      expect(
        describeLibraryStatus({ ...base, provisioned: false, member: false }),
      ).toContain("zam team provision --database zam_test");
    } finally {
      setCurrentLocale("en");
    }
  });
});
