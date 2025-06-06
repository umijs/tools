## 0.1.36

`2025-04-21`


## 0.1.35

`2025-04-13`


## 0.1.34

`2025-02-28`

- feat(release): add support for custom changelog directory by [@sorrycc](https://github.com/sorrycc)


## 0.1.33

`2025-02-22`

- fix(release): handle repositories without existing git tags by [@sorrycc](https://github.com/sorrycc)


## 0.1.32

`2025-01-20`

- fix(release): replace hardcoded npm command with configurable publish client by [@sorrycc](https://github.com/sorrycc)


## 0.1.31

`2025-01-20`

- fix(release): skip changelog generation and tagging for non-latest versions by [@sorrycc](https://github.com/sorrycc)
- feat(release): add support for '-canary' version identifier in release command by [@sorrycc](https://github.com/sorrycc)


## 0.1.30

`2025-01-20`

- fix(release): trim owner names in ownership verification for improved accuracy by [@sorrycc](https://github.com/sorrycc)
- fix(release): improve ownership verification logging in checkOwnership function by [@sorrycc](https://github.com/sorrycc)
- feat(release): add --no-check-ownership option to skip ownership verification during release by [@sorrycc](https://github.com/sorrycc)


## 0.1.29

`2025-01-20`

- refactor(release): replace spinner with taskLog for build and doctor commands, enhancing output handling by [@sorrycc](https://github.com/sorrycc)


## 0.1.28

`2025-01-20`

- fix(release): ensure git status check correctly verifies a clean working directory by [@sorrycc](https://github.com/sorrycc)


## 0.1.27

`2025-01-20`

- feat(release): enhance release command to support custom npm client configuration by [@sorrycc](https://github.com/sorrycc)
- fix(release): improve error handling for git status check in release command by [@sorrycc](https://github.com/sorrycc)


## 0.1.26

`2025-01-20`

- refactor: migrate to ES modules and update import paths for consistency by [@sorrycc](https://github.com/sorrycc)


## 0.1.25

`2025-01-20`

- feat(release): add support for custom npm client during publish in README and release command by [@sorrycc](https://github.com/sorrycc)


## 0.1.24

`2025-01-17`

- fix(release): update log filtering and formatting to enhance user references and exclude specific log types by [@sorrycc](https://github.com/sorrycc)


## 0.1.23

`2025-01-17`

- refactor(release): replace spinner with taskLog for improved logging during publish, push, and GitHub release creation by [@sorrycc](https://github.com/sorrycc)


## 0.1.22

`2025-01-17`

- feat(release): integrate @umijs/clack-prompts and picocolors for enhanced user interaction and logging by [@sorrycc](https://github.com/sorrycc)
- fix(release): enhance log filtering in changelog generation to exclude 'ci' and 'test' entries by [@sorrycc](https://github.com/sorrycc)
- fix(release): refine log filtering in changelog generation to exclude 'chore' and 'docs' entries by [@sorrycc](https://github.com/sorrycc)


## 0.1.21

`2025-01-16`

- fix(release): update changelog translation to reference PR numbers correctly by [sorrycc](https://github.com/sorrycc)


## 0.1.20

`2025-01-16`

- fix(release): improve changelog translation by removing unnecessary formatting and clarifying author and PR link presentation by [sorrycc](https://github.com/sorrycc)


## 0.1.19

`2025-01-16`

- fix(release): enhance changelog translation to include author and PR links by [@sorrycc](https://github.com/sorrycc)


## 0.1.18

`2025-01-16`

- feat: add changelog translation support with Google Generative AI by [@sorrycc](https://github.com/sorrycc)


## 0.1.17

`2025-01-16`

- docs(changelog): correct versioning and update changelog entries for 0.1.14 and 0.1.16 by [@sorrycc](https://github.com/sorrycc)
- fix(release): correct changelog order and format header timestamp by [@sorrycc](https://github.com/sorrycc)


## 0.1.16

`(2025-01-16)`

- fix(release): update GitHub release notes link to use the correct version format by [@sorrycc](https://github.com/sorrycc)

## 0.1.15

`(2025-01-16)`

- fix(release): trim whitespace from generated changelog output by [@sorrycc](https://github.com/sorrycc)

## 0.1.14

`(2025-01-16)`

- chore: bump version to 0.1.13 and update release script to include changelog generation by [@sorrycc](https://github.com/sorrycc)
- feat: add changelog generation and testing framework by [@sorrycc](https://github.com/sorrycc)
