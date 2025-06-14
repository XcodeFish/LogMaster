/**
 * @file 性能测试入口文件
 * @module tests/performance/index
 * @author LogMaster Team
 * @license MIT
 */

const fs = require('fs');
const path = require('path');
const { runLatencyTests } = require('./latency.test');
const { runMemoryTests } = require('./memory.test');
const { runHighFrequencyTests } = require('./high-frequency.test');
const { runBatchLogTests } = require('./batch-log.test');

/**
 * 运行所有性能测试并生成综合报告
 */
async function runAllPerformanceTests() {
  console.log('======================================');
  console.log('| LogMaster 性能测试套件             |');
  console.log('======================================');
  console.log('开始时间: ' + new Date().toISOString());
  console.log('--------------------------------------');

  // 存储所有测试结果
  const results = {
    timestamp: new Date().toISOString(),
    summary: {},
    details: {},
  };

  // 运行日志记录延迟测试
  try {
    console.log('\n[1/4] 运行日志记录延迟测试');
    const latencyResults = await runLatencyTests();
    results.details.latency = latencyResults;

    // 提取摘要数据
    const avgLatency =
      Object.values(latencyResults).reduce(
        (sum, logType) =>
          sum + Object.values(logType).reduce((s, payload) => s + payload.avgTime, 0),
        0,
      ) /
      (Object.keys(latencyResults).length * Object.keys(Object.values(latencyResults)[0]).length);

    results.summary.latency = {
      averageLatency: avgLatency,
      logsPerSecond: 1000 / avgLatency,
    };
  } catch (error) {
    console.error('日志记录延迟测试失败:', error);
    results.summary.latency = { error: error.message };
  }

  // 运行内存使用测试
  try {
    console.log('\n[2/4] 运行内存使用测试');
    const memoryResults = await runMemoryTests();
    results.details.memory = memoryResults;

    // 提取摘要数据
    results.summary.memory = {
      baselineHeapUsed: memoryResults.baseline.heapUsed,
      peakHeapUsed: memoryResults.peak.heapUsed,
      finalHeapUsed: memoryResults.final.heapUsed,
      memoryGrowth: (memoryResults.peak.heapUsed / memoryResults.baseline.heapUsed - 1) * 100,
      logsPerSecond: memoryResults.performance.logsPerSecond,
    };
  } catch (error) {
    console.error('内存使用测试失败:', error);
    results.summary.memory = { error: error.message };
  }

  // 运行高频日志性能测试
  try {
    console.log('\n[3/4] 运行高频日志性能测试');
    const highFrequencyResults = await runHighFrequencyTests();
    results.details.highFrequency = highFrequencyResults;

    // 提取摘要数据
    results.summary.highFrequency = {
      totalLogs: highFrequencyResults.logCounts.processed,
      droppedLogs: highFrequencyResults.logCounts.dropped,
      throughput:
        (highFrequencyResults.logCounts.processed / highFrequencyResults.times.total) * 1000,
      memoryUsage:
        highFrequencyResults.memory.peak.heapUsed - highFrequencyResults.memory.before.heapUsed,
    };
  } catch (error) {
    console.error('高频日志性能测试失败:', error);
    results.summary.highFrequency = { error: error.message };
  }

  // 运行批量日志性能测试
  try {
    console.log('\n[4/4] 运行批量日志性能测试');
    const batchLogResults = await runBatchLogTests();
    results.details.batchLog = batchLogResults;

    // 提取摘要数据
    const bestBatchResult = batchLogResults.results.reduce((prev, current) =>
      prev.messagesPerSecond > current.messagesPerSecond ? prev : current,
    );

    const worstBatchResult = batchLogResults.results.reduce((prev, current) =>
      prev.messagesPerSecond < current.messagesPerSecond ? prev : current,
    );

    results.summary.batchLog = {
      bestBatchSize: bestBatchResult.batchSize,
      bestThroughput: bestBatchResult.messagesPerSecond,
      worstBatchSize: worstBatchResult.batchSize,
      worstThroughput: worstBatchResult.messagesPerSecond,
      improvement: bestBatchResult.messagesPerSecond / worstBatchResult.messagesPerSecond,
    };
  } catch (error) {
    console.error('批量日志性能测试失败:', error);
    results.summary.batchLog = { error: error.message };
  }

  // 生成综合报告
  console.log('\n======================================');
  console.log('| LogMaster 性能测试综合报告        |');
  console.log('======================================');

  // 输出综合结论
  console.log('\n--- 延迟性能 ---');
  if (results.summary.latency.error) {
    console.log(`测试失败: ${results.summary.latency.error}`);
  } else {
    console.log(`平均日志延迟: ${results.summary.latency.averageLatency.toFixed(4)} ms`);
    console.log(`每秒日志吞吐量: ${results.summary.latency.logsPerSecond.toFixed(2)} 日志/秒`);
  }

  console.log('\n--- 内存性能 ---');
  if (results.summary.memory.error) {
    console.log(`测试失败: ${results.summary.memory.error}`);
  } else {
    console.log(`基线堆内存: ${results.summary.memory.baselineHeapUsed.toFixed(2)} MB`);
    console.log(`峰值堆内存: ${results.summary.memory.peakHeapUsed.toFixed(2)} MB`);
    console.log(`内存增长率: ${results.summary.memory.memoryGrowth.toFixed(1)}%`);
    console.log(`内存测试吞吐量: ${results.summary.memory.logsPerSecond.toFixed(2)} 日志/秒`);
  }

  console.log('\n--- 高频日志性能 ---');
  if (results.summary.highFrequency.error) {
    console.log(`测试失败: ${results.summary.highFrequency.error}`);
  } else {
    console.log(`处理日志总量: ${results.summary.highFrequency.totalLogs} 条`);
    console.log(`丢弃日志: ${results.summary.highFrequency.droppedLogs} 条`);
    console.log(`吞吐量: ${results.summary.highFrequency.throughput.toFixed(2)} 日志/秒`);
    console.log(`内存使用增长: ${results.summary.highFrequency.memoryUsage.toFixed(2)} MB`);
  }

  console.log('\n--- 批量日志性能 ---');
  if (results.summary.batchLog.error) {
    console.log(`测试失败: ${results.summary.batchLog.error}`);
  } else {
    console.log(`最佳批次大小: ${results.summary.batchLog.bestBatchSize} 条/批`);
    console.log(`最佳吞吐量: ${results.summary.batchLog.bestThroughput.toFixed(2)} 日志/秒`);
    console.log(`批处理改进: ${results.summary.batchLog.improvement.toFixed(2)}x`);
  }

  console.log('\n======================================');
  console.log('测试结束时间: ' + new Date().toISOString());
  console.log('======================================');

  // 保存结果到文件
  const reportDir = path.join(__dirname, '../../test-results');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(
    reportDir,
    `performance-report-${new Date().toISOString().replace(/:/g, '-')}.json`,
  );
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log(`\n详细报告已保存到: ${reportPath}`);

  return results;
}

// 如果直接运行此文件，则执行所有测试
if (require.main === module) {
  runAllPerformanceTests()
    .then(() => console.log('\n所有性能测试完成'))
    .catch(err => console.error('性能测试运行失败:', err));
}

module.exports = {
  runAllPerformanceTests,
};
