import { describe, expect, it } from "vitest";
import {
  CURRICULUM_PROVIDERS,
  getCurriculumProvider,
  listCurriculumCountries,
  listCurriculumRegions,
} from "../../src/cli/curriculum/index.js";

describe("curriculum provider registry", () => {
  it("registers the LehrplanPLUS Bayern provider (ADR 2026-07-02)", () => {
    const ids = CURRICULUM_PROVIDERS.map((p) => p.id);
    expect(ids).toContain("lehrplanplus-bayern");
  });

  it("registers the Kernlehrplan NRW provider (biggest Bundesland)", () => {
    const ids = CURRICULUM_PROVIDERS.map((p) => p.id);
    expect(ids).toContain("kernlehrplan-nrw");
  });

  it("registers the Kerncurriculum Hessen provider", () => {
    const ids = CURRICULUM_PROVIDERS.map((p) => p.id);
    expect(ids).toContain("kerncurriculum-hessen");
  });

  it("registers the Kerncurriculum Niedersachsen provider", () => {
    const ids = CURRICULUM_PROVIDERS.map((p) => p.id);
    expect(ids).toContain("kerncurriculum-niedersachsen");
  });

  it("registers the Lehrplan Sachsen provider", () => {
    const ids = CURRICULUM_PROVIDERS.map((p) => p.id);
    expect(ids).toContain("lehrplan-sachsen");
  });

  it("registers the Rahmenlehrplan Berlin-Brandenburg provider", () => {
    const ids = CURRICULUM_PROVIDERS.map((p) => p.id);
    expect(ids).toContain("rahmenlehrplan-berlin-brandenburg");
  });

  it("registers the Bildungsplan Hamburg provider", () => {
    const ids = CURRICULUM_PROVIDERS.map((p) => p.id);
    expect(ids).toContain("bildungsplan-hamburg");
  });

  it("registers the Lehrpläne RP provider", () => {
    const ids = CURRICULUM_PROVIDERS.map((p) => p.id);
    expect(ids).toContain("lehrplaene-rp");
  });

  it("registers the Bildungsplan Bremen provider", () => {
    const ids = CURRICULUM_PROVIDERS.map((p) => p.id);
    expect(ids).toContain("bildungsplan-bremen");
  });

  it("registers the Rahmenplan MV provider", () => {
    const ids = CURRICULUM_PROVIDERS.map((p) => p.id);
    expect(ids).toContain("rahmenplan-mv");
  });

  it("registers the Lehrplan Saarland provider", () => {
    const ids = CURRICULUM_PROVIDERS.map((p) => p.id);
    expect(ids).toContain("lehrplan-saarland");
  });

  it("registers the Rahmenrichtlinien ST provider", () => {
    const ids = CURRICULUM_PROVIDERS.map((p) => p.id);
    expect(ids).toContain("rahmenrichtlinien-st");
  });

  it("registers the Fachanforderungen SH provider", () => {
    const ids = CURRICULUM_PROVIDERS.map((p) => p.id);
    expect(ids).toContain("fachanforderungen-sh");
  });

  it("registers the Lehrplan Thüringen provider", () => {
    const ids = CURRICULUM_PROVIDERS.map((p) => p.id);
    expect(ids).toContain("lehrplan-thueringen");
  });

  it("resolves a provider by id", () => {
    expect(getCurriculumProvider("lehrplanplus-bayern")?.label).toBe(
      "LehrplanPLUS (Bayern)",
    );
    expect(getCurriculumProvider("nope")).toBeUndefined();
  });

  it("lists distinct countries across registered providers (wizard step 1)", () => {
    const countries = listCurriculumCountries();
    expect(countries).toEqual([{ id: "DE", label: "Deutschland" }]);
  });

  it("lists regions within a country, naming the serving provider (wizard step 2)", () => {
    expect(listCurriculumRegions("DE")).toEqual([
      { id: "BY", label: "Bayern", providerId: "lehrplanplus-bayern" },
      { id: "BW", label: "Baden-Württemberg", providerId: "bildungsplan-bw" },
      { id: "NW", label: "Nordrhein-Westfalen", providerId: "kernlehrplan-nrw" },
      { id: "HE", label: "Hessen", providerId: "kerncurriculum-hessen" },
      { id: "NI", label: "Niedersachsen", providerId: "kerncurriculum-niedersachsen" },
      { id: "SN", label: "Sachsen", providerId: "lehrplan-sachsen" },
      { id: "BE-BB", label: "Berlin / Brandenburg", providerId: "rahmenlehrplan-berlin-brandenburg" },
      { id: "HH", label: "Hamburg", providerId: "bildungsplan-hamburg" },
      { id: "HB", label: "Bremen", providerId: "bildungsplan-bremen" },
      { id: "MV", label: "Mecklenburg-Vorpommern", providerId: "rahmenplan-mv" },
      { id: "RP", label: "Rheinland-Pfalz", providerId: "lehrplaene-rp" },
      { id: "SL", label: "Saarland", providerId: "lehrplan-saarland" },
      { id: "ST", label: "Sachsen-Anhalt", providerId: "rahmenrichtlinien-st" },
      { id: "SH", label: "Schleswig-Holstein", providerId: "fachanforderungen-sh" },
      { id: "TH", label: "Thüringen", providerId: "lehrplan-thueringen" },
    ]);
    expect(listCurriculumRegions("FR")).toEqual([]);
  });
});
