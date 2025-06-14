/**
 * @file 主题系统示例
 * @author LogMaster
 */

import LogMaster from '../src/LogMaster.js';
import themes from '../src/themes/index.js';

// 创建日志实例
const logger = new LogMaster({
  useColors: true,
  showTimestamp: true,
  showBadge: true,
});

// 展示默认主题
console.log('===== 默认主题 =====');
logger.info('这是默认主题的信息日志');
logger.debug('这是默认主题的调试日志');
logger.warn('这是默认主题的警告日志');
logger.error('这是默认主题的错误日志');

// 展示对象格式化
logger.info('对象格式化示例', {
  user: 'admin',
  permissions: ['read', 'write'],
  active: true,
  stats: {
    logins: 5,
    lastLogin: new Date(),
  },
});

// 使用暗色主题
console.log('\n===== 暗色主题 =====');
logger.setTheme('dark');

logger.info('这是暗色主题的信息日志');
logger.debug('这是暗色主题的调试日志');
logger.warn('这是暗色主题的警告日志');
logger.error('这是暗色主题的错误日志');

// 展示分组功能
logger.group('暗色主题分组示例');
logger.info('分组内的信息');
logger.debug('分组内的调试信息');
logger.groupEnd();

// 使用简约主题
console.log('\n===== 简约主题 =====');
logger.setTheme('minimal');

logger.info('这是简约主题的信息日志');
logger.debug('这是简约主题的调试日志');
logger.warn('这是简约主题的警告日志');
logger.error('这是简约主题的错误日志');

// 展示表格功能
const tableData = [
  { name: '张三', age: 28, role: '开发者' },
  { name: '李四', age: 32, role: '设计师' },
  { name: '王五', age: 45, role: '产品经理' },
];
logger.table(tableData);

// 使用自定义主题
console.log('\n===== 自定义主题 =====');
const customTheme = {
  colors: {
    debug: '#9370DB', // 中等紫色
    info: '#20B2AA', // 浅海绿
    warn: '#FF8C00', // 深橙色
    error: '#DC143C', // 猩红色
    timestamp: '#708090', // 板岩灰
    badge: '#2F4F4F', // 深石板灰
    stack: '#A9A9A9', // 暗灰色
    background: '#FFFAFA', // 雪白色
    text: '#2F4F4F', // 深石板灰
  },
  fonts: {
    primary: 'Georgia, serif',
    size: '13px',
  },
  icons: {
    debug: '🔎',
    info: '💡',
    warn: '⚡',
    error: '💥',
  },
};

logger.setTheme(customTheme);

logger.info('这是自定义主题的信息日志');
logger.debug('这是自定义主题的调试日志');
logger.warn('这是自定义主题的警告日志');
logger.error('这是自定义主题的错误日志');

// 展示主题API
console.log('\n===== 主题API示例 =====');
console.log('获取默认主题:', themes.getTheme('default'));
console.log('获取暗色主题:', themes.getTheme('dark'));
console.log('获取简约主题:', themes.getTheme('minimal'));

// 合并主题示例
const mergedTheme = themes.mergeTheme(
  {
    colors: {
      info: '#8A2BE2', // 蓝紫色
      background: '#F5F5F5', // 白烟色
    },
  },
  'dark',
);

console.log('合并后的主题:', mergedTheme);

// 重置为默认主题
logger.resetConfig();
logger.info('重置为默认主题后的日志');
