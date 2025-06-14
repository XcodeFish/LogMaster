/**
 * @file 批量日志性能测试
 * @module tests/performance/batch-log
 * @author LogMaster Team
 * @license MIT
 */

const { performance } = require('perf_hooks');
const LogMaster = require('../../dist/logmaster.js');
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
