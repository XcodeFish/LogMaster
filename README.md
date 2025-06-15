# LogMaster

[![npm版本](https://img.shields.io/npm/v/logmaster.svg)](https://www.npmjs.com/package/logmaster)
[![下载量](https://img.shields.io/npm/dm/logmaster.svg)](https://www.npmjs.com/package/logmaster)
[![测试覆盖率](https://img.shields.io/codecov/c/github/XcodeFish/logmaster)](https://codecov.io/gh/XcodeFish/logmaster)
[![许可证](https://img.shields.io/npm/l/logmaster.svg)](https://github.com/XcodeFish/logmaster/blob/main/LICENSE)

## 简介

LogMaster 是一个美观实用的日志管理工具，专为解决开发中日志过多导致代码杂乱以及控制台输出不美观的问题而设计。它提供彩色格式化输出、环境感知控制和多级日志系统，让你的开发调试体验更加舒适高效。

### 核心特点

- **零依赖** - 纯原生JS实现，体积小于2KB (gzip后)
- **美观输出** - 彩色图标、高亮显示、结构化排版
- **环境感知** - 自动根据环境调整日志级别和输出详细程度
- **简洁API** - 直观易用的接口设计
- **高性能** - 异步日志处理，不阻塞主线程
- **可扩展** - 支持自定义传输系统（通过插件）

## 安装

```bash
# 使用npm
npm install log-assistant

# 使用yarn
yarn add log-assistant

# 使用pnpm
pnpm add log-assistant
```

或直接在浏览器中引入：

```html
<script src="https://cdn.jsdelivr.net/npm/log-assistant@1.0.0/dist/logmaster.min.js"></script>
```

## 快速开始

### 基础用法

```javascript
import logger from 'log-assistant';

// 设置环境（可选，默认读取NODE_ENV）
logger.setEnvironment('development');

// 输出不同级别的日志
logger.debug('调试信息', { userId: 123 });
logger.info('应用已启动');
logger.warn('注意：磁盘空间不足');
logger.error('操作失败', new Error('网络连接中断'));
```

### 控制台效果预览

![LogMaster控制台效果](https://i.imgur.com/JKGRl8m.png)
*（实际效果：彩色图标、层级缩进、位置追踪）*

## 主要功能

### 1. 环境感知输出

LogMaster 能够根据不同的运行环境自动调整日志输出行为：

```javascript
// 开发环境：显示所有日志
logger.setEnvironment('development');

// 测试环境：仅显示INFO及以上级别
logger.setEnvironment('testing');

// 生产环境：仅显示ERROR级别，自动隐藏敏感信息
logger.setEnvironment('production');
```

| 环境          | 日志级别阈值 | 输出内容                     |
|---------------|--------------|------------------------------|
| 开发环境      | DEBUG        | 显示所有日志（含DEBUG）      |
| 测试环境      | INFO         | 显示INFO/WARN/ERROR          |
| 生产环境      | ERROR        | 仅显示ERROR，静默敏感信息    |

### 2. 多级日志系统

提供四种日志级别，每种级别有独特的颜色和图标：

```javascript
logger.debug('详细调试信息');  // 🔹 蓝色
logger.info('常规信息');      // ℹ️ 绿色
logger.warn('警告信息');      // ⚠️ 黄色
logger.error('错误信息');     // ❌ 红色
```

### 3. 日志分组与表格

```javascript
// 日志分组
logger.group('用户认证流程', () => {
  logger.info('验证凭据格式');
  logger.debug('请求数据', { XcodeFish: 'admin' });
  logger.info('认证成功');
});

// 表格输出
logger.table([
  { id: 1, name: '项目A', status: '完成' },
  { id: 2, name: '项目B', status: '进行中' }
]);
```

### 4. 主题自定义

```javascript
logger.setTheme({
  timestamp: '#aaaaaa',
  debug: '#0066cc',
  info: '#00aa00',
  warn: '#ffaa00',
  error: '#ff3300'
});
```

## 高级配置

### 完整配置选项

```javascript
// 示例：应用完整配置
const logger = new LogMaster({
  environment: 'development',    // 运行环境
  logLevel: 'DEBUG',             // 日志级别阈值
  theme: {
    badge: '#f0f0f0',            // 徽章背景颜色
    timestamp: '#888888',        // 时间戳文本颜色
    debug: '#0066cc',            // DEBUG级别颜色
    info: '#00aa00',             // INFO级别颜色
    warn: '#ffaa00',             // WARN级别颜色
    error: '#ff3300'             // ERROR级别颜色
  },
  stackTraceEnabled: true,       // 是否显示堆栈跟踪
  maxArrayLength: 100,           // 对象/数组打印时的最大长度
  useColors: true                // 是否启用彩色输出
});
```

| 配置项            | 类型    | 默认值        | 描述                              |
|-------------------|---------|---------------|-----------------------------------|
| environment       | string  | 'development' | 运行环境 (development/testing/production) |
| logLevel          | string  | 'DEBUG'       | 日志级别阈值                      |
| theme.badge       | string  | '#f0f0f0'     | 徽章背景颜色                      |
| theme.timestamp   | string  | '#888888'     | 时间戳文本颜色                    |
| theme.debug       | string  | '#0066cc'     | DEBUG级别颜色                     |
| theme.info        | string  | '#00aa00'     | INFO级别颜色                      |
| theme.warn        | string  | '#ffaa00'     | WARN级别颜色                      |
| theme.error       | string  | '#ff3300'     | ERROR级别颜色                     |
| stackTraceEnabled | boolean | true          | 是否显示堆栈跟踪                  |
| maxArrayLength    | number  | 100           | 对象/数组打印时的最大长度         |
| useColors         | boolean | true          | 是否启用彩色输出                  |

## API文档

### 核心方法

#### 日志输出

```javascript
logger.debug(message, ...optionalParams);  // 调试级别日志
logger.info(message, ...optionalParams);   // 信息级别日志
logger.warn(message, ...optionalParams);   // 警告级别日志
logger.error(message, ...optionalParams);  // 错误级别日志
logger.prodError(message, ...optionalParams); // 生产环境强制记录错误
```

#### 配置方法

```javascript
// 设置环境
logger.setEnvironment(env); // env: 'development' | 'testing' | 'production'

// 设置日志级别
logger.setLogLevel(level); // level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SILENT'

// 设置主题
logger.setTheme(themeObject);
```

#### 高级功能

```javascript
// 分组日志
logger.group(label, callback);

// 表格输出
logger.table(data, columns);
```

## 实际应用场景示例

### 用户认证流程跟踪

```javascript
import logger from 'logmaster';

async function authenticateUser(credentials) {
  logger.debug('开始用户认证', { XcodeFish: credentials.XcodeFish });

  try {
    logger.group('认证流程', async () => {
      logger.info('验证凭据格式');
      // 验证凭据

      logger.info('发送认证请求');
      const response = await apiClient.authenticate(credentials);

      logger.debug('认证响应', { userId: response.userId, role: response.role });

      if (response.warnings.length) {
        logger.warn('认证成功但有警告', { warnings: response.warnings });
      } else {
        logger.info('认证成功完成', { userId: response.userId });
      }
    });
    return true;
  } catch (error) {
    logger.error('认证失败', error);
    return false;
  }
}
```

### 性能监控

```javascript
import logger from 'logmaster';

function measurePerformance(operationName, operation) {
  const startTime = performance.now();

  try {
    const result = operation();
    const duration = performance.now() - startTime;

    if (duration > 1000) {
      logger.warn(`${operationName} 操作耗时过长`, { duration: `${duration}ms` });
    } else {
      logger.debug(`${operationName} 操作完成`, { duration: `${duration}ms` });
    }

    return result;
  } catch (error) {
    logger.error(`${operationName} 操作失败`, { error: error.message });
    throw error;
  }
}
```

## 兼容性

LogMaster 兼容各种现代JavaScript环境：

| 环境          | 支持情况    | 最低版本要求 |
|---------------|-------------|-------------|
| 现代浏览器    | ✅ 完全支持 | Chrome 58+, Firefox 54+, Safari 10+, Edge 79+ |
| Node.js       | ✅ 完全支持 | Node.js 12+ |
| React Native  | ✅ 完全支持 | 0.60+      |
| IE            | ⚠️ 部分支持 | IE11 (需要使用兼容模式) |

## 与其他日志工具对比

| 特性             | LogMaster | console | winston | log4js |
|------------------|:---------:|:-------:|:-------:|:------:|
| 体积             | 2KB       | 0KB     | 12KB+   | 10KB+  |
| 无依赖           | ✅        | ✅      | ❌      | ❌     |
| 彩色输出         | ✅        | ❌/✅   | ✅      | ✅     |
| 生产环境优化     | ✅        | ❌      | ✅      | ✅     |
| 自定义主题       | ✅        | ❌      | ❌/✅   | ❌/✅  |
| 日志分组         | ✅        | ✅      | ❌      | ❌     |
| 表格日志         | ✅        | ✅      | ❌      | ❌     |
| 环境自适应       | ✅        | ❌      | ✅      | ✅     |
| 浏览器兼容性     | 很好      | 很好    | 一般    | 一般   |
| 自定义传输方式   | ✅(扩展版)| ❌      | ✅      | ✅     |

## 扩展功能：传输系统

LogMaster 提供可扩展的传输系统，可将日志输出到不同目标。传输系统已集成在核心包中，无需安装额外的包：

### 使用传输系统

```javascript
import LogMaster from 'logmaster';

// 从核心包中使用传输类
const { FileTransport, HTTPTransport } = LogMaster.transports;

// 添加文件传输
logger.addTransport(new FileTransport({
  filename: './logs/app.log',
  rotation: {
    maxSize: '10m',      // 单个文件最大10MB
    maxFiles: 5,         // 最多保留5个文件
    compress: true       // 压缩旧日志
  },
  format: 'json'         // 以JSON格式存储
}));

// 添加HTTP传输
logger.addTransport(new HTTPTransport({
  url: 'https://logging.example.com/collect',
  method: 'POST',
  headers: { 'X-API-Key': 'your-api-key' },
  batchSize: 10,         // 每10条日志发送一次
  retries: 3             // 失败重试3次
}));

// 正常使用日志功能
logger.info('用户已登录', { userId: 123 });
```

### 可用传输类型

LogMaster 核心包中包含以下传输类型：

| 传输类型    | 类名          | 说明                                 |
|------------|--------------|-------------------------------------|
| 文件系统    | FileTransport | 支持日志轮转、压缩、格式化            |
| HTTP/HTTPS | HTTPTransport | 支持批处理、重试、自定义头            |
| 自定义传输  | BaseTransport | 可继承此类创建自定义传输实现         |

## 常见问题 (FAQ)

### Q: 如何在生产环境中完全禁用日志?

**A:** 设置环境为生产环境并将日志级别设为SILENT:

```javascript
logger.setEnvironment('production');
logger.setLogLevel('SILENT');
```

### Q: 如何将日志输出到文件?

**A:** 推荐使用传输系统：

```javascript
import LogMaster from 'logmaster';
const { FileTransport } = LogMaster.transports;

logger.addTransport(new FileTransport({
  filename: './logs/app.log'
}));
```

或结合 Node.js 的 fs 模块:

```javascript
import fs from 'fs';

// 创建自定义日志转发
const originalError = logger.error;
logger.error = (...args) => {
  // 同时写入文件
  fs.appendFileSync('error.log', `[${new Date().toISOString()}] ${args.join(' ')}\n`);
  // 保留原有控制台输出
  originalError.apply(logger, args);
};
```

### Q: 在生产环境中如何记录详细错误但不在控制台显示?

**A:** 可以覆盖 error 方法:

```javascript
const originalError = logger.error;
logger.error = (...args) => {
  // 发送到错误跟踪服务
  errorTrackingService.captureException(...args);

  if (logger._environment === 'production') {
    // 生产环境下不在控制台显示详情
    console.error('应用发生错误 - 详情已记录');
  } else {
    // 开发环境正常显示
    originalError.apply(logger, args);
  }
};
```

## 贡献指南

我们欢迎各种形式的贡献，包括功能请求、错误报告和代码贡献。

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

### 开发指南

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 构建生产版本
npm run build
```

### 问题反馈

有任何问题或建议，请[提交 issue](https://github.com/XcodeFish/logmaster/issues/new/choose)。请提供：

1. 问题描述
2. 复现步骤
3. 期望行为
4. 环境信息 (浏览器/Node.js版本等)

## 许可证

本项目使用 [MIT 许可证](https://github.com/XcodeFish/logmaster/blob/master/LICENSE)。

---

LogMaster 帮助开发者在保持代码整洁的同时，快速定位问题，提升调试效率，是现代前端开发的必备工具。

[版本更新日志](https://github.com/XcodeFish/logmaster/blob/master/CHANGELOG.md) | [贡献指南](https://github.com/XcodeFish/logmaster/blob/master/CONTRIBUTING.md) | [行为准则](https://github.com/XcodeFish/logmaster/blob/master/CODE_OF_CONDUCT.md)
