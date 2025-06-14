# LogMaster 贡献指南

感谢您考虑为 LogMaster 项目做出贡献！以下是参与贡献的指南，请仔细阅读。

## 目录

- [LogMaster 贡献指南](#logmaster-贡献指南)
  - [目录](#目录)
  - [行为准则](#行为准则)
  - [如何贡献](#如何贡献)
    - [报告Bug](#报告bug)
    - [提出新功能](#提出新功能)
    - [提交Pull Request](#提交pull-request)
  - [开发流程](#开发流程)
    - [开发环境设置](#开发环境设置)
    - [构建和测试](#构建和测试)
  - [代码规范](#代码规范)
  - [提交规范](#提交规范)
  - [文档](#文档)
  - [社区](#社区)

## 行为准则

本项目采用 [Contributor Covenant](https://www.contributor-covenant.org/) 行为准则。参与本项目即表示您同意遵守其条款。

## 如何贡献

### 报告Bug

如果您发现了Bug，请通过GitHub Issues报告，并确保：

1. 检查现有问题，避免重复报告
2. 使用Bug报告模板
3. 提供详细的复现步骤
4. 包括版本信息和环境详情

### 提出新功能

如果您想提出新功能或改进建议：

1. 检查现有问题和讨论，避免重复
2. 使用功能请求模板
3. 清晰描述功能及其解决的问题
4. 如果可能，提供使用场景和示例

### 提交Pull Request

1. Fork项目仓库
2. 创建您的特性分支：`git checkout -b feature/amazing-feature`
3. 提交您的更改：`git commit -m 'feat: 添加一些特性'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交Pull Request

请确保您的PR：

- 遵循[提交规范](docs/提交规范.md)
- 包含适当的测试
- 更新相关文档
- 通过所有CI检查

## 开发流程

### 开发环境设置

1. 克隆仓库

   ```bash
   git clone https://github.com/username/logmaster.git
   cd logmaster
   ```

2. 安装依赖

   ```bash
   npm install
   ```

3. 设置开发环境

   ```bash
   npm run build:dev
   ```

### 构建和测试

- **构建项目**：`npm run build`
- **运行测试**：`npm test`
- **代码风格检查**：`npm run lint`
- **格式化代码**：`npm run format`

## 代码规范

请参阅[代码规范](docs/代码规范.md)文档，了解代码风格、命名约定和最佳实践。

## 提交规范

请参阅[提交规范](docs/提交规范.md)文档，了解Git提交消息格式和分支管理策略。

## 文档

- 更新API文档：`npm run docs`
- 文档位于`docs/`目录
- 确保示例代码正确且最新

## 社区

- 提问和讨论：GitHub Discussions
- 报告问题：GitHub Issues
- 贡献代码：Pull Requests

---

再次感谢您的贡献！
