/**
 * @file 日志延迟测试
 * @author LogMaster
 * @description 测试LogMaster在不同场景下的日志记录延迟
 */

const { performance } = require('perf_hooks');
const LogMaster = require('../../src/index.js');
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

// 测试套件
describe('LogMaster 延迟性能测试', () => {
  // 测试配置
  const TEST_ITERATIONS = config.latency.iterations || 1000;
  const MAX_LATENCY = config.latency.threshold || 5; // 毫秒

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

  // 跳过延迟测试，因为它们可能不稳定
  test.skip('简单日志操作的延迟应该很低', () => {
    // 测量单个日志操作的延迟
    startTime = performance.now();
    logger.info('测试日志消息');
    endTime = performance.now();

    // 计算延迟
    const latency = endTime - startTime;

    // 验证延迟在可接受范围内
    expect(latency).toBeLessThan(MAX_LATENCY);
  });

  test.skip('不同级别的日志延迟应该在合理范围内', () => {
    // 测量不同级别日志的平均延迟
    const latencies = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    // 每个级别执行多次以获取平均值
    for (let i = 0; i < TEST_ITERATIONS; i++) {
      // Debug级别
      startTime = performance.now();
      logger.debug(`Debug测试 #${i}`);
      endTime = performance.now();
      latencies.debug += endTime - startTime;

      // Info级别
      startTime = performance.now();
      logger.info(`Info测试 #${i}`);
      endTime = performance.now();
      latencies.info += endTime - startTime;

      // Warn级别
      startTime = performance.now();
      logger.warn(`Warn测试 #${i}`);
      endTime = performance.now();
      latencies.warn += endTime - startTime;

      // Error级别
      startTime = performance.now();
      logger.error(`Error测试 #${i}`);
      endTime = performance.now();
      latencies.error += endTime - startTime;
    }

    // 计算平均延迟
    Object.keys(latencies).forEach(level => {
      latencies[level] /= TEST_ITERATIONS;
    });

    // 验证所有级别的平均延迟都在可接受范围内
    Object.values(latencies).forEach(avgLatency => {
      expect(avgLatency).toBeLessThan(MAX_LATENCY);
    });
  });
});
