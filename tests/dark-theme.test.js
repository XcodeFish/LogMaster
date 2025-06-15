/**
 * @file 暗色主题测试
 * @module tests/dark-theme
 * @author LogMaster
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

describe('暗色主题 (dark.js)', () => {
  test('主题文件应该存在', () => {
    const filePath = path.join(__dirname, '../src/themes/dark.js');
    expect(fs.existsSync(filePath)).toBe(true);
  });
});
