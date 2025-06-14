/**
 * @file 暗色主题示例
 * @author LogMaster
 */

import LogMaster from '../src/LogMaster.js';
import { darkTheme } from '../src/themes/exports.js';

// 创建日志实例
const logger = new LogMaster({
  useColors: true,
  showTimestamp: true,
  showBadge: true,
});

console.log('===== 暗色主题特性展示 =====');

// 设置暗色主题
logger.setTheme('dark');
logger.info('已应用标准暗色主题');

// 展示不同日志级别
console.log('\n=== 日志级别 ===');
logger.debug('调试信息 - 使用柔和的蓝色');
logger.info('普通信息 - 使用清晰的绿色');
logger.warn('警告信息 - 使用醒目但不刺眼的黄色');
logger.error('错误信息 - 使用鲜明的红色');

// 展示复杂数据格式化
console.log('\n=== 复杂数据格式化 ===');
const complexData = {
  user: {
    id: 12345,
    name: '张三',
    roles: ['admin', 'editor'],
    active: true,
    lastLogin: new Date(),
    preferences: {
      theme: 'dark',
      notifications: {
        email: true,
        push: false,
      },
    },
  },
  stats: [
    { name: '访问量', value: 1024, trend: 'up' },
    { name: '转化率', value: 15.7, trend: 'stable' },
    { name: '停留时间', value: 127, trend: 'down' },
  ],
};

logger.info('复杂对象展示', complexData);

// 展示分组功能
console.log('\n=== 分组功能 ===');
logger.group('用户操作日志');
logger.info('用户登录', { userId: 12345, time: new Date() });
logger.debug('会话创建', { sessionId: 'abc123xyz' });

logger.group('权限检查');
logger.info('检查用户权限', { roles: ['admin', 'editor'] });
logger.debug('权限通过');
logger.groupEnd(); // 结束权限检查分组

logger.warn('检测到异常登录地点');
logger.groupEnd(); // 结束用户操作日志分组

// 展示表格功能
console.log('\n=== 表格功能 ===');
const tableData = [
  { id: 1, name: '张三', role: '管理员', lastActive: '今天' },
  { id: 2, name: '李四', role: '编辑', lastActive: '昨天' },
  { id: 3, name: '王五', role: '访客', lastActive: '3天前' },
  { id: 4, name: '赵六', role: '编辑', lastActive: '1周前' },
];

logger.info('用户列表:');
logger.table(tableData);

// 展示堆栈跟踪
console.log('\n=== 堆栈跟踪 ===');
logger.trace('这是一个堆栈跟踪示例');

// 展示高对比度暗色主题
console.log('\n=== 高对比度暗色主题 ===');
const highContrastTheme = darkTheme.getHighContrastTheme();
logger.setTheme(highContrastTheme);
logger.info('已应用高对比度暗色主题 - 适合低光环境和视力障碍用户');
logger.debug('调试信息 - 高对比度模式');
logger.warn('警告信息 - 高对比度模式');
logger.error('错误信息 - 高对比度模式');

// 展示减少动画的暗色主题
console.log('\n=== 减少动画的暗色主题 ===');
const reducedMotionTheme = darkTheme.getReducedMotionTheme();
logger.setTheme(reducedMotionTheme);
logger.info('已应用减少动画的暗色主题 - 适合对动画敏感的用户');

// 展示自定义暗色主题
console.log('\n=== 自定义暗色主题 ===');
const customDarkTheme = darkTheme.mergeTheme({
  colors: {
    debug: '#9370DB', // 紫色调试信息
    info: '#20B2AA', // 浅海绿色信息
    background: '#121212', // 更深的背景色
  },
  fonts: {
    size: '14px', // 更大的字体
  },
});

logger.setTheme(customDarkTheme);
logger.info('已应用自定义暗色主题');
logger.debug('调试信息 - 自定义紫色');
logger.info('普通信息 - 自定义浅海绿色');

// 检测系统暗色模式偏好
console.log('\n=== 系统暗色模式偏好 ===');
const isSystemDarkMode = darkTheme.isSystemDarkMode();
logger.info(`系统暗色模式偏好: ${isSystemDarkMode ? '启用' : '未启用'}`);

// 重置为默认主题
logger.resetConfig();
logger.info('已重置为默认主题');
