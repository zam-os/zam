# ZAM 0.45.1 — Topic names from Azure DevOps

A patch release for team libraries whose knowledge lives in an Azure DevOps
repository. Nothing here changes the schema; installs update in place.

## Library topics

- **Every topic gets its own name.** A topic is named after the file its
  cards cite. An Azure DevOps file link carries that file in its `path`
  parameter (`…/_git/Team.Docs?path=/docs/okf/pester-basics.md`), and ZAM
  read the repository name instead, so every topic from such a knowledge
  base was called the same thing — "Team" in this example. **Library
  Topics** now shows "Pester basics" and so on. Only the name changes:
  topics you already started stay started.
