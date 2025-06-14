const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// 测试结果目录
const TEST_RESULTS_DIR = path.join(__dirname, '../test-results');

// 创建测试结果目录（如果不存在）
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
  console.log(chalk.yellow(`创建目录: ${TEST_RESULTS_DIR}`));
}

// 加载最新性能测试结果
const latestResultsPath = path.join(TEST_RESULTS_DIR, 'perf-latest.json');
let latestResults;

try {
  latestResults = require(latestResultsPath);
} catch (e) {
  console.log(chalk.yellow('没有找到最新的性能测试结果，将跳过回归检查'));
  process.exit(0);
}

// 加载基准性能结果
const baselinePath = path.join(TEST_RESULTS_DIR, 'perf-baseline.json');
let baselineResults;

try {
  baselineResults = require(baselinePath);
} catch (e) {
  console.log(chalk.yellow('没有找到基准性能测试结果，将当前结果设为基准'));
  fs.copyFileSync(latestResultsPath, baselinePath);
  process.exit(0);
}

// 比较性能结果
const regressions = [];
const improvements = [];

Object.keys(latestResults).forEach(testName => {
  const baseline = baselineResults[testName] || { ops: 0 };
  const latest = latestResults[testName];

  // 计算性能变化百分比
  let changePercent;
  if (baseline.ops === 0) {
    // 基线值为0时，无法计算百分比变化，直接使用绝对值
    changePercent = latest.ops > 0 ? 100 : 0; // 从0到任何正值都视为100%的提升
  } else {
    changePercent = ((latest.ops - baseline.ops) / baseline.ops) * 100;
  }

  if (changePercent < -5) {
    // 超过5%的性能下降视为回归
    regressions.push({
      test: testName,
      baseline: baseline.ops.toFixed(2),
      current: latest.ops.toFixed(2),
      change: changePercent.toFixed(2) + '%',
    });
  } else if (changePercent > 5) {
    // 超过5%的性能提升记录下来
    improvements.push({
      test: testName,
      baseline: baseline.ops.toFixed(2),
      current: latest.ops.toFixed(2),
      change: '+' + changePercent.toFixed(2) + '%',
    });
  }
});

// 输出结果
console.log('\n====== 性能测试结果 ======\n');

if (regressions.length > 0) {
  console.log(chalk.yellow('⚠️ 检测到性能回归:'));
  console.table(regressions);

  if (regressions.some(r => parseFloat(r.change) < -10)) {
    console.error(chalk.red('❌ 严重性能回归! 部分测试性能下降超过10%'));
    process.exit(1);
  }
} else {
  console.log(chalk.green('✅ 没有检测到性能回归'));
}

if (improvements.length > 0) {
  console.log(chalk.green('\n🎉 性能改进:'));
  console.table(improvements);
}

// 如果没有严重回归，更新基准（仅在CI环境中）
if (process.env.UPDATE_BASELINE === 'true') {
  fs.copyFileSync(latestResultsPath, baselinePath);
  console.log(chalk.green('\n✅ 已更新性能基准'));
}
