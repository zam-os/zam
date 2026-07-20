/**
 * Topic-coverage audit for curriculum providers (Epic #132 / Phase 0).
 *
 * Walks every navigable leaf path in a provider's catalog
 * (schoolType × grade × subject [× track]) and checks that
 * `listTopics` returns ≥1 topic with a resolvable source URL.
 *
 * Uses the provider as-is — pass a raw (unfiltered) provider to measure
 * full manifest coverage. The content-filtered registry view is always
 * 100% by construction and is the wrong input for this audit.
 */

import type {
  CurriculumCatalogPath,
  CurriculumProvider,
  CurriculumSelection,
  TopicNode,
} from "./types.js";

export type CurriculumPath = CurriculumCatalogPath;

export type PathCoverageIssue =
  | "no_topics"
  | "resolve_failed"
  | "no_source_url";

export interface PathCoverageResult {
  path: CurriculumPath;
  /** `schoolType|grade|subject[|track]` */
  key: string;
  topicCount: number;
  ok: boolean;
  issue?: PathCoverageIssue;
  detail?: string;
}

export interface ProviderCoverageReport {
  providerId: string;
  region: string;
  regionLabel: string;
  paths: PathCoverageResult[];
  total: number;
  covered: number;
  gaps: number;
  catalogStatus: "seed" | "complete";
  /** Complete taxonomy and at least one verified path. */
  catalogComplete: boolean;
  catalogIssue?: "catalog_seed" | "empty_catalog";
  /** covered / total, or 0 when total is 0 */
  coverageRatio: number;
}

export interface CoverageSummary {
  providers: ProviderCoverageReport[];
  total: number;
  covered: number;
  gaps: number;
  catalogComplete: boolean;
  incompleteCatalogProviders: string[];
  coverageRatio: number;
}

export function pathKey(path: CurriculumPath): string {
  return path.track
    ? `${path.schoolType}|${path.grade}|${path.subject}|${path.track}`
    : `${path.schoolType}|${path.grade}|${path.subject}`;
}

export function selectionFromPath(path: CurriculumPath): CurriculumSelection {
  return {
    schoolType: path.schoolType,
    grade: path.grade,
    subject: path.subject,
    ...(path.track ? { track: path.track } : {}),
  };
}

/** Enumerate every leaf path in the provider catalog (tracks expand; else one path). */
export function collectCatalogPaths(
  provider: CurriculumProvider,
): CurriculumPath[] {
  if (provider.listCatalogPaths) {
    return provider.listCatalogPaths().map((path) => ({ ...path }));
  }

  const paths: CurriculumPath[] = [];
  for (const schoolType of provider.listSchoolTypes()) {
    for (const grade of provider.listGrades(schoolType.id)) {
      for (const subject of provider.listSubjects(schoolType.id, grade.id)) {
        const tracks = provider.listTracks(schoolType.id, grade.id, subject.id);
        if (tracks.length === 0) {
          paths.push({
            schoolType: schoolType.id,
            grade: grade.id,
            subject: subject.id,
          });
        } else {
          for (const track of tracks) {
            paths.push({
              schoolType: schoolType.id,
              grade: grade.id,
              subject: subject.id,
              track: track.id,
            });
          }
        }
      }
    }
  }
  return paths;
}

function firstTopicResolves(
  provider: CurriculumProvider,
  topics: TopicNode[],
): { ok: true } | { ok: false; issue: PathCoverageIssue; detail: string } {
  if (topics.length === 0) {
    return { ok: false, issue: "no_topics", detail: "listTopics returned []" };
  }
  const topic = topics[0];
  try {
    const resolved = provider.resolveTopic(topic);
    if (!resolved.uri || !/^https?:\/\//i.test(resolved.uri)) {
      return {
        ok: false,
        issue: "no_source_url",
        detail: `resolveTopic returned non-http uri for ${topic.id}`,
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      issue: "resolve_failed",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Audit one path: ≥1 topic and first topic resolves to an http(s) URL. */
export function auditPath(
  provider: CurriculumProvider,
  path: CurriculumPath,
): PathCoverageResult {
  const key = pathKey(path);
  const topics = provider.listTopics(selectionFromPath(path));
  const resolve = firstTopicResolves(provider, topics);
  if (!resolve.ok) {
    return {
      path,
      key,
      topicCount: topics.length,
      ok: false,
      issue: resolve.issue,
      detail: resolve.detail,
    };
  }
  return { path, key, topicCount: topics.length, ok: true };
}

export function auditProviderCoverage(
  provider: CurriculumProvider,
): ProviderCoverageReport {
  const pathResults = collectCatalogPaths(provider).map((path) =>
    auditPath(provider, path),
  );
  const covered = pathResults.filter((p) => p.ok).length;
  const total = pathResults.length;
  const catalogIssue =
    total === 0
      ? "empty_catalog"
      : provider.catalogStatus === "complete"
        ? undefined
        : "catalog_seed";
  return {
    providerId: provider.id,
    region: provider.region,
    regionLabel: provider.regionLabel,
    paths: pathResults,
    total,
    covered,
    gaps: total - covered,
    catalogStatus: provider.catalogStatus,
    catalogComplete: catalogIssue === undefined,
    ...(catalogIssue ? { catalogIssue } : {}),
    coverageRatio: total === 0 ? 0 : covered / total,
  };
}

export function auditAllProviders(
  providers: CurriculumProvider[],
): CoverageSummary {
  const reports = providers.map(auditProviderCoverage);
  const total = reports.reduce((sum, r) => sum + r.total, 0);
  const covered = reports.reduce((sum, r) => sum + r.covered, 0);
  const incompleteCatalogProviders = reports
    .filter((report) => !report.catalogComplete)
    .map((report) => report.providerId);
  return {
    providers: reports,
    total,
    covered,
    gaps: total - covered,
    catalogComplete: incompleteCatalogProviders.length === 0,
    incompleteCatalogProviders,
    coverageRatio: total === 0 ? 0 : covered / total,
  };
}

export function gapKeys(report: ProviderCoverageReport): string[] {
  return report.paths.filter((p) => !p.ok).map((p) => p.key);
}

export function formatCoverageHuman(summary: CoverageSummary): string {
  const lines: string[] = [
    "Curriculum topic coverage (raw catalog paths)",
    "=============================================",
  ];
  for (const report of summary.providers) {
    const pct = (report.coverageRatio * 100).toFixed(1);
    const catalog = report.catalogComplete
      ? "catalog=complete"
      : `catalog=${report.catalogIssue}`;
    lines.push(
      `${report.providerId} (${report.regionLabel}): ${report.covered}/${report.total} (${pct}%)  gaps=${report.gaps}  ${catalog}`,
    );
    if (report.gaps > 0 && report.gaps <= 20) {
      for (const key of gapKeys(report)) {
        lines.push(`  - ${key}`);
      }
    } else if (report.gaps > 20) {
      const sample = gapKeys(report).slice(0, 10);
      for (const key of sample) {
        lines.push(`  - ${key}`);
      }
      lines.push(`  … and ${report.gaps - sample.length} more`);
    }
  }
  const pct = (summary.coverageRatio * 100).toFixed(1);
  lines.push("---------------------------------------------");
  lines.push(
    `TOTAL: ${summary.covered}/${summary.total} (${pct}%)  gaps=${summary.gaps}`,
  );
  if (!summary.catalogComplete) {
    lines.push(
      `INCOMPLETE CATALOGS: ${summary.incompleteCatalogProviders.join(", ")}`,
    );
  }
  return lines.join("\n");
}
