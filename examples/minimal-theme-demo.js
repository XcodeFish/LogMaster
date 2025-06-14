/**
 * @file 简约主题示例
 * @author LogMaster
 */

import LogMaster from '../src/LogMaster.js';
import { minimalTheme } from '../src/themes/exports.js';

// 创建日志实例
const logger = new LogMaster({
  useColors: true,
  showTimestamp: true,
  showBadge: true,
});

console.log('===== 简约主题特性展示 =====');

// 设置简约主题
logger.setTheme('minimal');
logger.info('已应用标准简约主题');

// 展示不同日志级别
console.log('\n=== 日志级别 ===');
logger.debug('调试信息 - 使用灰度色调');
logger.info('普通信息 - 使用深灰色');
logger.warn('警告信息 - 使用柔和的黄灰色');
logger.error('错误信息 - 使用柔和的红灰色');

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
      theme: 'minimal',
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

// 展示紧凑模式
console.log('\n=== 紧凑模式 ===');
const compactTheme = minimalTheme.getCompactTheme();
logger.setTheme(compactTheme);
logger.info('已应用紧凑模式简约主题 - 减少垂直空间占用');
logger.debug('调试信息 - 紧凑模式');
logger.warn('警告信息 - 紧凑模式');
logger.error('错误信息 - 紧凑模式');

// 展示单色模式
console.log('\n=== 单色模式 ===');
const monochromeTheme = minimalTheme.getMonochromeTheme();
logger.setTheme(monochromeTheme);
logger.info('已应用单色模式简约主题 - 完全灰度色阶');
logger.debug('调试信息 - 单色模式');
logger.warn('警告信息 - 单色模式');
logger.error('错误信息 - 单色模式');

// 展示阅读优化模式
console.log('\n=== 阅读优化模式 ===');
const readabilityTheme = minimalTheme.getReadabilityTheme();
logger.setTheme(readabilityTheme);
logger.info('已应用阅读优化模式 - 适合长时间阅读');
logger.debug('调试信息 - 阅读优化模式使用更大的字体和行高');
logger.warn('警告信息 - 阅读优化模式使用衬线字体提高可读性');
logger.error('错误信息 - 阅读优化模式使用暖色背景减少眼睛疲劳');

// 展示打印优化模式
console.log('\n=== 打印优化模式 ===');
const printTheme = minimalTheme.getPrintTheme();
logger.setTheme(printTheme);
logger.info('已应用打印优化模式 - 适合打印输出');
logger.debug('调试信息 - 打印优化模式使用打印友好的字体和单位');
logger.warn('警告信息 - 打印优化模式使用单色和细边框');
logger.error('错误信息 - 打印优化模式隐藏图标');

// 展示无图标模式
console.log('\n=== 无图标模式 ===');
const noIconsTheme = minimalTheme.getNoIconsTheme();
logger.setTheme(noIconsTheme);
logger.info('已应用无图标模式 - 进一步减少视觉干扰');
logger.debug('调试信息 - 无图标模式');
logger.warn('警告信息 - 无图标模式');
logger.error('错误信息 - 无图标模式');

// 展示无徽章模式
console.log('\n=== 无徽章模式 ===');
const noBadgeTheme = minimalTheme.getNoBadgeTheme();
logger.setTheme(noBadgeTheme);
logger.info('已应用无徽章模式 - 移除日志级别徽章');
logger.debug('调试信息 - 无徽章模式');
logger.warn('警告信息 - 无徽章模式');
logger.error('错误信息 - 无徽章模式');

// 展示无时间戳模式
console.log('\n=== 无时间戳模式 ===');
const noTimestampTheme = minimalTheme.getNoTimestampTheme();
logger.setTheme(noTimestampTheme);
logger.info('已应用无时间戳模式 - 移除时间戳显示');
logger.debug('调试信息 - 无时间戳模式');
logger.warn('警告信息 - 无时间戳模式');
logger.error('错误信息 - 无时间戳模式');

// 展示自定义简约主题
console.log('\n=== 自定义简约主题 ===');
const customMinimalTheme = minimalTheme.mergeTheme({
  colors: {
    debug: '#505050', // 自定义调试信息颜色
    info: '#404040', // 自定义普通信息颜色
    background: '#fafafa', // 自定义背景色
  },
  fonts: {
    size: '11px', // 更小的字体
  },
  minimal: {
    compactMode: true,
    hideIcons: true,
  },
});

logger.setTheme(customMinimalTheme);
logger.info('已应用自定义简约主题');
logger.debug('调试信息 - 自定义颜色');
logger.info('普通信息 - 自定义颜色');

// 重置为默认主题
logger.resetConfig();
logger.info('已重置为默认主题');
