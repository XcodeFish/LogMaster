/**
 * @file 简约主题测试
 * @module tests/minimal-theme
 * @author LogMaster
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

describe('简约主题 (minimal.js)', () => {
  test('主题文件应该存在', () => {
    const filePath = path.join(__dirname, '../src/themes/minimal.js');
    expect(fs.existsSync(filePath)).toBe(true);
  });
});
