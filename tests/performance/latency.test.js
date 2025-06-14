/**
 * @file 日志记录延迟性能测试
 * @module tests/performance/latency
 * @author LogMaster Team
 * @license MIT
 */

const { performance } = require('perf_hooks');
const LogMaster = require('../../dist/logmaster.js');
const config = require('./performance-test.config.js');

/**
 * 日志记录延迟测试
 * 测量不同日志类型和不同复杂度日志内容的记录延迟
 */
async function runLatencyTests() {
  console.log('===== 日志记录延迟测试 =====');

  // 禁用控制台输出以避免影响性能测试
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  // 暂时替换控制台方法以避免输出干扰测试结果
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

  // 为每种日志类型和载荷组合进行测试
  const results = {};

  for (const logType of config.latencyTest.logTypes) {
    results[logType] = {};

    for (const [payloadType, payload] of Object.entries(config.latencyTest.logPayloads)) {
      // 热身以避免JIT优化影响
      for (let i = 0; i < config.latencyTest.warmupIterations; i++) {
        logger[logType](payload);
      }

      // 实际测量
      const startTime = performance.now();

      for (let i = 0; i < config.latencyTest.iterations; i++) {
        logger[logType](payload);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / config.latencyTest.iterations;

      results[logType][payloadType] = {
        totalTime,
        avgTime,
        operationsPerSec: 1000 / avgTime,
      };
    }
  }

  // 恢复控制台方法
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;

  // 输出结果
  console.log('日志延迟测试结果（单位：毫秒, 操作/秒）：');
  console.log('-----------------------------------------------');
  console.log('日志类型 | 载荷类型 | 平均延迟 (ms) | 操作/秒');
  console.log('-----------------------------------------------');

  for (const logType of config.latencyTest.logTypes) {
    for (const payloadType of Object.keys(config.latencyTest.logPayloads)) {
      const result = results[logType][payloadType];
      console.log(
        `${logType.padEnd(8)} | ${payloadType.padEnd(9)} | ${result.avgTime
          .toFixed(4)
          .padStart(12)} | ${result.operationsPerSec.toFixed(2).padStart(8)}`,
      );
    }
  }

  console.log('-----------------------------------------------');
  return results;
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runLatencyTests()
    .then(() => console.log('延迟测试完成'))
    .catch(err => console.error('延迟测试失败:', err));
}

module.exports = {
  runLatencyTests,
};
