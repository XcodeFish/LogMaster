/**
 * @file 内存使用性能测试
 * @module tests/performance/memory
 * @author LogMaster Team
 * @license MIT
 */

const { performance } = require('perf_hooks');
const LogMaster = require('../../dist/logmaster.js');
const config = require('./performance-test.config.js');

/**
 * 采集内存使用快照
 * @returns {Object} 内存使用情况
 */
function getMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  return {
    rss: memoryUsage.rss / (1024 * 1024), // 常驻集大小(MB)
    heapTotal: memoryUsage.heapTotal / (1024 * 1024), // 总堆大小(MB)
    heapUsed: memoryUsage.heapUsed / (1024 * 1024), // 已用堆大小(MB)
    external: memoryUsage.external / (1024 * 1024), // 外部内存(MB)
    timestamp: performance.now(),
  };
}

/**
 * 尝试强制进行垃圾回收（如果V8标志允许）
 */
function attemptGarbageCollection() {
  try {
    if (global.gc) {
      global.gc();
      return true;
    }
  } catch (e) {
    console.warn('无法执行垃圾回收。请使用 --expose-gc 标志运行 Node.js。');
  }
  return false;
}

/**
 * 内存使用测试
 * 测量日志系统在高负载下的内存使用情况
 */
async function runMemoryTests() {
  console.log('===== 内存使用测试 =====');

  // 尝试执行垃圾回收
  if (config.memoryTest.gcBeforeTest) {
    attemptGarbageCollection();
  }

  // 创建LogMaster实例
  const logger = new LogMaster({
    environment: 'development',
    logLevel: 'DEBUG',
    enableConsoleOutput: false, // 禁用控制台输出
  });

  // 基线内存使用
  console.log('采集基线内存使用情况...');
  const baselineSnapshots = [];
  const baselineInterval = setInterval(() => {
    baselineSnapshots.push(getMemoryUsage());
  }, config.memoryTest.samplingRate);

  // 等待基线收集完成
  await new Promise(resolve => setTimeout(resolve, config.memoryTest.baselineDuration));
  clearInterval(baselineInterval);

  // 开始记录日志的内存使用
  console.log(`开始记录 ${config.memoryTest.logMessages} 条日志的内存使用...`);
  const memorySnapshots = [];

  const samplingInterval = setInterval(() => {
    memorySnapshots.push(getMemoryUsage());
  }, config.memoryTest.samplingRate);

  // 生成测试数据
  const testData = new Array(100).fill(0).map((_, i) => ({
    id: i,
    message: `测试消息 #${i}`,
    timestamp: new Date().toISOString(),
    tags: ['test', 'memory', `tag-${i % 10}`],
  }));

  // 执行日志记录
  const startTime = performance.now();

  for (let i = 0; i < config.memoryTest.logMessages; i++) {
    const testItem = testData[i % testData.length];
    // 交替使用不同级别的日志
    switch (i % 4) {
      case 0:
        logger.debug(`Debug message ${i}`, testItem);
        break;
      case 1:
        logger.info(`Info message ${i}`, testItem);
        break;
      case 2:
        logger.warn(`Warning message ${i}`, testItem);
        break;
      case 3:
        logger.error(`Error message ${i}`, testItem);
        break;
    }

    // 每1000条日志暂停一下，以便更准确地监控内存变化
    if (i > 0 && i % 1000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
  }

  const endTime = performance.now();

  // 继续采样一段时间，以观察日志记录后的内存状态
  await new Promise(resolve => setTimeout(resolve, config.memoryTest.samplingRate * 10));
  clearInterval(samplingInterval);

  // 尝试垃圾回收以查看可释放的内存
  if (config.memoryTest.gcBeforeTest) {
    attemptGarbageCollection();
    memorySnapshots.push({
      ...getMemoryUsage(),
      afterGC: true,
    });
  }

  // 计算和分析结果
  const baselineAvg = baselineSnapshots.reduce(
    (acc, snapshot) => {
      acc.rss += snapshot.rss;
      acc.heapTotal += snapshot.heapTotal;
      acc.heapUsed += snapshot.heapUsed;
      return acc;
    },
    { rss: 0, heapTotal: 0, heapUsed: 0 },
  );

  baselineAvg.rss /= baselineSnapshots.length;
  baselineAvg.heapTotal /= baselineSnapshots.length;
  baselineAvg.heapUsed /= baselineSnapshots.length;

  // 找出内存使用峰值
  const memoryPeak = memorySnapshots.reduce(
    (peak, snapshot) => ({
      rss: Math.max(peak.rss, snapshot.rss),
      heapTotal: Math.max(peak.heapTotal, snapshot.heapTotal),
      heapUsed: Math.max(peak.heapUsed, snapshot.heapUsed),
    }),
    { rss: 0, heapTotal: 0, heapUsed: 0 },
  );

  // 获取最终内存状态
  const finalMemory = memorySnapshots[memorySnapshots.length - 1];

  // 输出结果
  console.log('\n内存使用测试结果（单位：MB）：');
  console.log('---------------------------------------------');
  console.log('指标              | 基线    | 峰值    | 最终    | 增长率');
  console.log('---------------------------------------------');
  console.log(
    `RSS (常驻集大小)    | ${baselineAvg.rss.toFixed(2).padStart(7)} | ${memoryPeak.rss
      .toFixed(2)
      .padStart(7)} | ${finalMemory.rss.toFixed(2).padStart(7)} | ${(
      (finalMemory.rss / baselineAvg.rss - 1) *
      100
    ).toFixed(1)}%`,
  );
  console.log(
    `堆总量            | ${baselineAvg.heapTotal.toFixed(2).padStart(7)} | ${memoryPeak.heapTotal
      .toFixed(2)
      .padStart(7)} | ${finalMemory.heapTotal.toFixed(2).padStart(7)} | ${(
      (finalMemory.heapTotal / baselineAvg.heapTotal - 1) *
      100
    ).toFixed(1)}%`,
  );
  console.log(
    `堆使用            | ${baselineAvg.heapUsed.toFixed(2).padStart(7)} | ${memoryPeak.heapUsed
      .toFixed(2)
      .padStart(7)} | ${finalMemory.heapUsed.toFixed(2).padStart(7)} | ${(
      (finalMemory.heapUsed / baselineAvg.heapUsed - 1) *
      100
    ).toFixed(1)}%`,
  );
  console.log('---------------------------------------------');

  // 性能统计
  const totalDuration = endTime - startTime;
  const logsPerSecond = (config.memoryTest.logMessages / totalDuration) * 1000;
  console.log(`总日志数: ${config.memoryTest.logMessages}`);
  console.log(`总耗时: ${totalDuration.toFixed(2)} 毫秒`);
  console.log(`每秒日志数: ${logsPerSecond.toFixed(2)}`);
  console.log('---------------------------------------------');

  // 返回详细结果供进一步分析
  return {
    baseline: baselineAvg,
    peak: memoryPeak,
    final: finalMemory,
    snapshots: memorySnapshots,
    performance: {
      totalDuration,
      logsPerSecond,
      messagesCount: config.memoryTest.logMessages,
    },
  };
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runMemoryTests()
    .then(() => console.log('内存测试完成'))
    .catch(err => console.error('内存测试失败:', err));
}

module.exports = {
  runMemoryTests,
  getMemoryUsage,
};
