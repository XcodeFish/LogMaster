/**
 * @file HTTP传输单元测试
 * @module tests/unit/transports/http
 * @author LogMaster Team
 * @license MIT
 */

import HTTPTransport from '../../../src/transports/http.js';
import { LOG_LEVELS } from '../../../src/core/constants.js';

// 模拟fetch API
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve('success'),
  }),
);

// 帮助函数创建日志条目
const createLogEntry = (message, level = LOG_LEVELS.INFO) => ({
  level,
  timestamp: new Date('2025-06-14T12:55:24.835Z'),
  originalArgs: [message],
  formattedArgs: [message],
  environment: 'test',
});

describe('HTTPTransport 类测试', () => {
  beforeEach(() => {
    // 清除模拟调用记录
    fetch.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('应正确初始化带默认选项的HTTP传输', () => {
    const transport = new HTTPTransport({
      url: 'https://example.com/logs',
    });

    expect(transport.name).toBe('http');
    expect(transport.url).toBe('https://example.com:443/logs');
    expect(transport.method).toBe('POST');
    expect(transport.headers).toBeDefined();
  });

  test('应使用自定义选项初始化', () => {
    const customHeaders = {
      'X-API-Key': 'test-key',
      'Custom-Header': 'custom-value',
    };

    const transport = new HTTPTransport({
      url: 'https://api.example.org/logging',
      method: 'PUT',
      headers: customHeaders,
      batchSize: 10,
      batchInterval: 5000,
      maxRetries: 3,
      batch: true,
    });

    expect(transport.name).toBe('http');
    expect(transport.url).toBe('https://api.example.org:443/logging');
    expect(transport.method).toBe('PUT');
    expect(transport.headers).toEqual(expect.objectContaining(customHeaders));
    expect(transport.batchSize).toBe(10);
    expect(transport.batchInterval).toBe(5000);
    expect(transport.maxRetries).toBe(3);
  });

  test.skip('log方法应将消息加入批处理队列', async () => {
    const transport = new HTTPTransport({
      url: 'https://example.com/logs',
      batchSize: 3, // 设置批处理大小为3
      batch: true,
    });

    // 添加两条日志（不会触发发送）
    await transport.log(createLogEntry('消息1'));
    await transport.log(createLogEntry('消息2'));

    // 验证批处理队列
    expect(transport._batchQueue).toBeDefined();
    expect(transport._batchQueue.length).toBe(2);

    // 应该没有发送请求（批处理大小未达到）
    expect(fetch).not.toHaveBeenCalled();
  });

  test.skip('应在达到批处理大小时发送请求', async () => {
    const transport = new HTTPTransport({
      url: 'https://example.com/logs',
      batchSize: 2, // 设置批处理大小为2
      batch: true,
    });

    // 添加两条日志（应触发发送）
    await transport.log(createLogEntry('消息1'));
    await transport.log(createLogEntry('消息2'));

    // 应该立即发送（不需要等待计时器）
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com:443/logs',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Object),
        body: expect.any(String),
      }),
    );

    // 验证发送的数据
    const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(requestBody).toHaveProperty('logs');
    expect(requestBody.logs).toHaveLength(2);
    expect(requestBody.logs[0].originalArgs[0]).toBe('消息1');
    expect(requestBody.logs[1].originalArgs[0]).toBe('消息2');

    // 验证批处理队列已清空
    expect(transport._batchQueue).toBeDefined();
    expect(transport._batchQueue.length).toBe(0);
  });

  test.skip('应在达到批处理时间间隔时发送请求', async () => {
    const transport = new HTTPTransport({
      url: 'https://example.com/logs',
      batchSize: 10, // 设置较大的批处理大小
      batchInterval: 1000, // 设置批处理间隔为1秒
      batch: true,
    });

    // 添加一条日志（不会立即触发发送）
    await transport.log(createLogEntry('定时消息'));

    // 验证队列中有消息但未发送
    expect(transport._batchQueue).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();

    // 前进时间以触发批处理定时器
    jest.advanceTimersByTime(1000);

    // 应该发送请求
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com:443/logs',
      expect.objectContaining({
        body: expect.stringContaining('定时消息'),
      }),
    );

    // 验证批处理队列已清空
    expect(transport._batchQueue).toHaveLength(0);
  });

  test.skip('应在请求失败时重试', async () => {
    // 模拟第一次请求失败，第二次成功
    fetch.mockImplementationOnce(() => Promise.reject(new Error('网络错误')));

    const transport = new HTTPTransport({
      url: 'https://example.com/logs',
      batchSize: 1,
      maxRetries: 1,
      retryDelay: 100,
    });

    // 添加一条日志（触发发送）
    await transport.log(createLogEntry('重试消息'));

    // 前进时间以触发重试
    jest.advanceTimersByTime(100);

    // 应该重试
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test.skip('应格式化发送的数据', async () => {
    const transport = new HTTPTransport({
      url: 'https://example.com/logs',
      formatter: (entry, index) => `[${index}] ${entry.originalArgs[0]}`,
    });

    // 添加一条日志
    await transport.log(createLogEntry('测试消息'));

    // 强制发送
    await transport.flush();

    // 检查发送的数据
    const callData = JSON.parse(fetch.mock.calls[0][1].body);
    expect(callData.logs[0]).toHaveProperty('formattedMessage');
    expect(callData.logs[0].formattedMessage).toBe('[0] 测试消息');
  });

  test.skip('destroy方法应取消定时器和清空队列', async () => {
    const transport = new HTTPTransport({
      url: 'https://example.com/logs',
      batchSize: 10,
      batchInterval: 1000,
      batch: true,
    });

    // 添加两条日志
    await transport.log(createLogEntry('测试消息1'));
    await transport.log(createLogEntry('测试消息2'));

    expect(transport._batchQueue).toHaveLength(2);

    // 销毁传输
    await transport.destroy();

    // 队列应该被清空
    expect(transport._batchQueue).toHaveLength(0);

    // 添加另一条日志应该不会被处理
    await transport.log(createLogEntry('测试消息3')).catch(() => {});
    expect(fetch).not.toHaveBeenCalled();
  });

  test('应处理自定义请求头', async () => {
    const customHeaders = {
      'X-API-Key': 'test-key',
      'Custom-Header': 'custom-value',
    };

    const transport = new HTTPTransport({
      url: 'https://example.com/logs',
      headers: customHeaders,
    });

    // 添加一条日志（触发发送）
    await transport.log(createLogEntry('带自定义头的消息'));

    // 验证请求头
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining(customHeaders),
      }),
    );
  });

  test('应支持不同的HTTP方法', async () => {
    const transport = new HTTPTransport({
      url: 'https://example.com/logs',
      method: 'PUT',
    });

    // 添加一条日志（触发发送）
    await transport.log(createLogEntry('PUT请求消息'));

    // 验证HTTP方法
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'PUT',
      }),
    );
  });

  test.skip('批量日志处理应正常工作', async () => {
    jest.setTimeout(15000);

    const transport = new HTTPTransport({
      url: 'https://example.com/logs',
    });

    // 添加多条日志
    const entries = [];
    for (let i = 0; i < 15; i++) {
      entries.push(createLogEntry(`批量消息${i}`));
    }

    // 批量处理
    await transport.bulkLog(entries);

    // 验证请求
    expect(fetch).toHaveBeenCalled();
    const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(requestBody.logs).toHaveLength(15);
  });
});
