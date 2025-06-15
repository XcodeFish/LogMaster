/**
 * @file 日志传输系统集成测试
 * @module tests/integration/logger-transports
 * @author LogMaster Team
 * @license MIT
 */

import LogMaster from '../../src/LogMaster.js';
import { BaseTransport } from '../../src/transports/base.js';
import { LOG_LEVELS } from '../../src/core/constants.js';

describe('日志传输系统集成测试', () => {
  // 先备份原始环境
  const originalEnv = process.env.NODE_ENV;
  let logMasterInstance;
  let mockConsoleTransport;
  let mockFileTransport;

  beforeEach(() => {
    // 创建一个全新的LogMaster实例
    logMasterInstance = new LogMaster();

    // 创建模拟的控制台传输
    mockConsoleTransport = new BaseTransport({
      name: 'MockConsole',
      level: LOG_LEVELS.INFO,
    });
    mockConsoleTransport.log = jest.fn();

    // 创建模拟的文件传输
    mockFileTransport = new BaseTransport({
      name: 'MockFile',
      level: LOG_LEVELS.ERROR,
    });
    mockFileTransport.log = jest.fn();

    // 监视控制台
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    // 清理测试环境
    jest.restoreAllMocks();
    // 恢复原始环境
    process.env.NODE_ENV = originalEnv;
  });

  test('添加多个传输实例后应正确调用所有传输', () => {
    logMasterInstance.addTransport(mockConsoleTransport);
    logMasterInstance.addTransport(mockFileTransport);

    // 发送错误日志，两个传输都应该记录
    logMasterInstance.error('测试错误消息');

    // 验证所有传输都被调用
    expect(mockConsoleTransport.log).toHaveBeenCalled();
    expect(mockFileTransport.log).toHaveBeenCalled();

    // 验证调用参数包含正确的日志级别
    expect(mockConsoleTransport.log.mock.calls[0][0].level).toBe(LOG_LEVELS.ERROR);
    expect(mockFileTransport.log.mock.calls[0][0].level).toBe(LOG_LEVELS.ERROR);

    // 验证日志内容
    expect(mockConsoleTransport.log.mock.calls[0][0].originalArgs).toContain('测试错误消息');
    expect(mockFileTransport.log.mock.calls[0][0].originalArgs).toContain('测试错误消息');
  });

  test('不同日志级别应正确过滤传输', () => {
    logMasterInstance.addTransport(mockConsoleTransport);
    logMasterInstance.addTransport(mockFileTransport);

    // 先发送 INFO 级别日志
    logMasterInstance.info('普通信息'); // 只应该被控制台传输记录

    // 再发送 ERROR 级别日志
    logMasterInstance.error('错误信息'); // 两个传输都应该记录

    // 检查控制台传输是否被正确调用
    let foundInfoLevel = false;
    let foundErrorLevel = false;
    let infoLogData;
    let errorLogData;

    for (const call of mockConsoleTransport.log.mock.calls) {
      const logData = call[0];
      if (logData.level === LOG_LEVELS.INFO) {
        foundInfoLevel = true;
        infoLogData = logData;
      }
      if (logData.level === LOG_LEVELS.ERROR) {
        foundErrorLevel = true;
        errorLogData = logData;
      }
    }

    // 控制台传输应记录INFO和ERROR
    expect(foundInfoLevel).toBeTruthy();
    expect(foundErrorLevel).toBeTruthy();

    // 验证日志内容
    expect(infoLogData.originalArgs).toContain('普通信息');
    expect(errorLogData.originalArgs).toContain('错误信息');

    // 文件传输只应记录ERROR
    expect(mockFileTransport.log).toHaveBeenCalled();

    // 检查文件传输接收到的日志内容包含错误信息
    const fileLogEntries = mockFileTransport.log.mock.calls;

    // 找到ERROR级别的日志条目
    const errorEntry = fileLogEntries.find(call => call[0].level === LOG_LEVELS.ERROR);
    expect(errorEntry).toBeDefined();
    expect(errorEntry[0].originalArgs).toContain('错误信息');
  });

  test('可以通过ID删除特定传输', () => {
    // 添加两个传输
    logMasterInstance.addTransport(mockConsoleTransport);
    logMasterInstance.addTransport(mockFileTransport);

    // 确认两个传输都已添加
    expect(logMasterInstance.getTransports()).toHaveLength(2);

    // 删除控制台传输
    logMasterInstance.removeTransport(mockConsoleTransport.id);

    // 验证只剩下一个传输
    expect(logMasterInstance.getTransports()).toHaveLength(1);
    expect(logMasterInstance.getTransports()[0].id).toBe(mockFileTransport.id);

    // 记录错误日志
    logMasterInstance.error('测试删除后的错误');

    // 只有文件传输应该被调用
    expect(mockFileTransport.log).toHaveBeenCalled();
    expect(mockConsoleTransport.log).not.toHaveBeenCalled();
  });

  test('clearTransports应移除所有传输', () => {
    // 添加两个传输
    logMasterInstance.addTransport(mockConsoleTransport);
    logMasterInstance.addTransport(mockFileTransport);

    // 确认两个传输都已添加
    expect(logMasterInstance.getTransports()).toHaveLength(2);

    // 清除所有传输
    logMasterInstance.clearTransports();

    // 验证没有传输
    expect(logMasterInstance.getTransports()).toHaveLength(0);

    // 记录错误日志
    logMasterInstance.error('测试清除后的错误');

    // 两个传输都不应该被调用
    expect(mockFileTransport.log).not.toHaveBeenCalled();
    expect(mockConsoleTransport.log).not.toHaveBeenCalled();
  });

  test('传输系统在生产环境中应正常工作', () => {
    // 设置生产环境
    logMasterInstance.setEnvironment('production');
    logMasterInstance.addTransport(mockConsoleTransport);

    // 在生产环境中，DEBUG日志不应输出
    logMasterInstance.debug('调试信息');
    expect(mockConsoleTransport.log).not.toHaveBeenCalled();

    // ERROR日志应正常输出
    logMasterInstance.error('错误信息');
    expect(mockConsoleTransport.log).toHaveBeenCalled();
  });

  test('链式API调用应正常工作', () => {
    // 测试链式API
    const result = logMasterInstance
      .setEnvironment('development')
      .setLogLevel('DEBUG')
      .addTransport(mockConsoleTransport)
      .addTransport(mockFileTransport);

    // 链式调用应返回实例本身
    expect(result).toBe(logMasterInstance);

    // 设置应生效
    expect(logMasterInstance._environment).toBe('development');
    expect(logMasterInstance._logLevel).toBe(LOG_LEVELS.DEBUG);
  });

  test('批量日志处理应正常工作', () => {
    // 使用一个简单的批量处理函数而不是事件
    const mockBatchProcessor = new BaseTransport({
      name: 'BatchProcessor',
      level: LOG_LEVELS.INFO,
    });

    // 添加处理方法
    let batchProcessed = false;
    mockBatchProcessor.log = jest.fn().mockImplementation(() => {
      batchProcessed = true;
    });

    logMasterInstance.addTransport(mockBatchProcessor);

    // 发送3条日志
    logMasterInstance.info('批量消息1');
    logMasterInstance.info('批量消息2');
    logMasterInstance.info('批量消息3');

    // 验证批处理器被调用
    expect(mockBatchProcessor.log).toHaveBeenCalled();
    expect(batchProcessed).toBe(true);
  });

  test('传输错误应被正确处理', async () => {
    // 创建一个会抛出错误的传输
    const errorTransport = new BaseTransport({
      name: 'ErrorTransport',
    });

    // 设置错误处理
    let errorCaptured = false;
    const originalLog = console.error;
    console.error = jest.fn().mockImplementation(() => {
      errorCaptured = true;
    });

    // 使log方法抛出错误
    errorTransport.log = jest.fn().mockImplementation(() => {
      throw new Error('传输失败');
    });

    // 添加传输
    logMasterInstance.addTransport(errorTransport);

    // 发送日志，应触发错误但不应崩溃
    logMasterInstance.info('会导致错误的消息');

    // 验证错误被捕获并记录
    expect(errorCaptured).toBe(true);

    // 恢复console.error
    console.error = originalLog;
  });
});
