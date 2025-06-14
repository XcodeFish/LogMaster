/* eslint-disable indent */
/**
 * @file 默认主题定义
 * @module themes/default
 * @author LogMaster
 * @license MIT
 */

import { COLORS, ICONS } from '../core/constants.js';
import themeEnvironment from '../core/theme-environment.js';

/**
 * 默认主题配置
 * @type {Object}
 */
const defaultTheme = {
  /**
   * 基础颜色配置
   */
  colors: {
    debug: COLORS.DEBUG,
    info: COLORS.INFO,
    warn: COLORS.WARN,
    error: COLORS.ERROR,
    timestamp: COLORS.TIMESTAMP,
    badge: COLORS.BADGE,
    stack: COLORS.STACK,
    background: '#ffffff',
    text: '#333333',
    border: '#e0e0e0',
    muted: '#999999',
    highlight: '#f8f8f8',
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
      color: COLORS.DEBUG,
      fontWeight: 'normal',
    },
    info: {
      color: COLORS.INFO,
      fontWeight: 'normal',
    },
    warn: {
      color: COLORS.WARN,
      fontWeight: 'bold',
    },
    error: {
      color: COLORS.ERROR,
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
      color: COLORS.TIMESTAMP,
      fontWeight: 'normal',
      marginRight: '5px',
    },
    group: {
      marginLeft: '10px',
      borderLeft: `2px solid ${COLORS.BADGE}`,
      paddingLeft: '5px',
    },
    table: {
      border: `1px solid ${COLORS.BADGE}`,
      borderCollapse: 'collapse',
    },
    tableHeader: {
      backgroundColor: '#f5f5f5',
      fontWeight: 'bold',
      borderBottom: `1px solid ${COLORS.BADGE}`,
    },
    tableCell: {
      padding: '3px 5px',
      borderBottom: `1px solid ${COLORS.BADGE}`,
    },
    stack: {
      color: COLORS.STACK,
      fontStyle: 'italic',
      marginTop: '5px',
      marginBottom: '5px',
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
};

/**
 * 获取环境特定的主题配置
 * @returns {Object} 环境特定的主题配置
 */
function getEnvironmentSpecificTheme() {
  // 使用环境检测模块获取环境调整后的主题
  return themeEnvironment.getEnvironmentAdjustedTheme(defaultTheme);
}

/**
 * 获取兼容性降级的主题
 * @param {Object} userTheme - 用户提供的主题配置
 * @returns {Object} 处理后的主题配置
 */
function getFallbackTheme(userTheme = {}) {
  const baseTheme = getEnvironmentSpecificTheme();

  // 合并用户主题和默认主题
  const mergedTheme = {
    colors: { ...baseTheme.colors, ...userTheme.colors },
    icons: { ...baseTheme.icons, ...userTheme.icons },
    fonts: { ...baseTheme.fonts, ...userTheme.fonts },
    styles: { ...baseTheme.styles, ...userTheme.styles },
    format: { ...baseTheme.format, ...userTheme.format },
    animations: { ...baseTheme.animations, ...userTheme.animations },
  };

  // 确保基本颜色存在（兼容旧版本）
  if (!mergedTheme.debug && mergedTheme.colors.debug) {
    mergedTheme.debug = mergedTheme.colors.debug;
  }
  if (!mergedTheme.info && mergedTheme.colors.info) {
    mergedTheme.info = mergedTheme.colors.info;
  }
  if (!mergedTheme.warn && mergedTheme.colors.warn) {
    mergedTheme.warn = mergedTheme.colors.warn;
  }
  if (!mergedTheme.error && mergedTheme.colors.error) {
    mergedTheme.error = mergedTheme.colors.error;
  }
  if (!mergedTheme.timestamp && mergedTheme.colors.timestamp) {
    mergedTheme.timestamp = mergedTheme.colors.timestamp;
  }
  if (!mergedTheme.badge && mergedTheme.colors.badge) {
    mergedTheme.badge = mergedTheme.colors.badge;
  }

  return mergedTheme;
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
      debug: `background-color: ${theme.colors.debug}; color: white; ${
        theme.styles.badge
          ? Object.entries(theme.styles.badge)
              .map(([k, v]) => `${k}: ${v}`)
              .join('; ')
          : ''
      }`,
      info: `background-color: ${theme.colors.info}; color: white; ${
        theme.styles.badge
          ? Object.entries(theme.styles.badge)
              .map(([k, v]) => `${k}: ${v}`)
              .join('; ')
          : ''
      }`,
      warn: `background-color: ${theme.colors.warn}; color: white; ${
        theme.styles.badge
          ? Object.entries(theme.styles.badge)
              .map(([k, v]) => `${k}: ${v}`)
              .join('; ')
          : ''
      }`,
      error: `background-color: ${theme.colors.error}; color: white; ${
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
 * 默认主题导出
 */
export default {
  /**
   * 获取默认主题配置
   * @returns {Object} 默认主题配置
   */
  getTheme() {
    return getEnvironmentSpecificTheme();
  },

  /**
   * 获取合并后的主题
   * @param {Object} userTheme - 用户自定义主题
   * @returns {Object} 合并后的主题
   */
  mergeTheme(userTheme) {
    return getFallbackTheme(userTheme);
  },

  /**
   * 获取主题样式
   * @param {Object} [theme] - 主题配置，不提供则使用默认主题
   * @returns {Object} 样式对象
   */
  getStyles(theme) {
    return generateStyles(theme || getEnvironmentSpecificTheme());
  },

  /**
   * 获取简化的兼容主题
   * 用于旧版本兼容
   * @returns {Object} 简化的主题对象
   */
  getCompatTheme() {
    const theme = getEnvironmentSpecificTheme();
    return {
      debug: theme.colors.debug,
      info: theme.colors.info,
      warn: theme.colors.warn,
      error: theme.colors.error,
      timestamp: theme.colors.timestamp,
      badge: theme.colors.badge,
      stack: theme.colors.stack,
    };
  },
};
