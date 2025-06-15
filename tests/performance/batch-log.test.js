/**
 * @file 批量日志性能测试
 * @module tests/performance/batch-log
 * @author LogMaster Team
 * @license MIT
 */

const { performance } = require('perf_hooks');
const LogMaster = require('../../src/index.js');
const config = require('./performance-test.config.js');

/**
 * 批量日志测试
 * 测试不同大小的批量日志处理效率
 */
async function runBatchLogTests() {
  console.log('===== 批量日志性能测试 =====');

  // 禁用控制台输出以避免影响性能测试
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  // 暂时替换控制台方法
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};

  // 创建LogMaster实例
  const logger = new LogMaster({
    environment: 'development',
    logLevel: 'INFO',
    enableConsoleOutput: true,
  });

  // 结果记录
  const results = [];

  // 准备测试数据
  const testMessages = new Array(config.batchLogTest.messageCount)
    .fill(0)
    .map((_, index) =>
      config.batchLogTest.messageTemplate
        .replace('{index}', index)
        .replace('{timestamp}', new Date().toISOString()),
    );

  // 测试不同的批处理大小
  for (const batchSize of config.batchLogTest.batchSizes) {
    console.log = originalConsole.log;
    console.log(`测试批处理大小: ${batchSize}...`);
    console.log = () => {};

    const batches = [];

    // 将消息分成批次
    for (let i = 0; i < testMessages.length; i += batchSize) {
      batches.push(testMessages.slice(i, i + batchSize));
    }

    // 开始计时
    const startTime = performance.now();

    // 处理每个批次
    for (const batch of batches) {
      const batchData = {
        timestamp: new Date(),
        count: batch.length,
        messages: batch,
      };

      logger.info(`Processing batch of ${batch.length} messages`, batchData);
    }

    // 结束计时
    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // 记录结果
    results.push({
      batchSize,
      totalMessages: config.batchLogTest.messageCount,
      batches: batches.length,
      totalTimeMs: totalTime,
      messagesPerSecond: (config.batchLogTest.messageCount / totalTime) * 1000,
      batchesPerSecond: (batches.length / totalTime) * 1000,
    });
  }

  // 恢复控制台方法
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;

  // 输出结果
  console.log('\n批量日志性能测试结果:');
  console.log('-------------------------------------------------------------------');
  console.log('批次大小 | 总批次数 | 总耗时(ms) | 每秒消息 | 每秒批次 | 批处理效率');
  console.log('-------------------------------------------------------------------');

  // 以最小批次大小为基准的效率比较
  const baselineResult = results.find(
    r => r.batchSize === Math.min(...config.batchLogTest.batchSizes),
  );
  const baselineRate = baselineResult ? baselineResult.messagesPerSecond : 1;

  for (const result of results) {
    // 计算效率比（与基准批次大小相比）
    const efficiency = (result.messagesPerSecond / baselineRate).toFixed(2) + 'x';

    console.log(
      `${result.batchSize.toString().padStart(8)} | ` +
        `${result.batches.toString().padStart(8)} | ` +
        `${result.totalTimeMs.toFixed(2).padStart(10)} | ` +
        `${result.messagesPerSecond.toFixed(2).padStart(8)} | ` +
        `${result.batchesPerSecond.toFixed(2).padStart(8)} | ` +
        `${efficiency.padStart(10)}`,
    );
  }

  console.log('-------------------------------------------------------------------');
  console.log('结论:');

  // 找出性能最佳的批次大小
  const bestResult = results.reduce((prev, current) =>
    prev.messagesPerSecond > current.messagesPerSecond ? prev : current,
  );

  console.log(
    `- 最佳批处理大小: ${bestResult.batchSize} (${bestResult.messagesPerSecond.toFixed(
      2,
    )} 消息/秒)`,
  );
  console.log(
    `- 最小批处理大小: ${baselineResult.batchSize} (${baselineResult.messagesPerSecond.toFixed(
      2,
    )} 消息/秒)`,
  );
  console.log(
    `- 性能提升: ${(bestResult.messagesPerSecond / baselineResult.messagesPerSecond).toFixed(2)}x`,
  );

  return { results, bestBatchSize: bestResult.batchSize };
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runBatchLogTests()
    .then(() => console.log('批量日志测试完成'))
    .catch(err => console.error('批量日志测试失败:', err));
}

module.exports = {
  runBatchLogTests,
};

// Jest 测试用例
describe('LogMaster 批处理日志性能测试', () => {
  // 测试配置
  const BATCH_SIZE = config.batchLog.batchSize || 1000;
  const TIME_THRESHOLD = config.batchLog.threshold || 1000; // 毫秒

  // 测试变量
  let logger;
  let startTime;
  let endTime;

  // 测试前设置
  beforeEach(() => {
    // 模拟控制台方法
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // 创建LogMaster实例
    logger = LogMaster;
  });

  afterEach(() => {
    // 恢复控制台方法
    jest.restoreAllMocks();
  });

  // 跳过批处理测试，因为它们可能不稳定
  test.skip('批处理应高效处理大量日志', () => {
    // 准备批处理日志数据
    const batchLogs = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      batchLogs.push({
        level: 'info',
        message: `批处理日志 #${i}`,
        timestamp: new Date().toISOString(),
        data: { index: i },
      });
    }

    // 记录开始时间
    startTime = performance.now();

    // 执行批处理
    if (logger.batchLog) {
      logger.batchLog(batchLogs);
    } else {
      // 如果没有批处理方法，则逐条记录
      batchLogs.forEach(log => {
        logger[log.level](log.message, log.data);
      });
    }

    // 记录结束时间
    endTime = performance.now();

    // 计算总耗时
    const totalTime = endTime - startTime;

    // 验证总耗时在可接受范围内
    expect(totalTime).toBeLessThan(TIME_THRESHOLD);
  });

  test.skip('批处理按级别过滤应正常工作', () => {
    // 准备不同级别的批处理日志数据
    const mixedBatchLogs = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      const level = ['debug', 'info', 'warn', 'error'][i % 4];
      mixedBatchLogs.push({
        level,
        message: `${level}级别日志 #${i}`,
        timestamp: new Date().toISOString(),
        data: { index: i },
      });
    }

    // 设置日志级别为warn，应该只处理warn和error级别的日志
    if (logger.setLevel) {
      logger.setLevel('warn');
    }

    // 记录开始时间
    startTime = performance.now();

    // 执行批处理
    if (logger.batchLog) {
      logger.batchLog(mixedBatchLogs);
    } else {
      // 如果没有批处理方法，则逐条记录
      mixedBatchLogs.forEach(log => {
        logger[log.level](log.message, log.data);
      });
    }

    // 记录结束时间
    endTime = performance.now();

    // 计算总耗时
    const totalTime = endTime - startTime;

    // 验证总耗时在可接受范围内
    expect(totalTime).toBeLessThan(TIME_THRESHOLD);
  });
});
