/**
 * @file 性能测试配置
 * @module tests/performance/config
 * @author LogMaster Team
 * @license MIT
 */

// 性能测试配置参数
module.exports = {
  // 日志记录延迟测试配置
  latencyTest: {
    iterations: 1000, // 测试迭代次数
    warmupIterations: 100, // 热身迭代次数（不计入结果）
    logTypes: ['debug', 'info', 'warn', 'error'],
    logPayloads: {
      // 不同复杂度的日志载荷
      simple: 'This is a simple string message',
      medium: { id: 1, name: '测试对象', value: true, data: [1, 2, 3, 4, 5] },
      complex: new Array(100).fill(0).map((_, i) => ({
        id: i,
        name: `项目${i}`,
        timestamp: new Date().toISOString(),
        nested: { level1: { level2: { level3: `深度嵌套值${i}` } } },
      })),
    },
  },

  // 内存使用测试配置
  memoryTest: {
    baselineDuration: 1000, // 基线内存采集时间(ms)
    testDuration: 5000, // 测试运行时间(ms)
    samplingRate: 100, // 内存采样间隔(ms)
    logMessages: 10000, // 需要记录的日志数量
    gcBeforeTest: true, // 测试前是否尝试执行垃圾回收
  },

  // 高频日志性能测试配置
  highFrequencyTest: {
    duration: 3000, // 测试持续时间(ms)
    batchSize: 10000, // 每批次日志数量
    batches: 5, // 批次数
    delay: 200, // 批次间延迟(ms)
  },

  // 批量日志性能测试配置
  batchLogTest: {
    messageCount: 10000, // 消息总数
    batchSizes: [10, 100, 1000, 5000, 10000], // 不同的批处理大小
    messageTemplate: 'Log message #{index} with timestamp {timestamp}',
  },
};
