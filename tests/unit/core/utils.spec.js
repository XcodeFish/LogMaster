/**
 * @file 工具函数单元测试
 * @module tests/unit/core/utils
 * @author LogMaster Team
 * @license MIT
 */

import { typeCheckers, deepMerge, environmentDetector } from '../../../src/core/utils.js';

const { isObject } = typeCheckers;

describe('工具函数测试', () => {
  describe('typeCheckers 函数测试', () => {
    test('isObject 应正确识别对象类型', () => {
      expect(isObject({})).toBe(true);
      expect(isObject(new Date())).toBe(true);
      expect(isObject(new RegExp('test'))).toBe(true);
    });

    test('isObject 应正确识别非对象类型', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject('字符串')).toBe(false);
      expect(isObject(true)).toBe(false);
      expect(isObject(Symbol('test'))).toBe(false);
      expect(isObject([])).toBe(false); // 在typeCheckers实现中，数组不是对象
    });

    test('isArray 应正确识别数组', () => {
      expect(typeCheckers.isArray([])).toBe(true);
      expect(typeCheckers.isArray([1, 2, 3])).toBe(true);
      expect(typeCheckers.isArray({})).toBe(false);
      expect(typeCheckers.isArray('array')).toBe(false);
    });

    test('isFunction 应正确识别函数', () => {
      expect(typeCheckers.isFunction(() => {})).toBe(true);
      expect(typeCheckers.isFunction(function () {})).toBe(true);
      expect(typeCheckers.isFunction({})).toBe(false);
    });

    test('isEmpty 应正确检测空值', () => {
      expect(typeCheckers.isEmpty(null)).toBe(true);
      expect(typeCheckers.isEmpty(undefined)).toBe(true);
      expect(typeCheckers.isEmpty('')).toBe(true);
      expect(typeCheckers.isEmpty([])).toBe(true);
      expect(typeCheckers.isEmpty({})).toBe(true);
      expect(typeCheckers.isEmpty('text')).toBe(false);
      expect(typeCheckers.isEmpty([1])).toBe(false);
      expect(typeCheckers.isEmpty({ key: 'value' })).toBe(false);
    });
  });

  describe('deepMerge 函数测试', () => {
    test('应深度合并两个对象', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { b: { d: 3 }, e: 4 };

      const result = deepMerge(obj1, obj2);

      expect(result).toEqual({
        a: 1,
        b: { c: 2, d: 3 },
        e: 4,
      });
    });

    test('后面的对象应覆盖前面的同名属性', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3 };

      const result = deepMerge(obj1, obj2);

      expect(result).toEqual({
        a: 1,
        b: 3,
      });
    });

    test('应正确处理数组', () => {
      const obj1 = { a: [1, 2] };
      const obj2 = { a: [3, 4] };

      const result = deepMerge(obj1, obj2);

      // 根据实现，非concatArrays模式下数组是被拷贝而非引用
      expect(result).toEqual({
        a: [3, 4],
      });
      expect(result.a).not.toBe(obj2.a); // 应该是不同的数组实例
    });

    test('应处理null和undefined', () => {
      const obj1 = { a: 1, b: null };
      const obj2 = { b: 2, c: undefined };

      const result = deepMerge(obj1, obj2);

      expect(result).toEqual({
        a: 1,
        b: 2,
        c: undefined,
      });
    });

    test('应支持数组连接模式', () => {
      const obj1 = { a: [1, 2] };
      const obj2 = { a: [3, 4] };

      const result = deepMerge(obj1, obj2, { concatArrays: true });

      expect(result).toEqual({
        a: [1, 2, 3, 4],
      });
    });
  });

  describe('environmentDetector 测试', () => {
    // 保存原始环境
    const originalWindow = global.window;
    const originalDocument = global.document;
    const originalProcess = global.process;
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      // 恢复原始环境
      global.window = originalWindow;
      global.document = originalDocument;
      global.process = originalProcess;
      process.env.NODE_ENV = originalNodeEnv;

      // 清除可能添加的属性
      if (global.window) {
        delete global.window.location;
      }
    });

    test('应正确检测Node.js环境', () => {
      // 模拟Node.js环境
      delete global.window;
      delete global.document;
      global.process = { ...global.process, versions: { node: '14.0.0' } };

      expect(environmentDetector.isNode()).toBe(true);
      expect(environmentDetector.isBrowser()).toBe(false);
    });

    test('应正确检测浏览器环境', () => {
      // 模拟浏览器环境
      global.window = {};
      global.document = {};

      // 确保 process.versions.node 不存在，以避免被检测为 Node 环境
      if (global.process) {
        const processWithoutNode = { ...global.process };
        if (processWithoutNode.versions) {
          delete processWithoutNode.versions.node;
        }
        global.process = processWithoutNode;
      }

      expect(environmentDetector.isBrowser()).toBe(true);
      expect(environmentDetector.isNode()).toBe(false);
    });

    test('应处理未知环境', () => {
      // 模拟既不是Node也不是浏览器的环境
      delete global.window;
      delete global.document;

      // 确保 process.versions.node 不存在
      if (global.process) {
        const processWithoutNode = { ...global.process };
        if (processWithoutNode.versions) {
          delete processWithoutNode.versions.node;
        }
        global.process = processWithoutNode;
      }

      expect(environmentDetector.isNode()).toBe(false);
      expect(environmentDetector.isBrowser()).toBe(false);
    });

    test('应正确检测开发环境', () => {
      // 模拟浏览器开发环境
      global.window = {};
      global.document = {};
      global.window.location = { hostname: 'localhost' };

      // 确保 process.env.NODE_ENV 设置正确
      if (global.process && global.process.env) {
        global.process.env.NODE_ENV = 'development';
      }

      expect(environmentDetector.isDevelopment()).toBe(true);

      // 模拟浏览器生产环境
      global.window.location = { hostname: 'example.com' };
      if (global.process && global.process.env) {
        global.process.env.NODE_ENV = 'production';
      }

      expect(environmentDetector.isDevelopment()).toBe(false);
    });

    test('应正确获取环境类型', () => {
      // 模拟浏览器环境
      global.window = {};
      global.document = {};

      // 确保 process.versions.node 不存在
      if (global.process) {
        const processWithoutNode = { ...global.process };
        if (processWithoutNode.versions) {
          delete processWithoutNode.versions.node;
        }
        global.process = processWithoutNode;
      }

      expect(environmentDetector.getEnvironmentType()).toBe('browser');

      // 模拟Node环境
      delete global.window;
      delete global.document;
      global.process = { ...global.process, versions: { node: '14.0.0' } };
      expect(environmentDetector.getEnvironmentType()).toBe('node');
    });
  });
});
