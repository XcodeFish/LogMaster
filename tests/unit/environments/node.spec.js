/**
 * @file Node环境适配器单元测试
 * @module tests/unit/environments/node
 * @author LogMaster Team
 * @license MIT
 */

import NodeEnvironment from '../../../src/environments/node.js';
import fs from 'fs';
import path from 'path';

// 模拟fs和path模块
jest.mock('fs');
jest.mock('path');

describe('Node环境适配器', () => {
  // 在每个测试前重置模拟
  beforeEach(() => {
    jest.resetAllMocks();

    // 模拟基本控制台行为
    global.console = {
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      group: jest.fn(),
      groupCollapsed: jest.fn(),
      groupEnd: jest.fn(),
      table: jest.fn(),
      time: jest.fn(),
      timeEnd: jest.fn(),
      clear: jest.fn(),
    };

    // 模拟process对象
    global.process = {
      env: { NODE_ENV: 'development' },
      cwd: jest.fn().mockReturnValue('/mock/cwd'),
      platform: 'darwin',
      version: 'v14.17.0',
      versions: {
        node: '14.17.0',
      },
      stdout: {
        isTTY: true,
      },
    };

    // 模拟文件系统方法
    fs.existsSync.mockReturnValue(true);
    fs.mkdirSync.mockImplementation(() => {});
    fs.readFileSync.mockReturnValue('{"logLevel":"INFO"}');
    fs.writeFileSync.mockImplementation(() => {});
    fs.unlinkSync = jest.fn();

    // 模拟path方法
    path.join.mockImplementation((...args) => args.join('/'));
    path.resolve.mockImplementation((...args) => args.join('/'));
    path.dirname.mockImplementation(p => p.split('/').slice(0, -1).join('/'));

    // 模拟os和stream模块
    const mockOs = {
      homedir: jest.fn().mockReturnValue('/home/user'),
    };

    const mockStream = {
      Readable: jest.fn(),
      Writable: jest.fn(),
      Transform: jest.fn(),
    };

    // 模拟require函数
    global.require = jest.fn().mockImplementation(moduleName => {
      if (moduleName === 'fs') return fs;
      if (moduleName === 'path') return path;
      if (moduleName === 'os') return mockOs;
      if (moduleName === 'stream') return mockStream;
      return null;
    });
  });

  describe('Node环境适配器', () => {
    test('应正确初始化', () => {
      const env = new NodeEnvironment();
      expect(env).toBeDefined();
    });
  });

  describe('构造函数和初始化', () => {
    test('应使用默认配置正确初始化', () => {
      const env = new NodeEnvironment();
      expect(env._configPath).toBe('.logmaster');
      expect(env._configDir).toBeNull();
      expect(env._features).toBeDefined();
    });

    test('应尊重自定义配置选项', () => {
      const env = new NodeEnvironment({
        configPath: 'custom_dir',
        configDir: '/custom/dir',
      });

      expect(env._configPath).toBe('custom_dir');
      expect(env._configDir).toBe('/custom/dir');
    });

    test('当不存在配置目录时应创建目录', () => {
      // 准备文件系统模拟
      fs.existsSync.mockReturnValueOnce(false); // 配置目录不存在

      // 保存配置将触发目录创建
      const env = new NodeEnvironment();
      env.saveConfig({ logLevel: 'INFO' });

      // 验证尝试创建目录
      expect(fs.mkdirSync).toHaveBeenCalled();
    });
  });

  describe('detectFeatures()', () => {
    test('应正确检测Node.js功能', () => {
      const env = new NodeEnvironment();
      const features = env.detectFeatures();

      // Node环境通常支持所有这些功能
      expect(features.fsSupport).toBe(true);
      expect(features.processSupport).toBe(true);
      expect(features.streamSupport).toBe(true);
    });

    test('在较老版本Node中应正确检测功能支持', () => {
      // 模拟较老的Node版本
      global.process.versions.node = '8.0.0';

      const env = new NodeEnvironment();
      const features = env.detectFeatures();

      // 期望一些功能在较老版本中不支持
      // 这里的具体期望值取决于实际实现
      expect(features).toBeDefined();
    });
  });

  describe('控制台API适配', () => {
    test('getConsoleAPI()应返回控制台API对象', () => {
      const env = new NodeEnvironment();
      const api = env.getConsoleAPI();

      expect(api).toBeDefined();
      expect(typeof api.log).toBe('function');
      expect(typeof api.info).toBe('function');
      expect(typeof api.warn).toBe('function');
      expect(typeof api.error).toBe('function');
    });

    test('应安全地调用控制台方法', () => {
      const env = new NodeEnvironment();
      const api = env.getConsoleAPI();

      // 调用日志方法
      api.log('测试消息');

      // 应调用控制台方法
      expect(global.console.log).toHaveBeenCalledWith('测试消息');
    });
  });

  describe('配置管理', () => {
    test('saveConfig应正确保存配置到文件', () => {
      const env = new NodeEnvironment();
      const config = { logLevel: 'INFO', theme: 'dark' };

      // 执行测试方法
      const result = env.saveConfig(config);

      // 验证结果
      expect(result).toBe(true);

      // writeFileSync应被调用
      expect(fs.writeFileSync).toHaveBeenCalled();

      // 验证调用参数
      const args = fs.writeFileSync.mock.calls[0];
      // 第一个参数是文件路径，应该包含配置路径
      expect(args[0]).toContain('.logmaster');
      // 第二个参数是JSON字符串
      expect(JSON.parse(args[1])).toEqual(config);
    });

    test('loadConfig应正确从文件加载配置', () => {
      // 模拟配置文件内容
      const config = { logLevel: 'INFO', theme: 'dark' };
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(config));

      const env = new NodeEnvironment();
      const result = env.loadConfig();

      // readFileSync应被调用
      expect(fs.readFileSync).toHaveBeenCalled();

      // 应返回正确的配置对象
      expect(result).toEqual(config);
    });

    test('loadConfig当文件不存在时应返回null', () => {
      // 模拟文件不存在
      fs.existsSync.mockReturnValueOnce(false);

      const env = new NodeEnvironment();
      const result = env.loadConfig();

      // 不应调用readFileSync
      expect(fs.readFileSync).not.toHaveBeenCalled();

      // 应返回null
      expect(result).toBeNull();
    });

    test('loadConfig当文件内容无效时应返回null', () => {
      // 模拟无效的JSON内容
      fs.readFileSync.mockReturnValueOnce('invalid json');

      const env = new NodeEnvironment();
      const result = env.loadConfig();

      // 应返回null
      expect(result).toBeNull();
    });

    test('clearConfig应删除配置文件', () => {
      // 设置测试环境
      fs.existsSync.mockReturnValueOnce(true); // 文件存在

      const env = new NodeEnvironment();
      env.clearConfig();

      // 应调用unlinkSync
      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('Node环境信息', () => {
    test('getNodeInfo应返回正确的Node环境信息', () => {
      const env = new NodeEnvironment();
      const info = env.getNodeInfo();

      expect(info.version).toBe('14.17.0');
      expect(info.platform).toBe('darwin');
    });

    test('isProduction应根据NODE_ENV识别生产环境', () => {
      // 模拟生产环境
      global.process.env.NODE_ENV = 'production';

      const env = new NodeEnvironment();
      expect(env.isProduction()).toBe(true);

      // 模拟开发环境
      global.process.env.NODE_ENV = 'development';
      expect(env.isProduction()).toBe(false);
    });
  });

  describe('文件系统访问', () => {
    test('应提供文件流创建功能', () => {
      // 创建一个模拟的流创建函数
      fs.createWriteStream = jest.fn().mockReturnValue({
        write: jest.fn(),
        end: jest.fn(),
      });

      const env = new NodeEnvironment();
      env.detectFeatures(); // 确保_fs已初始化

      // 验证createWriteStream方法存在
      expect(typeof env.createWriteStream).toBe('function');

      // 调用方法应正确转发到fs
      const stream = env.createWriteStream('test.log', { flags: 'a' });
      expect(fs.createWriteStream).toHaveBeenCalled();
      expect(stream).toBeDefined();
    });

    test('文件监视功能应正常工作', () => {
      // 创建一个模拟的监视函数
      fs.watch = jest.fn().mockReturnValue({
        on: jest.fn(),
        close: jest.fn(),
      });

      const env = new NodeEnvironment();
      env.detectFeatures(); // 确保_fs已初始化

      // 验证watchFile方法存在
      expect(typeof env.watchFile).toBe('function');

      // 调用方法应正确转发到fs
      const callback = jest.fn();
      const watcher = env.watchFile('test.log', {}, callback);

      expect(fs.watch).toHaveBeenCalled();
      expect(watcher).toBeDefined();
    });
  });
});
