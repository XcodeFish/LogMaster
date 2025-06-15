/* eslint-disable indent */
/**
 * @file 简约主题定义
 * @module themes/minimal
 * @author LogMaster
 * @license MIT
 */

import themeOptimizers from '../core/theme-optimizers.js';

/**
 * 简约主题基础配置
 * @type {Object}
 */
const minimalThemeBase = {
  /**
   * 基础颜色配置 - 使用灰度色阶为主
   */
  colors: {
    debug: '#888888',
    info: '#555555',
    warn: '#444444',
    error: '#222222',
    timestamp: '#aaaaaa',
    badge: '#777777',
    stack: '#999999',
    background: '#ffffff',
    text: '#333333',
    border: '#eeeeee',
    muted: '#bbbbbb',
    highlight: '#f5f5f5',
  },

  /**
   * 图标配置 - 使用简单文本符号
   */
  icons: {
    debug: '›',
    info: '•',
    warn: '!',
    error: '×',
    group: '▸',
    groupEnd: '▾',
    table: '≡',
    trace: '→',
    time: '◷',
    assert: '‼',
    custom: '⚙',
  },

  /**
   * 字体配置 - 使用简洁无衬线字体
   */
  fonts: {
    primary: 'Consolas, monospace',
    size: '12px',
    lineHeight: 1.4,
  },

  /**
   * 样式配置 - 极简样式
   */
  styles: {
    // 日志级别样式
    debug: {
      color: '#888888',
      fontWeight: 'normal',
    },
    info: {
      color: '#555555',
      fontWeight: 'normal',
    },
    warn: {
      color: '#444444',
      fontWeight: 'normal',
    },
    error: {
      color: '#222222',
      fontWeight: 'bold',
    },

    // 组件样式
    badge: {
      padding: '1px 3px',
      borderRadius: '2px',
      fontWeight: 'normal',
      marginRight: '4px',
    },
    timestamp: {
      color: '#aaaaaa',
      fontWeight: 'normal',
      marginRight: '4px',
      fontSize: '10px',
    },
    group: {
      marginLeft: '8px',
      borderLeft: '1px solid #eeeeee',
      paddingLeft: '4px',
    },
    table: {
      border: '1px solid #eeeeee',
      borderCollapse: 'collapse',
    },
    tableHeader: {
      backgroundColor: '#f8f8f8',
      fontWeight: 'normal',
      borderBottom: '1px solid #eeeeee',
    },
    tableCell: {
      padding: '2px 4px',
      borderBottom: '1px solid #eeeeee',
    },
    stack: {
      color: '#999999',
      fontStyle: 'normal',
      marginTop: '4px',
      marginBottom: '4px',
      fontSize: '10px',
    },
  },

  /**
   * 格式化配置 - 简洁格式
   */
  format: {
    timestamp: 'HH:mm:ss',
    maxArrayLength: 50,
    maxStringLength: 5000,
    maxObjectDepth: 2,
    maxTableRows: 50,
    maxTableColumns: 5,
    maxTableCellWidth: 20,
  },

  /**
   * 动画配置 - 最小化动画
   */
  animations: {
    enabled: true,
    duration: '0.2s',
    newLogFade: false,
    groupToggle: true,
  },
};

/**
 * 简约主题导出
 */
