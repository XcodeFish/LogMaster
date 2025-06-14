/* eslint-disable indent */
/**
 * @file 暗色主题定义
 * @module themes/dark
 * @author LogMaster
 * @license MIT
 */

import { ICONS } from '../core/constants.js';
import colorUtils from '../core/color-utils.js';
import themeEnvironment from '../core/theme-environment.js';

/**
 * 暗色主题配置
 * @type {Object}
 */
const darkTheme = {
  /**
   * 基础颜色配置
   */
  colors: {
    debug: '#8cb4ff', // 亮蓝色
    info: '#7dd3fc', // 亮青色
    warn: '#fcd34d', // 亮黄色
    error: '#f87171', // 亮红色
    timestamp: '#a1a1aa', // 灰色
    badge: '#4b5563', // 深灰色
    stack: '#94a3b8', // 灰蓝色
    background: '#1e1e1e', // 深灰色背景
    text: '#e4e4e7', // 浅灰色文本
    border: '#4b5563', // 中灰色边框
    muted: '#71717a', // 中灰色次要信息
    highlight: '#2a2a2a', // 稍亮的背景色

    // 语法高亮相关颜色
    string: '#A5D6FF', // 字符串颜色
    number: '#79C0FF', // 数字颜色
    boolean: '#56D364', // 布尔值颜色
    null: '#8B949E', // null/undefined颜色
    property: '#D2A8FF', // 对象属性颜色

    // 状态颜色
    success: '#56D364', // 成功状态颜色
    warning: '#E3B341', // 警告状态颜色
    danger: '#F85149', // 危险状态颜色
    infoStatus: '#58A6FF', // 信息状态颜色
  },

  /**
   * 图标配置
   */
  icons: {
    debug: ICONS.DEBUG,
    info: ICONS.INFO,
    warn: ICONS.WARN,
    error: ICONS.ERROR,
    group: ICONS.GROUP,
    groupEnd: ICONS.GROUP_END,
    table: ICONS.TABLE,
    trace: '🔍',
    time: '⏱️',
    assert: '❗',
    custom: '🔧',
  },

  /**
   * 字体配置
   */
  fonts: {
    primary: 'Menlo, Monaco, Consolas, "Courier New", monospace',
    size: '12px',
    lineHeight: 1.5,
  },

  /**
   * 样式配置
   */
  styles: {
    // 日志级别样式
    debug: {
      color: '#8cb4ff',
      fontWeight: 'normal',
    },
    info: {
      color: '#7dd3fc',
      fontWeight: 'normal',
    },
    warn: {
      color: '#fcd34d',
      fontWeight: 'bold',
    },
    error: {
      color: '#f87171',
      fontWeight: 'bold',
    },

    // 组件样式
    badge: {
      padding: '2px 4px',
      borderRadius: '3px',
      fontWeight: 'bold',
      marginRight: '5px',
    },
    timestamp: {
      color: '#a1a1aa',
      fontWeight: 'normal',
      marginRight: '5px',
    },
    group: {
      marginLeft: '10px',
      borderLeft: '2px solid #4b5563',
      paddingLeft: '5px',
    },
    table: {
      border: '1px solid #4b5563',
      borderCollapse: 'collapse',
      backgroundColor: '#2a2a2a',
    },
    tableHeader: {
      backgroundColor: '#374151',
      fontWeight: 'bold',
      borderBottom: '1px solid #4b5563',
      color: '#e4e4e7',
    },
    tableCell: {
      padding: '3px 5px',
      borderBottom: '1px solid #4b5563',
      color: '#e4e4e7',
    },
    stack: {
      color: '#94a3b8',
      fontStyle: 'italic',
      marginTop: '5px',
      marginBottom: '5px',
    },
    // 新增：对象属性样式
    property: {
      color: '#D2A8FF', // 属性名颜色
      fontWeight: 400,
    },
    // 新增：字符串值样式
    string: {
      color: '#A5D6FF',
      fontStyle: 'normal',
    },
    // 新增：数字值样式
    number: {
      color: '#79C0FF',
      fontWeight: 400,
    },
  },

  /**
   * 格式化配置
   */
  format: {
    timestamp: 'HH:mm:ss',
    maxArrayLength: 100,
    maxStringLength: 10000,
    maxObjectDepth: 3,
    maxTableRows: 100,
    maxTableColumns: 10,
    maxTableCellWidth: 30,
  },

  /**
   * 动画配置
   */
  animations: {
    enabled: true,
    duration: '0.3s',
    newLogFade: true,
    groupToggle: true,
  },

  /**
   * 暗色模式特定配置
   */
  darkMode: {
    enabled: true,
    reduceMotion: false, // 是否减少动画，可根据系统偏好设置
    highContrast: false, // 是否启用高对比度模式
    saveEyesight: true, // 护眼模式
  },
};

