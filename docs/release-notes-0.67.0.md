# ZAM 0.67.0 Release Notes

ZAM 0.67.0 adds ten Academy courses and fixes Windows secret reads when ZAM starts from PowerShell 7.

## ZAM Academy

| Course | School type | Lessons | Review items |
| --- | --- | ---: | ---: |
| French 6 (first and second foreign language) | Gymnasium | 74 | 222 |
| Informatics 7 (Natur und Technik) | Gymnasium | 12 | 36 |
| Physics 7 (Natur und Technik) | Gymnasium | 21 | 63 |
| Biology 7 | Realschule | 27 | 54 |
| German 7 | Realschule | 50 | 100 |
| English 6 | Mittelschule | 36 | 109 |
| Informatics 6 | Mittelschule | 12 | 36 |
| Politics and Society 6 | Mittelschule | 7 | 14 |
| Nature and Technology 7 (R and M tracks) | Mittelschule | 36 | 108 |
| Politics and Society 7 (R and M tracks) | Mittelschule | 15 | 45 |

The bundle includes 93 Academy courses. When learners take the new cells, eleven matching cards carry their review histories to their Academy successors. The approved mappings cover Biology 7 and German 7 Realschule, French 6 Gymnasium and the Informatics part of Natur und Technik 7 Gymnasium. Other legacy cards keep their IDs and histories, and all existing school cells stay available.

The Academy retired its preview flag, so this release drops it from nine previously bundled courses. The Academy apps show teacher acceptance through their package versions. [Academy package version policy](https://github.com/zam-os/zam-academy/pull/148)

## Windows

ZAM can read Windows-protected credentials when launched from PowerShell 7. It starts the Windows PowerShell 5.1 process used for DPAPI without the inherited module search path. [ZAM #492](https://github.com/zam-os/zam/pull/492)
