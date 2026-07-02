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
    ]);
    expect(listCurriculumRegions("FR")).toEqual([]);
  });
});
