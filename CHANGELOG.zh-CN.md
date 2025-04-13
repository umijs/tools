## 0.1.35

`2025-04-13`


## 0.1.34

`2025-02-28`

- feat(release): 添加对自定义 changelog 目录的支持 by [@sorrycc](https://github.com/sorrycc)


## 0.1.33

`2025-02-22`

- fix(release): 处理没有现有 git 标签的存储库 by [@sorrycc](https://github.com/sorrycc)


## 0.1.32

`2025-01-20`

- fix(release): 将硬编码的 npm 命令替换为可配置的发布客户端 by [@sorrycc](https://github.com/sorrycc)


## 0.1.31

`2025-01-20`

- fix(release): 跳过非最新版本的变更日志生成和标签 by [@sorrycc](https://github.com/sorrycc)
- feat(release): 在发布命令中添加对 '-canary' 版本标识符的支持 by [@sorrycc](https://github.com/sorrycc)


## 0.1.30

`2025-01-20`

- fix(release): 修复所有权验证中所有者名称的修剪，以提高准确性 by [@sorrycc](https://github.com/sorrycc)
- fix(release): 改进 checkOwnership 函数中的所有权验证日志 by [@sorrycc](https://github.com/sorrycc)
- feat(release): 添加 --no-check-ownership 选项以在发布期间跳过所有权验证 by [@sorrycc](https://github.com/sorrycc)


## 0.1.29

`2025-01-20`

- refactor(release): 将构建和 doctor 命令的 spinner 替换为 taskLog，增强输出处理能力 by [@sorrycc](https://github.com/sorrycc)


## 0.1.28

`2025-01-20`

- fix(release): 确保 git 状态检查正确地验证了干净的工作目录 by [@sorrycc](https://github.com/sorrycc)


## 0.1.27

`2025-01-20`

- feat(release): 增强发布命令以支持自定义 npm 客户端配置 by [@sorrycc](https://github.com/sorrycc)
- fix(release): 改进发布命令中 git 状态检查的错误处理 by [@sorrycc](https://github.com/sorrycc)


## 0.1.26

`2025-01-20`

- refactor: 迁移到 ES 模块并更新导入路径以保持一致性 by [@sorrycc](https://github.com/sorrycc)


## 0.1.25

`2025-01-20`

- feat(release): 在 README 和 release 命令中添加发布时对自定义 npm 客户端的支持 by [@sorrycc](https://github.com/sorrycc)


## 0.1.24

`2025-01-17`

- fix(release): 更新日志过滤和格式化以增强用户引用并排除特定的日志类型 by [@sorrycc](https://github.com/sorrycc)


## 0.1.23

`2025-01-17`

- refactor(release): 重构(发布)：用 taskLog 替换 spinner，以改进发布、推送和 GitHub 发布创建过程中的日志记录 by [sorrycc](https://github.com/sorrycc)
- release: 发布 0.1.22 by [sorrycc](https://github.com/sorrycc)


## 0.1.22

`2025-01-17`

- feat(release): 集成 [umijs/clack-prompts 和 picocolors，以增强用户交互和日志记录 by @sorrycc](https://github.com/umijs/clack-prompts 和 picocolors for enhanced user interaction and logging by @sorrycc)
- fix(release): 增强变更日志生成中的日志过滤，以排除 'ci' 和 'test' 条目 by [sorrycc](https://github.com/sorrycc)
- fix(release): 改进变更日志生成中的日志过滤，以排除 'chore' 和 'docs' 条目 by [sorrycc](https://github.com/sorrycc)
- release: 0.1.21 by [sorrycc](https://github.com/sorrycc)


## 0.1.21

`2025-01-16`

- fix(release): 更新 changelog 翻译以正确引用 PR 号码 by [sorrycc](https://github.com/sorrycc)


## 0.1.20

`2025-01-16`

- fix(release): 改进更新日志翻译，移除不必要的格式，并理清作者和 PR 链接的呈现方式 by [sorrycc](https://github.com/sorrycc) in [pr](url)


## 0.1.19

`2025-01-16`

- fix(release): 增强 changelog 翻译，包含作者和 PR 链接 by [sorrycc](https://github.com/sorrycc) and in [pr](url)


## 0.1.18

`2025-01-16`

- feat: 由 [sorrycc](https://github.com/sorrycc) 添加使用 Google Generative AI 的 changelog 翻译支持


