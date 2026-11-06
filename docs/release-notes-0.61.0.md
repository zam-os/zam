# ZAM 0.61.0: Grade 4 as a preview, and a review a child can read

Mathematik, Deutsch and HSU for grade 4 of the Bavarian Grundschule now ship
with ZAM as a clearly labelled preview, together with six more Academy
subjects for grade 8. A review session also speaks plainer: it names the topic
instead of a technical name, and it says how many cards a session really holds.

## A review a child can read

- **The topic instead of a technical name.** A card now starts with its topic
  from the curriculum, such as `Natur und Umwelt — …`, instead of
  `hsu › natur-und-umwelt — …`. Your own cards without a curriculum topic look
  as before.
- **A clearer answer in Studio.** The answer now reads `Antwort` and `Thema`.
  The row with the card's technical token and a stray `title:` label are gone.
  The technical name stays in the card editor.
- **Numbers you can trust.** `354 Karten sind fällig` right after taking up a
  course was wrong, because nobody had seen those cards. Today, the badge and
  the session counter now show what a session will serve, for example
  `10 neue Karten warten`, and a card you have not seen yet is called new.
  Mobile now serves every card it counts: it used to promise 10 and could end
  after 5.
- **A limit that says what it is.** The limit for new cards holds per session,
  so the stop screen now says `Das war's für diese Sitzung`. A later session on
  the same day brings the next new cards, and no longer ends empty when many
  cards were already presented that day.
- **No page loads behind your back.** Studio used to load the Academy page for
  every card without a click and show its frame text under `Musterlösung`.
  ZAM now reads a card's Academy page only when you open it with
  **Lektion öffnen**.

## The ZAM Academy: grade 4 preview

These three cells are a **preview**: no primary-school teacher has reviewed
them yet, and teacher videos are still open. ZAM says so wherever it offers
them, with the label `Vorschau · noch nicht von einer Lehrkraft geprüft`, in
Studio and on Mobile. They appear under **4. Klasse** in the school view of the
knowledge atlas. Nothing replaces an earlier cell.

- **Mathematik 4 Grundschule.**
  [academy.zam-os.org/mathematik-grundschule-4](https://academy.zam-os.org/mathematik-grundschule-4/)
  brings 40 lessons and 159 cards.
- **Deutsch 4 Grundschule.**
  [academy.zam-os.org/deutsch-grundschule-4](https://academy.zam-os.org/deutsch-grundschule-4/)
  brings 45 lessons and 135 cards.
- **HSU 4 Grundschule.**
  [academy.zam-os.org/hsu-grundschule-4](https://academy.zam-os.org/hsu-grundschule-4/)
  brings 20 lessons and 61 cards, and gets its own subject with six areas in
  the knowledge atlas.

## The ZAM Academy: six more subjects for grade 8

- **Chemie 8 Realschule.**
  [academy.zam-os.org/chemie-realschule-8](https://academy.zam-os.org/chemie-realschule-8/)
  brings 32 lessons and 66 cards for Wahlpflichtfächergruppe I. It replaces two
  school cells: eight cards move with their review histories to approved
  successors, and eight multi-part questions leave active reviews and keep their
  history.
- **Informatik 8 Realschule.**
  [academy.zam-os.org/informatik-realschule-8](https://academy.zam-os.org/informatik-realschule-8/)
  brings 40 lessons and 87 cards for the IT-Anfangsunterricht in grades 6, 7
  and 8. It replaces three school cells: eleven cards move with their histories
  and thirteen leave active reviews and keep their history.
- **Englisch 8 Realschule.**
  [academy.zam-os.org/englisch-realschule-8](https://academy.zam-os.org/englisch-realschule-8/)
  brings 51 lessons and 102 cards for every group. It replaces one school cell:
  one card moves with its history, and the other three stay active.
- **Deutsch 8 Realschule.**
  [academy.zam-os.org/deutsch-realschule-8](https://academy.zam-os.org/deutsch-realschule-8/)
  brings 40 lessons and 80 cards for every group. The four earlier cards stay
  active until a mapping is decided.
- **Geschichte 8 Realschule.**
  [academy.zam-os.org/geschichte-realschule-8](https://academy.zam-os.org/geschichte-realschule-8/)
  brings 38 lessons, three of them optional English lessons, and 76 cards for
  every group. The eight earlier cards stay active.
- **Französisch 8 Realschule.**
  [academy.zam-os.org/franzoesisch-realschule-8](https://academy.zam-os.org/franzoesisch-realschule-8/)
  brings 42 lessons and 84 cards for Wahlpflichtfächergruppe IIIa. The four
  earlier cards stay active.

## Taking up the new content

Open **Aus der ZAM Academy** in Studio or Mobile and choose **Aufnehmen** for
the cell you want to learn. Installing the app update makes the bundled content
available; taking up a cell creates your cards and applies its approved mapping.
Repeating the action creates no duplicate cards or review histories.

History moves only through explicit, reviewed successor declarations. The
twenty transfers in this release follow the approved mappings from the Academy.
Twenty-one earlier cards leave active reviews without transferring mastery. ZAM
keeps their review evidence and never infers a match from similar wording.

## Also new

- **The lesson after a missed card.** After you rate a card from an Academy
  lesson as forgotten, Studio, Mobile and the recall panel offer a short step
  before the next card: **In Academy üben** opens the lesson on that click only,
  **Weiter** goes on. Voice mode skips it.
- **Web links on iPhone and iPad.** Mobile now opens web links through the
  system, so they work on iOS too.
- **Progress while taking up a cell.** Importing or updating an Academy cell
  shows a progress bar right away on Desktop, Android and iOS.

## For agents

- **PDFs in material import.** Claude Code and OpenCode now read PDFs
  themselves. Codex takes no PDFs for now, because its CLI does not pass them to
  the model. Material now goes only to agents that can run it isolated.
- **Knowledge articles keep their navigation.** Writing an article no longer
  flattens curated index entries, nested lists, code examples or existing log
  formats.
- **Review tools stay off the network for Academy links.** `zam_get_reviews` and
  the other review paths no longer read the Academy page behind a card.

## Worth knowing

- **No schema change.**
- **38 Academy cells are now bundled.** Six earlier school cells leave the
  bundle: Chemie 8 (two), Informatik 6, 7 and 8, and Englisch 8.
- **Sessions on Mobile at the card limit.** When due reviews reach your card
  limit, Mobile now fills the session with reviews, as Studio does. It used to
  keep room for new cards.
- **Reviews before new cards.** When a due review and a new card share a
  learning atom, the review now keeps the place for that day.
- **Some HSU 4 cards come due again.** Twenty wrong answer options changed in
  2026.11.5, and the changed cards come due on purpose. A Fliehkraft card joins.
- **The school view of the atlas moved some content.** A binding without school
  type or grade no longer counts as a school place, which moves content of 13
  existing cells.
- **New wording is English and German only.** Other languages fall back to
  English for the new strings.
- **Design notes:** ADR 2026-10-19 (ZAM Academy cells), ADR 2026-08-14
  Decisions 9–10 (explicit successors, cells before generic import).
