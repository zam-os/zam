# ZAM 0.47.0 — Learning cards from photos and PDFs

Take a photo of your class notes, or pick a handout as a PDF, and ZAM turns
it into learning cards. A model reads the pages and proposes cards, and you
decide each card in one list. You can keep a card, leave it out, or keep it
as a Bonus for later. ZAM never stores the photo or the PDF.

## Learning cards from photos and PDFs

- **Up to ten photos or one PDF.** In the Studio, open **Learning Content**
  and choose **Photo / PDF**, or drop the files onto the window. Photos of one
  lesson go together; a PDF goes whole, and you can name the pages to use.
  Use one subject per import.
- **With your AI assistant.** If you work with opencode, Claude, Codex,
  Copilot or another connected assistant, the dialog gives you a ready
  request to paste. The assistant reads your notes and asks you about
  anything it cannot read. Its proposals then come back to the Studio, where
  the list opens by itself. This is often the smarter way.
- **Or read it here.** **Analyze** sends the files to the model you have
  connected for images, and the dialog names that model. If it does not
  answer, ZAM may use the next model you have connected. The list then says
  which model read your pages. A PDF needs a model that reads PDFs itself;
  otherwise, export the pages as photos.
- **One list, one choice per card.** Every proposed card has **Yes**, **No**
  and **Bonus**. A card stated on the page starts on Yes. A related extra
  starts on Bonus. A card the model completed or could hardly read waits
  for your choice. A card without a choice is not saved, and the button says
  how many: "Add 7 · 2 as Bonus · 3 not saved".
- **What you already have.** If your library already holds a matching card,
  it stands beside the proposal as **Already there**, so you can keep the
  card you have or take the new wording. At the end, **Leads on to** lists up
  to three topics the material leads to.
- **Areas stay tidy.** The proposed area is shown above its cards and can be
  changed without reading the pages again. School subjects are now areas of
  their own: `chemie/stoffe`, no longer `schule/chemie/stoffe`.
- **Bonus means offered, never scheduled.** A Bonus card never lands in your
  reviews by itself. **Bonus (n)** in Learning Content lists what you kept.
  After your due reviews, ZAM offers up to two of them. No score, no streak.
- **On your phone, too.** **Photos or PDF** in the library's add view does
  the same on the device: read, review and save, all in one go. It needs an
  internet connection and a model that reads images (or PDFs).
- **Nothing of the material is kept.** ZAM keeps only a link saying where
  each card came from (the file's path, or on the phone its name and date)
  and a fingerprint of each file. Import a file a second time and ZAM tells
  you when you imported it before.

## Worth knowing

- **Two schema changes.** M037 adds the import records. M038 drops the
  `schule/` prefix from stored areas. Both run when 0.47.0 first opens a
  library; no card is re-tested and no review history changes. On a **team
  library**, the owner's client should open it with 0.47.0 before members
  update.
- **Semantic search:** run `zam token reembed` once after updating, so the
  stored embeddings match the renamed areas.
- HEIC photos are converted on macOS. On other systems, export them as JPEG.
- The review list always opens in the Studio; it is not shown inside an AI
  assistant's own window.
- Design note: ADR 2026-10-05; current behaviour in
  `docs/okf/material-import.md`.
- Updating from 0.46.0: the desktop app through the in-app updater, the CLI
  with `npm install -g zam-core@0.47.0`, the VS Code companion from the
  attached VSIX, the mobile companion from the attached APK.
