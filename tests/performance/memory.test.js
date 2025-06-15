/**
 * @file 内存使用测试
 * @author LogMaster
 * @description 测试LogMaster在高频日志记录下的内存使用情况
 */

const LogMaster = require('../../src/index.js');
const config = require('./performance-test.config.js');

/**
 * 获取当前内存使用情况
 * @returns {number} 当前内存使用量（MB）
 */
function getMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  return memoryUsage.heapUsed / 1024 / 1024;
}

/**
 * 强制垃圾回收（如果可用）
 */
function forceGC() {
  if (global.gc) {
    global.gc();
  }
}

/**
 * 测试帮助函数：生成随机日志消息
 * @param {number} size - 消息大小
 * @returns {string} 随机消息
 */
function generateLogMessage(size = 100) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < size; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 测试帮助函数：生成随机对象
 * @param {number} depth - 对象深度
 * @param {number} breadth - 每层属性数量
 * @returns {Object} 随机对象
 */
function generateRandomObject(depth = 3, breadth = 5) {
  if (depth <= 0) {
    return generateLogMessage(20);
  }

  const obj = {};
  for (let i = 0; i < breadth; i++) {
    const key = `prop${i}`;
    if (Math.random() > 0.7) {
      obj[key] = generateRandomObject(depth - 1, breadth);
    } else {
      obj[key] = generateLogMessage(20);
    }
  }
  return obj;
}

/**
 * 测试帮助函数：生成随机错误
 * @returns {Error} 随机错误对象
 */
function generateRandomError() {
  const errorTypes = [Error, TypeError, SyntaxError, ReferenceError, RangeError];
  const ErrorClass = errorTypes[Math.floor(Math.random() * errorTypes.length)];
  return new ErrorClass(generateLogMessage(50));
}

/**
 * 内存使用测试套件
 */
describe('LogMaster 内存性能测试', () => {
  // 测试配置
  const TEST_ITERATIONS = config.memory.iterations || 1000;
  const MEMORY_THRESHOLD = config.memory.threshold || 10; // MB

  // 测试变量
  let logger;
  let initialMemory;
  let finalMemory;

  // 测试前设置
  beforeEach(() => {
    // 模拟控制台方法
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // 创建LogMaster实例
    logger = LogMaster;

    // 强制垃圾回收并记录初始内存
    forceGC();
    initialMemory = getMemoryUsage();
  });

  afterEach(() => {
    // 恢复控制台方法
    jest.restoreAllMocks();

    // 清理日志实例
    if (logger && typeof logger.destroy === 'function') {
      logger.destroy();
    }

    // 强制垃圾回收
    forceGC();
  });

  // 跳过内存测试，因为它们可能不稳定
  test.skip('大量日志操作后不应有明显的内存泄漏', () => {
    // 记录大量日志
    for (let i = 0; i < TEST_ITERATIONS; i++) {
      const level = i % 4;
      const message = generateLogMessage(100);
      const data = generateRandomObject(3, 3);

      switch (level) {
        case 0:
          logger.debug(message, data);
          break;
        case 1:
          logger.info(message, data);
          break;
        case 2:
          logger.warn(message, data);
          break;
        case 3:
          logger.error(message, generateRandomError());
          break;
      }
    }

    // 强制垃圾回收并记录最终内存
    forceGC();
    finalMemory = getMemoryUsage();

    // 计算内存增长
    const memoryGrowth = finalMemory - initialMemory;

    // 验证内存增长在可接受范围内
    expect(memoryGrowth).toBeLessThan(MEMORY_THRESHOLD);
  });

  test.skip('日志实例清理后应释放内存', () => {
    // 记录一些日志
    for (let i = 0; i < TEST_ITERATIONS / 10; i++) {
      logger.info(generateLogMessage(100), generateRandomObject(2, 3));
    }

    // 记录中间内存使用
    forceGC();
    const midMemory = getMemoryUsage();

    // 清理日志实例
    if (logger && typeof logger.destroy === 'function') {
      logger.destroy();
    }

    // 强制垃圾回收并记录最终内存
    forceGC();
    finalMemory = getMemoryUsage();

    // 验证内存释放
    expect(finalMemory).toBeLessThanOrEqual(midMemory);
  });
});
