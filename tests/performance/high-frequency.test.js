/**
 * @file 高频日志性能测试
 * @module tests/performance/high-frequency
 * @author LogMaster Team
 * @license MIT
 */

const { performance } = require('perf_hooks');
const LogMaster = require('../../dist/logmaster.js');
const config = require('./performance-test.config.js');
const { getMemoryUsage } = require('./memory.test.js');

/**
 * 高频日志测试
 * 测试日志系统在短时间内处理大量日志的性能表现
 */
async function runHighFrequencyTests() {
  console.log('===== 高频日志性能测试 =====');

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
    logLevel: 'DEBUG',
    enableConsoleOutput: true,
  });

  // 添加性能计数器
  let processedLogs = 0;
  let droppedLogs = 0;

  // 测试结果
  const results = {
    batches: [],
    memory: {
      before: getMemoryUsage(),
      after: null,
      peak: { heapUsed: 0, rss: 0 },
    },
    logCounts: { processed: 0, dropped: 0, total: 0 },
    times: { start: 0, end: 0, total: 0 },
  };

  // 生成预定义的测试消息
  const generateTestMessage = (index, batchId) => ({
    id: `${batchId}-${index}`,
    message: `高频测试消息 #${index} from batch ${batchId}`,
    timestamp: performance.now(),
    batchId,
    index,
  });

  // 记录内存峰值
  const memoryInterval = setInterval(() => {
    const memory = getMemoryUsage();
    results.memory.peak.heapUsed = Math.max(results.memory.peak.heapUsed, memory.heapUsed);
    results.memory.peak.rss = Math.max(results.memory.peak.rss, memory.rss);
  }, 50); // 每50ms采样一次

  // 开始高频日志测试
  results.times.start = performance.now();

  // 连续发送多个批次的日志
  for (let batch = 1; batch <= config.highFrequencyTest.batches; batch++) {
    console.log = originalConsole.log;
    console.log(
      `发送批次 ${batch}/${config.highFrequencyTest.batches} (${config.highFrequencyTest.batchSize} 条日志)...`,
    );
    console.log = () => {};

    const batchStart = performance.now();
    let completedLogs = 0;

    // 发送大量日志
    for (let i = 0; i < config.highFrequencyTest.batchSize; i++) {
      const message = generateTestMessage(i, batch);

      // 随机使用不同的日志级别
      const logLevel = i % 4;
      try {
        switch (logLevel) {
          case 0:
            logger.debug(`Debug ${message.id}`, message);
            break;
          case 1:
            logger.info(`Info ${message.id}`, message);
            break;
          case 2:
            logger.warn(`Warning ${message.id}`, message);
            break;
          case 3:
            logger.error(`Error ${message.id}`, message);
            break;
        }
        processedLogs++;
        completedLogs++;
      } catch (e) {
        droppedLogs++;
      }
    }

    const batchEnd = performance.now();
    const batchDuration = batchEnd - batchStart;

    results.batches.push({
      batchNumber: batch,
      logsAttempted: config.highFrequencyTest.batchSize,
      logsCompleted: completedLogs,
      duration: batchDuration,
      logsPerSecond: (completedLogs / batchDuration) * 1000,
    });

    // 批次之间的延迟
    if (batch < config.highFrequencyTest.batches) {
      await new Promise(resolve => setTimeout(resolve, config.highFrequencyTest.delay));
    }
  }

  // 记录结束时间
  results.times.end = performance.now();
  results.times.total = results.times.end - results.times.start;
  clearInterval(memoryInterval);

  // 记录最终内存状态
  results.memory.after = getMemoryUsage();

  // 恢复控制台方法
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;

  // 更新日志计数器
  results.logCounts = {
    processed: processedLogs,
    dropped: droppedLogs,
    total: processedLogs + droppedLogs,
  };

  // 计算每秒吞吐量
  const throughput = (processedLogs / results.times.total) * 1000;

  // 输出结果
  console.log('\n高频日志测试结果:');
  console.log('---------------------------------------------');
  console.log(`总共处理: ${processedLogs} 条日志`);
  console.log(`丢弃日志: ${droppedLogs} 条`);
  console.log(`总耗时: ${results.times.total.toFixed(2)} 毫秒`);
  console.log(`平均吞吐量: ${throughput.toFixed(2)} 日志/秒`);

  console.log('\n批次详情:');
  console.log('批次 | 日志数 | 耗时(ms) | 日志/秒');
  console.log('---------------------------------------------');
  for (const batch of results.batches) {
    console.log(
      `${batch.batchNumber.toString().padStart(4)} | ${batch.logsCompleted
        .toString()
        .padStart(6)} | ${batch.duration.toFixed(2).padStart(9)} | ${batch.logsPerSecond
        .toFixed(2)
        .padStart(8)}`,
    );
  }

  console.log('\n内存使用情况 (MB):');
  console.log('---------------------------------------------');
  console.log(
    `堆内存使用: ${results.memory.before.heapUsed.toFixed(
      2,
    )} -> ${results.memory.after.heapUsed.toFixed(2)} (峰值: ${results.memory.peak.heapUsed.toFixed(
      2,
    )})`,
  );
  console.log(
    `RSS: ${results.memory.before.rss.toFixed(2)} -> ${results.memory.after.rss.toFixed(
      2,
    )} (峰值: ${results.memory.peak.rss.toFixed(2)})`,
  );

  return results;
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runHighFrequencyTests()
    .then(() => console.log('高频日志测试完成'))
    .catch(err => console.error('高频日志测试失败:', err));
}

module.exports = {
  runHighFrequencyTests,
};
