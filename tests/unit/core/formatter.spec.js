/**
 * @file 格式化模块单元测试
 * @module tests/unit/core/formatter
 * @author LogMaster Team
 * @license MIT
 */

import {
  formatTime,
  formatMessage,
  serializeObject,
  formatError,
  applyStyle,
  formatStack,
  truncateText,
} from '../../../src/core/formatter.js';

describe('格式化模块测试', () => {
  describe('formatTime 函数测试', () => {
    test('应以默认格式返回时间戳', () => {
      const timestamp = new Date('2023-01-01T12:34:56');
      const result = formatTime(timestamp);

      // 默认格式应该是 HH:MM:SS
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    test('应使用自定义格式', () => {
      const timestamp = new Date('2023-01-01T12:34:56');
      const format = 'HH:mm:ss';
      const result = formatTime(timestamp, format);

      expect(result).toBe('12:34:56');
    });

    test('应处理无效日期', () => {
      const invalidDate = new Date('invalid');
      const result = formatTime(invalidDate);

      expect(result).toBeTruthy(); // 应返回某种字符串
    });
  });

  describe('formatMessage 函数测试', () => {
    test('应正确格式化简单字符串消息', () => {
      const message = ['测试消息'];
      const result = formatMessage(message);

      expect(result).toContain('测试消息');
    });

    test('应处理多个参数', () => {
      const args = ['消息', 123, true];
      const result = formatMessage(args);

      expect(result).toContain('消息');
      expect(result).toContain('123');
      expect(result).toContain('true');
    });

    test('应处理错误对象', () => {
      const error = new Error('测试错误');
      const result = formatMessage([error]);

      expect(result).toContain('测试错误');
      expect(result).toContain('Error'); // 应包含错误类型
    });

    test('应处理复杂对象', () => {
      const obj = {
        name: '测试',
        values: [1, 2, 3],
        nested: {
          prop: 'value',
        },
      };
      const result = formatMessage([obj]);

      expect(result).toContain('测试');
      expect(result).toContain('values');
      expect(result).toContain('nested');
    });
  });

  describe('serializeObject 函数测试', () => {
    test('应格式化简单对象', () => {
      const obj = { a: 1, b: 'string', c: true };
      const result = serializeObject(obj);

      expect(result).toContain('a');
      expect(result).toContain('1');
      expect(result).toContain('b');
      expect(result).toContain('string');
      expect(result).toContain('c');
      expect(result).toContain('true');
    });

    test('应处理嵌套对象', () => {
      const obj = {
        outer: 'value',
        nested: {
          inner: 'nested value',
        },
      };
      const result = serializeObject(obj);

      expect(result).toContain('outer');
      expect(result).toContain('value');
      expect(result).toContain('nested');
      expect(result).toContain('inner');
      expect(result).toContain('nested value');
    });

    test('应处理循环引用', () => {
      const obj = { name: 'circular' };
      obj.self = obj; // 创建循环引用

      const result = serializeObject(obj);

      expect(result).toContain('name');
      expect(result).toContain('circular');
    });

    test('应在达到最大深度时停止递归', () => {
      const deepObj = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep value',
              },
            },
          },
        },
      };

      // 设置最大深度为2
      const result = serializeObject(deepObj, 10, 100, 0, 2);

      expect(result).toContain('level1');
      expect(result).toContain('level2');
      expect(result).toContain('[对象嵌套过深]'); // 应在到达最大深度时中断
    });

    test('应处理长数组', () => {
      const longArray = Array.from({ length: 100 }, (_, i) => i);
      const result = serializeObject({ array: longArray }, 10); // 最大数组长度为10

      // 应截断数组显示
      expect(result).toContain('array');
      expect(result).toContain('0');
      expect(result).toContain('已截断'); // 应显示被截断信息
    });
  });

  describe('formatError 函数测试', () => {
    test('应格式化标准Error对象', () => {
      const error = new Error('测试错误');
      const result = formatError(error);

      expect(result).toContain('测试错误');
      expect(result).toContain('Error');
    });

    test('应处理自定义错误对象', () => {
      class CustomError extends Error {
        constructor(message) {
          super(message);
          this.name = 'CustomError';
          this.code = 500;
        }
      }

      const customError = new CustomError('自定义错误');
      const result = formatError(customError);

      expect(result).toContain('CustomError');
      expect(result).toContain('自定义错误');
    });

    test('应处理错误字符串', () => {
      const error = '这是一个错误消息';
      const result = formatError(error);

      expect(result).toContain('这是一个错误消息');
    });
  });

  describe('applyStyle 函数测试', () => {
    test('应应用基本样式', () => {
      const text = '测试文本';
      const style = 'red';
      const result = applyStyle(text, style);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toContain('%c');
      expect(result[0]).toContain('测试文本');
      expect(result[1]).toContain('color:');
    });

    test('应在Node环境中应用样式', () => {
      const text = '测试文本';
      const style = 'red';
      const result = applyStyle(text, style, false);

      expect(typeof result).toBe('string');
      expect(result).toContain('测试文本');
    });

    test('无样式时应返回原始文本', () => {
      const text = '测试文本';
      const result = applyStyle(text, null);

      expect(result[0]).toContain('测试文本');
    });
  });

  describe('formatStack 函数测试', () => {
    test('应从错误堆栈中提取有用信息', () => {
      const error = new Error('测试错误');
      const stackInfo = formatStack(error.stack);

      // 基础断言不依赖条件
      expect(stackInfo).toBeTruthy();
      expect(typeof stackInfo).toBe('string');
    });

    test('应处理无堆栈信息的情况', () => {
      const stackInfo = formatStack(null);
      expect(stackInfo).toBe('');
    });
  });

  describe('truncateText 函数测试', () => {
    test('应截断超长文本', () => {
      const longText = '这是一段非常长的文本，需要被截断以适应显示';
      const maxLength = 10;
      const result = truncateText(longText, maxLength);

      expect(result.length).toBeLessThanOrEqual(maxLength + 3); // +3是因为省略号
      expect(result).toContain('...'); // 应包含省略号
    });

    test('不应截断未超长的文本', () => {
      const shortText = '短文本';
      const maxLength = 10;
      const result = truncateText(shortText, maxLength);

      expect(result).toBe(shortText);
      expect(result).not.toContain('...');
    });

    test('应使用自定义省略号', () => {
      const longText = '这是一段非常长的文本，需要被截断以适应显示';
      const maxLength = 10;
      const ellipsis = '......';
      const result = truncateText(longText, maxLength, ellipsis);

      expect(result).toContain('......');
    });
  });
});
