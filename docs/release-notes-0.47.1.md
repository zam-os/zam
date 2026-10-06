# ZAM 0.47.1 — Models learn what they can do

A patch release for the photo and PDF import in 0.47.0. ZAM keeps a note of
what each connected model can do, such as read text, look at images or read
PDFs. That note was only made when a model was set up, or when you pressed
**Re-check** in Settings. So a model set up before 0.47.0 counted as "cannot
read PDFs", and a model whose provider added image input later still counted
as text-only. Nothing here changes the schema; installs update in place.

## Model capabilities

- **PDFs work with the model you already have.** After the update, the Studio
  looks again at cloud models whose note is out of date. A model like
  GPT-6 Luna, which reads PDFs itself, then shows **Files (PDF)** in Settings,
  and **Photo / PDF** can send it a handout.
- **The right model reads your photos.** A cloud model that turns out to read
  images is switched on for images. Photos then go to the first model in your
  list that reads them, as the dialog says.
- **Not on every start.** On start the Studio only compares dates; that needs
  no network. It asks the provider only when a model was never checked, was
  checked before ZAM knew a newer capability, or was last checked more than
  30 days ago. The question runs in the background, so the Studio stays
  responsive.
- **Local models are left alone.** Models on your own machine are never
  checked automatically, because starting them is expensive. **Re-check** in
  Settings still works for them.
- **Only adds, never takes away.** The check reads the provider's model list
  and calls no model. It switches on what the provider now lists for that
  model and keeps every switch you set yourself.

## Worth knowing

- No schema change; nothing to migrate.
- On the phone, a model connected there still does not learn about PDFs by
  itself. If your phone shares its library with the desktop, the desktop's
  check covers it.
- Updating from 0.47.0: the desktop app through the in-app updater, the CLI
  with `npm install -g zam-core@0.47.1`, the VS Code companion from the
  attached VSIX, the mobile companion from the attached APK.
