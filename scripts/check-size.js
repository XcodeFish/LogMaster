const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const chalk = require('chalk');

const MAX_SIZE = 2048; // 2KB

function checkFileSize(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(chalk.red(`错误: 文件 ${filePath} 不存在!`));
    process.exitCode = 1;
    return;
  }

  const content = fs.readFileSync(filePath);
  const gzipped = zlib.gzipSync(content);
  const size = gzipped.length;

  console.log(`${path.basename(filePath)}: ${content.length} 字节 (${size} 字节 gzip压缩后)`);

  if (size > MAX_SIZE) {
    console.error(chalk.red(`错误: ${path.basename(filePath)} 超出体积限制 (${size} > ${MAX_SIZE} 字节 gzip压缩后)`));
    process.exitCode = 1;
  } else {
    const percentOfLimit = Math.round((size / MAX_SIZE) * 100);
    if (percentOfLimit > 80) {
      console.warn(chalk.yellow(`警告: ${path.basename(filePath)} 已达到体积限制的 ${percentOfLimit}%`));
    } else {
      console.log(chalk.green(`✓ ${path.basename(filePath)} 体积正常 (${percentOfLimit}% 限制)`));
    }
  }
}

// 检查所有构建产物
console.log(chalk.bold('检查构建产物体积...'));

// 检查压缩版大小
const minJsPath = path.join(__dirname, '../dist/logmaster.min.js');
checkFileSize(minJsPath);

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
