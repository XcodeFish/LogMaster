const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const chalk = require('chalk');

const MAX_SIZE = 2048; // 2KB

function checkFileSize(filePath) {
  const content = fs.readFileSync(filePath);
  const gzipped = zlib.gzipSync(content);
  const size = gzipped.length;

  console.log(`${path.basename(filePath)}: ${content.length} bytes (${size} bytes gzipped)`);

  if (size > MAX_SIZE) {
    console.error(
      chalk.red(
        `错误: ${path.basename(filePath)} 超出大小限制 (${size} > ${MAX_SIZE} bytes gzipped)`,
      ),
    );
    process.exitCode = 1;
  } else {
    console.log(
      chalk.green(
        `✓ ${path.basename(filePath)} 大小符合要求 (${size} <= ${MAX_SIZE} bytes gzipped)`,
      ),
    );
  }
}

// 创建dist目录（如果不存在）
const distPath = path.join(__dirname, '../dist');
if (!fs.existsSync(distPath)) {
  console.log(chalk.yellow('警告: dist 目录不存在，跳过大小检查'));
  process.exit(0);
}

// 检查压缩版大小
const minFilePath = path.join(distPath, 'logmaster.min.js');
if (fs.existsSync(minFilePath)) {
  checkFileSize(minFilePath);
} else {
  console.log(chalk.yellow(`警告: ${minFilePath} 不存在，跳过大小检查`));
}

// 检查ESM版本大小
const esmJsPath = path.join(__dirname, '../dist/logmaster.esm.js');
if (fs.existsSync(esmJsPath)) {
  checkFileSize(esmJsPath);
}

// 检查CJS版本大小
const cjsJsPath = path.join(__dirname, '../dist/logmaster.cjs.js');
if (fs.existsSync(cjsJsPath)) {
  checkFileSize(cjsJsPath);
}

// 总结
if (process.exitCode === 1) {
  console.error(chalk.red('❌ 体积检查失败'));
} else {
  console.log(chalk.green('✅ 所有文件体积符合要求'));
}