/**
 * 获取环境特定的暗色主题配置
 * @returns {Object} 环境特定的暗色主题配置
 */
function getEnvironmentSpecificTheme() {
  // 使用环境检测模块获取环境调整后的主题
  return themeEnvironment.getEnvironmentAdjustedTheme(darkTheme);
}

/**
 * 确保暗色主题颜色对比度
 * @param {Object} theme - 暗色主题配置
 * @returns {Object} 调整后的暗色主题配置
 */
function ensureDarkThemeContrast(theme) {
  const adjustedTheme = { ...theme };
  const backgroundColor = theme.colors.background;
  const minContrast = 4.5; // WCAG AA 标准

  // 调整文本颜色对比度
  adjustedTheme.colors.text = colorUtils.ensureContrast(
    theme.colors.text,
    backgroundColor,
    minContrast,
  );

  // 调整日志级别颜色对比度
  adjustedTheme.colors.debug = colorUtils.ensureContrast(
    theme.colors.debug,
    backgroundColor,
    minContrast,
  );

  adjustedTheme.colors.info = colorUtils.ensureContrast(
    theme.colors.info,
    backgroundColor,
    minContrast,
  );

  adjustedTheme.colors.warn = colorUtils.ensureContrast(
    theme.colors.warn,
    backgroundColor,
    minContrast,
  );

  adjustedTheme.colors.error = colorUtils.ensureContrast(
    theme.colors.error,
    backgroundColor,
    minContrast,
  );

  // 调整时间戳和堆栈颜色对比度
  adjustedTheme.colors.timestamp = colorUtils.ensureContrast(
    theme.colors.timestamp,
    backgroundColor,
    3.0, // 次要文本可以使用稍低的对比度
  );

  adjustedTheme.colors.stack = colorUtils.ensureContrast(
    theme.colors.stack,
    backgroundColor,
    3.0, // 次要文本可以使用稍低的对比度
  );

  // 同步样式中的颜色
  if (adjustedTheme.styles) {
    if (adjustedTheme.styles.debug) {
      adjustedTheme.styles.debug.color = adjustedTheme.colors.debug;
    }
    if (adjustedTheme.styles.info) {
      adjustedTheme.styles.info.color = adjustedTheme.colors.info;
    }
    if (adjustedTheme.styles.warn) {
      adjustedTheme.styles.warn.color = adjustedTheme.colors.warn;
    }
    if (adjustedTheme.styles.error) {
      adjustedTheme.styles.error.color = adjustedTheme.colors.error;
    }
    if (adjustedTheme.styles.timestamp) {
      adjustedTheme.styles.timestamp.color = adjustedTheme.colors.timestamp;
    }
    if (adjustedTheme.styles.stack) {
      adjustedTheme.styles.stack.color = adjustedTheme.colors.stack;
    }
  }

  return adjustedTheme;
}

/**
 * 获取兼容性降级的暗色主题
 * @param {Object} userTheme - 用户提供的主题配置
 * @returns {Object} 处理后的暗色主题配置
 */
function getFallbackDarkTheme(userTheme = {}) {
  const baseTheme = getEnvironmentSpecificTheme();

  // 合并用户主题和默认暗色主题
  const mergedTheme = {
    colors: { ...baseTheme.colors, ...userTheme.colors },
    icons: { ...baseTheme.icons, ...userTheme.icons },
    fonts: { ...baseTheme.fonts, ...userTheme.fonts },
    styles: { ...baseTheme.styles, ...userTheme.styles },
    format: { ...baseTheme.format, ...userTheme.format },
    animations: { ...baseTheme.animations, ...userTheme.animations },
  };

  // 确保对比度符合标准
  return ensureDarkThemeContrast(mergedTheme);
}

/**
 * 生成CSS样式对象
 * @param {Object} theme - 主题配置
 * @returns {Object} CSS样式对象
 */