const minimalThemeExport = {
  /**
   * 获取简约主题配置
   * @param {Object} options - 主题选项
   * @param {boolean} options.compact - 是否使用紧凑模式
   * @param {boolean} options.monochrome - 是否使用单色模式
   * @param {string} options.monochromeBaseColor - 单色模式基础颜色
   * @param {boolean} options.printOptimized - 是否优化打印
   * @param {boolean} options.readabilityOptimized - 是否优化阅读
   * @param {boolean} options.hideIcons - 是否隐藏图标
   * @param {boolean} options.hideBadges - 是否隐藏徽章
   * @param {boolean} options.hideTimestamp - 是否隐藏时间戳
   * @param {boolean} options.adaptToEnvironment - 是否适应环境
   * @returns {Object} 主题配置
   */
  getTheme(options = {}) {
    // 使用优化策略应用用户选项
    const theme = themeOptimizers.applyOptimizations(minimalThemeBase, options);

    // 添加简约主题特有属性
    theme.simplifyOutput = true;
    theme.reduceVisualNoise = true;

    return theme;
  },

  /**
   * 获取合并后的主题
   * @param {Object} userTheme - 用户自定义主题
   * @returns {Object} 合并后的主题
   */
  mergeTheme(userTheme) {
    if (!userTheme || typeof userTheme !== 'object') {
      return this.getTheme();
    }

    // 获取基本主题
    const baseTheme = this.getTheme();

    // 特别处理颜色属性，确保用户提供的颜色不被覆盖
    const colors = userTheme.colors
      ? { ...baseTheme.colors, ...userTheme.colors }
      : baseTheme.colors;

    // 合并其他属性，保留简约主题的特有属性
    return {
      ...baseTheme,
      ...userTheme,
      colors, // 确保颜色正确合并
      simplifyOutput: true, // 确保简约主题特性不被覆盖
      reduceVisualNoise: true,
    };
  },

  /**
   * 获取主题样式
   * @param {Object} theme - 主题配置
   * @returns {Object} 样式对象
   */
  getStyles(theme) {
    const themeToUse = theme || this.getTheme();

    return {
      debug: `color: ${themeToUse.colors.debug}; font-family: ${themeToUse.fonts.primary}; font-size: ${themeToUse.fonts.size};`,
      info: `color: ${themeToUse.colors.info}; font-family: ${themeToUse.fonts.primary}; font-size: ${themeToUse.fonts.size};`,
      warn: `color: ${themeToUse.colors.warn}; font-family: ${themeToUse.fonts.primary}; font-size: ${themeToUse.fonts.size};`,
      error: `color: ${themeToUse.colors.error}; font-family: ${themeToUse.fonts.primary}; font-size: ${themeToUse.fonts.size}; font-weight: bold;`,
      timestamp: `color: ${themeToUse.colors.timestamp}; font-family: ${themeToUse.fonts.primary}; font-size: ${themeToUse.fonts.size};`,
      badge: {
        debug: `background-color: ${themeToUse.colors.debug}; color: white; ${
          themeToUse.styles.badge
            ? Object.entries(themeToUse.styles.badge)
                .map(([k, v]) => `${k}: ${v}`)
                .join('; ')
            : ''
        }`,
        info: `background-color: ${themeToUse.colors.info}; color: white; ${
          themeToUse.styles.badge
            ? Object.entries(themeToUse.styles.badge)
                .map(([k, v]) => `${k}: ${v}`)
                .join('; ')
            : ''
        }`,
        warn: `background-color: ${themeToUse.colors.warn}; color: white; ${
          themeToUse.styles.badge
            ? Object.entries(themeToUse.styles.badge)
                .map(([k, v]) => `${k}: ${v}`)
                .join('; ')
            : ''
        }`,
        error: `background-color: ${themeToUse.colors.error}; color: white; ${
          themeToUse.styles.badge
            ? Object.entries(themeToUse.styles.badge)
                .map(([k, v]) => `${k}: ${v}`)
                .join('; ')
            : ''
        }`,
      },
      group: themeToUse.styles.group
        ? Object.entries(themeToUse.styles.group)
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ')
        : '',
      table: themeToUse.styles.table
        ? Object.entries(themeToUse.styles.table)
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ')
        : '',
      tableHeader: themeToUse.styles.tableHeader
        ? Object.entries(themeToUse.styles.tableHeader)
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ')
        : '',
      tableCell: themeToUse.styles.tableCell
        ? Object.entries(themeToUse.styles.tableCell)
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ')
        : '',
      stack: `color: ${themeToUse.colors.stack}; ${
        themeToUse.styles.stack
          ? Object.entries(themeToUse.styles.stack)
              .map(([k, v]) => `${k}: ${v}`)
              .join('; ')
          : ''
      }`,
    };
  },
};

// 同时支持 ESM 和 CommonJS
export default minimalThemeExport;

// 兼容 CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = minimalThemeExport;
}
