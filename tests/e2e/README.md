# LogMaster E2E 测试

## 简介

本目录包含LogMaster项目的端到端(E2E)测试用例，使用 [Playwright](https://playwright.dev/) 框架实现。这些测试用例模拟用户在实际浏览器环境中使用LogMaster库的情况，确保库在不同浏览器和设备上的行为一致性。

## 测试内容

目前的E2E测试涵盖以下方面：

1. **浏览器兼容性测试** - 测试在不同浏览器下的功能降级
2. **日志过滤功能测试** - 验证日志级别过滤是否正确工作
3. **主题切换功能测试** - 验证主题设置与保持
4. **用户行为场景测试** - 模拟真实用户使用场景
5. **响应式行为测试** - 测试在不同设备尺寸下的表现

## 测试环境

测试运行在以下浏览器环境：

- Chromium
- Firefox
- WebKit (Safari)
- Edge
- 移动浏览器（包括iPhone和Android设备模拟）

## 前提条件

运行测试前，请确保：

1. 已安装Node.js (v12+)
2. 已安装项目依赖 `npm install` 或 `pnpm install`
3. 已构建项目 `npm run build`

## 运行测试

### 运行所有E2E测试

```bash
npm run test:e2e
```

### 运行特定测试文件

```bash
npx playwright test tests/e2e/log-filtering.test.js
```

### 在特定浏览器中运行测试

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
npx playwright test --project=edge
```

### 运行测试并查看浏览器界面

```bash
npx playwright test --headed
```

### 运行测试并在失败时调试

```bash
npx playwright test --debug
```

## 测试报告

测试报告自动生成在 `playwright-report` 目录下。运行完测试后，可以通过以下命令查看HTML报告：

```bash
npx playwright show-report
```

## 测试结构

- `pages/` - 包含页面对象模型
  - `LogMasterPage.js` - LogMaster测试页面的交互封装
  - `compatibility-test.html` - 测试页面
- `*.test.js` - 测试用例文件

## 扩展测试

### 添加新的测试页面

1. 在 `pages/` 目录下创建HTML测试页面
2. 确保页面引用了LogMaster库
3. 添加必要的测试元素和data-testid属性

### 添加新的测试用例

1. 在E2E目录下创建新的测试文件，如 `new-feature.test.js`
2. 导入需要的模块和页面对象
3. 编写测试用例，确保遵循AAA(Arrange-Act-Assert)模式
4. 运行新测试确认功能正常

### 最佳实践

- 使用页面对象模型封装页面交互
- 每个测试应关注单一功能点
- 避免测试之间的依赖
- 在测试前清理环境（如清空日志）
- 测试应尽量模拟真实用户场景

## 常见问题

### 测试在本地通过但在CI中失败

- 检查是否有时序问题，可能需要增加等待或重试逻辑
- 检查浏览器兼容性问题，某些功能在特定浏览器可能不支持

### 测试执行缓慢

- 减少不必要的浏览器交互
- 在适当情况下使用`page.evaluate()`直接执行JavaScript
- 考虑并行执行测试

### 测试中的断言失败

- 检查选择器是否正确
- 确认测试页面加载完成
- 检查日志捕获机制是否正常工作

## 贡献

欢迎对测试套件进行改进，请遵循项目的贡献指南提交PR。