function generateStyles(theme) {
  return {
    debug: `color: ${theme.colors.debug}; font-family: ${theme.fonts.primary}; font-size: ${theme.fonts.size};`,
    info: `color: ${theme.colors.info}; font-family: ${theme.fonts.primary}; font-size: ${theme.fonts.size};`,
    warn: `color: ${theme.colors.warn}; font-family: ${theme.fonts.primary}; font-size: ${theme.fonts.size}; font-weight: bold;`,
    error: `color: ${theme.colors.error}; font-family: ${theme.fonts.primary}; font-size: ${theme.fonts.size}; font-weight: bold;`,
    timestamp: `color: ${theme.colors.timestamp}; font-family: ${theme.fonts.primary}; font-size: ${theme.fonts.size};`,
    badge: {
      debug: `background-color: ${theme.colors.debug}; color: ${theme.colors.background}; ${
        theme.styles.badge
          ? Object.entries(theme.styles.badge)
              .map(([k, v]) => `${k}: ${v}`)
              .join('; ')
          : ''
      }`,
      info: `background-color: ${theme.colors.info}; color: ${theme.colors.background}; ${
        theme.styles.badge
          ? Object.entries(theme.styles.badge)
              .map(([k, v]) => `${k}: ${v}`)
              .join('; ')
          : ''
      }`,
      warn: `background-color: ${theme.colors.warn}; color: ${theme.colors.background}; ${
        theme.styles.badge
          ? Object.entries(theme.styles.badge)
              .map(([k, v]) => `${k}: ${v}`)
              .join('; ')
          : ''
      }`,
      error: `background-color: ${theme.colors.error}; color: ${theme.colors.background}; ${
        theme.styles.badge
          ? Object.entries(theme.styles.badge)
              .map(([k, v]) => `${k}: ${v}`)
              .join('; ')
          : ''
      }`,
    },
    group: theme.styles.group
      ? Object.entries(theme.styles.group)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ')
      : '',
    table: theme.styles.table
      ? Object.entries(theme.styles.table)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ')
      : '',
    tableHeader: theme.styles.tableHeader
      ? Object.entries(theme.styles.tableHeader)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ')
      : '',
    tableCell: theme.styles.tableCell
      ? Object.entries(theme.styles.tableCell)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ')
      : '',
    stack: `color: ${theme.colors.stack}; ${
      theme.styles.stack
        ? Object.entries(theme.styles.stack)
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ')
        : ''
    }`,
  };
}

/**
 * 暗色主题导出
 */
export default {
  /**
   * 获取暗色主题配置
   * @returns {Object} 暗色主题配置
   */
  getTheme() {
    return ensureDarkThemeContrast(getEnvironmentSpecificTheme());
  },

  /**
   * 获取合并后的暗色主题
   * @param {Object} userTheme - 用户自定义主题
   * @returns {Object} 合并后的暗色主题
   */
  mergeTheme(userTheme) {
    return getFallbackDarkTheme(userTheme);
  },

  /**
   * 获取暗色主题样式
   * @param {Object} [theme] - 主题配置，不提供则使用默认暗色主题
   * @returns {Object} 样式对象
   */
  getStyles(theme) {
    return generateStyles(theme || ensureDarkThemeContrast(getEnvironmentSpecificTheme()));
  },

  /**
   * 获取高对比度暗色主题
   * 针对视觉障碍用户优化的高对比度变体
   * @returns {Object} 高对比度暗色主题
   */
  getHighContrastTheme() {
    const baseTheme = getEnvironmentSpecificTheme();
    const highContrastTheme = { ...baseTheme };

    // 增强对比度
    highContrastTheme.colors = {
      ...baseTheme.colors,
      debug: '#a2c8ff', // 更亮的蓝色
      info: '#a2e9ff', // 更亮的青色
      warn: '#ffe066', // 更亮的黄色
      error: '#ff8080', // 更亮的红色
      text: '#ffffff', // 纯白色文本
      background: '#121212', // 更深的背景色
      border: '#666666', // 更亮的边框
    };

    // 确保对比度符合WCAG AAA标准 (7:1)
    return ensureDarkThemeContrast(highContrastTheme);
  },

  /**
   * 获取减少动画的暗色主题
   * @returns {Object} 减少动画的暗色主题
   */
  getReducedMotionTheme() {
    const theme = getEnvironmentSpecificTheme();
    theme.animations.enabled = false;
    theme.animations.duration = '0s';
    return theme;
  },
};
