/**
 * @file 环境适配器索引单元测试
 * @module tests/unit/environments/index
 * @author LogMaster Team
 * @license MIT
 */

import {
  detectEnvironmentType,
  createEnvironment,
  createEnvironmentAsync,
  ENVIRONMENT_TYPES,
} from '../../../src/environments/index.js';
import BrowserEnvironment from '../../../src/environments/browser.js';
import NodeEnvironment from '../../../src/environments/node.js';

// 保存原始全局对象以在测试后恢复
const originalWindow = global.window;
const originalDocument = global.document;
const originalProcess = global.process;

describe('环境适配器索引模块', () => {
  // 每个测试前设置基本环境
  beforeEach(() => {
    // 确保每次测试前重置全局状态
    global.window = originalWindow;
    global.document = originalDocument;
    global.process = originalProcess;
  });

  // 每个测试后恢复全局对象
  afterEach(() => {
    global.window = originalWindow;
    global.document = originalDocument;
    global.process = originalProcess;
  });

  describe('detectEnvironmentType()', () => {
    test('应正确检测Node.js环境', () => {
      // 模拟Node.js环境
      delete global.window;
      delete global.document;
      global.process = {
        versions: { node: '16.0.0' },
      };

      const result = detectEnvironmentType();
      expect(result).toBe(ENVIRONMENT_TYPES.NODE);
    });

    test('应正确检测浏览器环境', () => {
      // 模拟浏览器环境
      global.window = {};
      global.document = {};
      delete global.process.versions;

      const result = detectEnvironmentType();
      expect(result).toBe(ENVIRONMENT_TYPES.BROWSER);
    });

    test('无法确定环境时应返回未知类型', () => {
      // 模拟难以确定的环境
      delete global.window;
      delete global.document;
      delete global.process.versions;

      const result = detectEnvironmentType();
      expect(result).toBe(ENVIRONMENT_TYPES.UNKNOWN);
    });
  });

  describe('createEnvironment()', () => {
    test('应根据当前环境创建适当的环境适配器', () => {
      // 模拟浏览器环境
      global.window = {};
      global.document = {
        addEventListener: jest.fn(),
      };
      delete global.process.versions;

      const env = createEnvironment();
      expect(env).toBeInstanceOf(BrowserEnvironment);
    });

    test('应尊重forceType选项', () => {
      // 即使在可能是浏览器的环境中，也强制使用Node环境
      global.window = {};
      global.document = {};

      const env = createEnvironment({ forceType: ENVIRONMENT_TYPES.NODE });
      expect(env).toBeInstanceOf(NodeEnvironment);
    });

    test('应在forceType无效时发出警告并使用默认类型', () => {
      // 监视console.warn
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // 模拟浏览器环境
      global.window = {};
      global.document = {
        addEventListener: jest.fn(),
      };

      const env = createEnvironment({ forceType: 'invalid-type' });

      // 应发出警告
      expect(warnSpy).toHaveBeenCalled();
      // 但仍应返回基于当前环境的适配器
      expect(env).toBeInstanceOf(BrowserEnvironment);

      warnSpy.mockRestore();
    });

    test('应在options为非对象时抛出TypeError', () => {
      expect(() => createEnvironment('不是对象')).toThrow(TypeError);
    });

    test('应在forceType非字符串时抛出TypeError', () => {
      expect(() => createEnvironment({ forceType: 123 })).toThrow(TypeError);
    });

    test('应在onReady非函数时抛出TypeError', () => {
      expect(() => createEnvironment({ onReady: '不是函数' })).toThrow(TypeError);
    });

    test('应同步调用onReady回调', () => {
      // 模拟浏览器环境
      global.window = {};
      global.document = {
        addEventListener: jest.fn(),
      };

      const onReady = jest.fn();
      const env = createEnvironment({ onReady });

      // 回调应被调用
      expect(onReady).toHaveBeenCalledWith(env, ENVIRONMENT_TYPES.BROWSER);
    });

    test('当asyncInit为true时应异步调用onReady回调', () =>
      new Promise(resolve => {
        // 模拟浏览器环境
        global.window = {};
        global.document = {
          addEventListener: jest.fn().mockImplementation((event, callback) => {
            // 模拟DOMContentLoaded事件触发
            setTimeout(callback, 10); // 使用短暂的定时器来模拟异步
          }),
        };

        const onReady = jest.fn().mockImplementation(() => {
          expect(onReady).toHaveBeenCalled();
          resolve();
        });

        createEnvironment({
          onReady,
          asyncInit: true,
        });

        // 此时回调不应被调用
        expect(onReady).not.toHaveBeenCalled();
      }));
  });

  describe('createEnvironmentAsync()', () => {
    test('应返回期望的环境适配器实例的Promise', async () => {
      // 模拟浏览器环境
      global.window = {};
      global.document = {
        addEventListener: jest.fn().mockImplementation((event, callback) => {
          // 立即调用回调以加速测试
          callback();
        }),
      };

      const env = await createEnvironmentAsync();
      expect(env).toBeInstanceOf(BrowserEnvironment);
    });

    test('应将参数正确传递给createEnvironment', async () => {
      // 模拟浏览器环境
      global.window = {};
      global.document = {
        addEventListener: jest.fn().mockImplementation((event, callback) => {
          // 立即调用回调以加速测试
          callback();
        }),
      };

      const options = {
        storageKey: 'test-key',
      };

      const env = await createEnvironmentAsync(options);
      expect(env).toBeInstanceOf(BrowserEnvironment);
      expect(env._storageKey).toBe('test-key');
    });

    test('应同时解析Promise和调用onReady回调', async () => {
      // 模拟浏览器环境
      global.window = {};
      global.document = {
        addEventListener: jest.fn().mockImplementation((event, callback) => {
          // 立即调用回调以加速测试
          callback();
        }),
      };

      const onReady = jest.fn();

      const env = await createEnvironmentAsync({ onReady });

      // Promise应解析
      expect(env).toBeInstanceOf(BrowserEnvironment);

      // onReady回调也应被调用
      expect(onReady).toHaveBeenCalledWith(env);
    });
  });
});
