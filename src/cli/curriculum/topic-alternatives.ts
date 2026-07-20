import type {
  CurriculumProvider,
  CurriculumSelection,
  TopicNode,
} from "./types.js";

export interface CurriculumTopicAlternative {
  providerId: string;
  region: string;
  regionLabel: string;
  topicLabels: string[];
  sourceUris: string[];
}

const STOP_WORDS = new Set([
  "der",
  "die",
  "das",
  "den",
  "dem",
  "des",
  "ein",
  "eine",
  "mit",
  "und",
  "oder",
  "von",
  "zu",
  "zur",
  "zum",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(topic: TopicNode): Set<string> {
  return new Set(
    normalize(`${topic.id} ${topic.label}`)
      .split(/\s+/)
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
  );
}

type MathematicsFamily =
  | "numbers-algebra"
  | "geometry"
  | "functions"
  | "data-probability";

function mathematicsFamilies(topic: TopicNode): Set<MathematicsFamily> {
  const value = normalize(`${topic.id} ${topic.label}`);
  const result = new Set<MathematicsFamily>();
  if (
    /arithmetik|algebra|zahl|rechen|operation|term|gleichung|potenz|prozent/.test(
      value,
    )
  ) {
    result.add("numbers-algebra");
  }
  if (/geometr|raum|form|flaeche|koerper|winkel|dreieck|symmetr/.test(value)) {
    result.add("geometry");
  }
  if (/funktion|zusammenhang|proportional|zuordnung/.test(value)) {
    result.add("functions");
  }
  if (/stochast|daten|zufall|wahrscheinlich|statistik|diagramm/.test(value)) {
    result.add("data-probability");
  }
  return result;
}

function topicsMatch(
  source: TopicNode,
  candidate: TopicNode,
  subject: string,
): boolean {
  if (source.id === candidate.id) return true;
  if (normalize(source.label) === normalize(candidate.label)) return true;

  if (subject === "mathematik") {
    const sourceFamilies = mathematicsFamilies(source);
    const candidateFamilies = mathematicsFamilies(candidate);
    if ([...sourceFamilies].some((family) => candidateFamilies.has(family))) {
      return true;
    }
  }

  const sourceTokens = tokens(source);
  const candidateTokens = tokens(candidate);
  const overlap = [...sourceTokens].filter((token) =>
    candidateTokens.has(token),
  ).length;
  return overlap >= Math.min(2, sourceTokens.size);
}

function schoolTypePriority(
  sourceSchoolType: string | undefined,
  candidateSchoolType: string,
): number {
  if (sourceSchoolType === candidateSchoolType) return 0;
  const normalized = normalize(sourceSchoolType ?? "");
  const isGeneralSecondary =
    /ober|mittel|haupt|real|gesamt|gemeinschaft|sekundar|regional|regel/.test(
      normalized,
    );
  if (isGeneralSecondary && candidateSchoolType === "mittelschule") return 1;
  if (isGeneralSecondary && candidateSchoolType === "realschule") return 2;
  if (candidateSchoolType === "gymnasium") return 3;
  if (/foerder/.test(candidateSchoolType)) return 9;
  return 5;
}

export function findCurriculumTopicAlternatives(
  providers: CurriculumProvider[],
  sourceProviderId: string,
  selection: CurriculumSelection,
  topic: TopicNode,
): CurriculumTopicAlternative[] {
  if (!selection.grade || !selection.subject) return [];

  const alternatives: CurriculumTopicAlternative[] = [];
  for (const provider of providers) {
    if (provider.id === sourceProviderId) continue;

    const matches: Array<{
      label: string;
      uri: string;
      schoolType: string;
    }> = [];
    const paths = provider.listCatalogPaths?.() ?? [];
    for (const path of paths) {
      if (
        path.grade !== selection.grade ||
        path.subject !== selection.subject
      ) {
        continue;
      }
      for (const candidate of provider.listTopics(path)) {
        if (
          candidate.contentStatus !== "verified" ||
          !topicsMatch(topic, candidate, selection.subject)
        ) {
          continue;
        }
        try {
          matches.push({
            label: candidate.label,
            uri: provider.resolveTopic(candidate).uri,
            schoolType: path.schoolType,
          });
        } catch {
          // A broken source is not an alternative.
        }
      }
    }

    matches.sort((a, b) => {
      const priority =
        schoolTypePriority(selection.schoolType, a.schoolType) -
        schoolTypePriority(selection.schoolType, b.schoolType);
      return priority || a.label.localeCompare(b.label, "de");
    });
    const labels = [...new Set(matches.map((match) => match.label))];
    const uris = [...new Set(matches.map((match) => match.uri))];
    if (uris.length > 0) {
      alternatives.push({
        providerId: provider.id,
        region: provider.region,
        regionLabel: provider.regionLabel,
        topicLabels: labels.slice(0, 6),
        sourceUris: uris.slice(0, 6),
      });
    }
  }

  return alternatives.sort((a, b) => {
    if (a.providerId === "lehrplanplus-bayern") return -1;
    if (b.providerId === "lehrplanplus-bayern") return 1;
    return a.regionLabel.localeCompare(b.regionLabel, "de");
  });
}
