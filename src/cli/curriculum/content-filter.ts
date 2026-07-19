/**
 * Content-aware view over a curriculum provider.
 *
 * Manifests mirror the official curriculum sites' full subject catalogs, but
 * many school-type × grade × subject combinations have no importable topics
 * (e.g. FOS Informatik only exists for grades 12/13, and most non-Bavarian
 * manifests are still sparse seeds). Offering such a dead end in the import
 * wizard wastes the learner's walk — there is nothing to import at the end.
 *
 * `withImportableContentOnly` wraps a provider so every listed option can
 * reach at least one topic through the provider's own public API: subjects
 * with neither direct topics nor a topic-bearing track disappear, and grades
 * or school types whose options all disappear are hidden too. It only uses
 * the `CurriculumProvider` contract, so it works for every registered
 * provider regardless of manifest shape.
 */
import type { CurriculumProvider, TaxonomyNode } from "./types.js";

function trackHasTopics(
  provider: CurriculumProvider,
  schoolType: string,
  grade: string,
  subject: string,
  track: string,
): boolean {
  return provider.listTopics({ schoolType, grade, subject, track }).length > 0;
}

function subjectHasContent(
  provider: CurriculumProvider,
  schoolType: string,
  grade: string,
  subject: string,
): boolean {
  const tracks = provider.listTracks(schoolType, grade, subject);
  if (tracks.length === 0) {
    return provider.listTopics({ schoolType, grade, subject }).length > 0;
  }
  return tracks.some((track) =>
    trackHasTopics(provider, schoolType, grade, subject, track.id),
  );
}

function gradeHasContent(
  provider: CurriculumProvider,
  schoolType: string,
  grade: string,
): boolean {
  return provider
    .listSubjects(schoolType, grade)
    .some((subject) =>
      subjectHasContent(provider, schoolType, grade, subject.id),
    );
}

export function withImportableContentOnly(
  provider: CurriculumProvider,
): CurriculumProvider {
  return {
    ...provider,

    listSchoolTypes(): TaxonomyNode[] {
      return provider
        .listSchoolTypes()
        .filter((schoolType) =>
          provider
            .listGrades(schoolType.id)
            .some((grade) =>
              gradeHasContent(provider, schoolType.id, grade.id),
            ),
        );
    },

    listGrades(schoolType: string): TaxonomyNode[] {
      return provider
        .listGrades(schoolType)
        .filter((grade) => gradeHasContent(provider, schoolType, grade.id));
    },

    listSubjects(schoolType: string, grade: string): TaxonomyNode[] {
      return provider
        .listSubjects(schoolType, grade)
        .filter((subject) =>
          subjectHasContent(provider, schoolType, grade, subject.id),
        );
    },

    listTracks(
      schoolType: string,
      grade: string,
      subject: string,
    ): TaxonomyNode[] {
      return provider
        .listTracks(schoolType, grade, subject)
        .filter((track) =>
          trackHasTopics(provider, schoolType, grade, subject, track.id),
        );
    },
  };
}
