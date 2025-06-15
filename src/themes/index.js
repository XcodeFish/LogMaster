/**
 * @file 主题系统索引
 * @module themes
 * @author LogMaster
 * @license MIT
 */

import defaultTheme from './default.js';
import darkTheme from './dark.js';
import minimalTheme from './minimal.js';
import { THEMES } from '../core/constants.js';

/**
 * 主题系统
 * @type {Object}
 */
const themes = {
  /**
   * 主题集合
   */
  default: defaultTheme,
  dark: darkTheme,
  minimal: minimalTheme,

  /**
   * 获取主题
   * @param {string} name - 主题名称
   * @returns {Object|null} 主题对象或null
   */
  getTheme(name) {
    if (!name || typeof name !== 'string') {
      return defaultTheme.getTheme();
    }

    const themeName = name.toLowerCase();

    // 检查是否为内置主题
    if (themeName === 'default') {
      return defaultTheme.getTheme();
    } else if (themeName === 'dark') {
      return darkTheme.getTheme();
    } else if (themeName === 'minimal') {
      return minimalTheme.getTheme();
    }

    // 检查常量中的主题
    const themeKey = name.toUpperCase();
    if (Object.prototype.hasOwnProperty.call(THEMES, themeKey)) {
      return THEMES[themeKey];
    }

    return null;
  },

  /**
   * 合并主题
   * @param {Object} userTheme - 用户自定义主题
   * @param {string} [baseThemeName='default'] - 基础主题名称
   * @returns {Object} 合并后的主题
   */
  mergeTheme(userTheme, baseThemeName = 'default') {
    // 检查参数有效性
    if (!userTheme || typeof userTheme !== 'object') {
      return this.getTheme(baseThemeName);
    }

    // 根据基础主题名称选择合适的主题合并器
    if (baseThemeName.toLowerCase() === 'dark') {
      return darkTheme.mergeTheme(userTheme);
    } else if (baseThemeName.toLowerCase() === 'minimal') {
      return minimalTheme.mergeTheme(userTheme);
    }

    // 默认使用默认主题合并
    return defaultTheme.mergeTheme(userTheme);
  },

  /**
   * 生成主题样式
   * @param {Object|string} theme - 主题配置或主题名称
   * @returns {Object} 样式对象
   */
  generateStyles(theme) {
    if (typeof theme === 'string') {
      const themeObj = this.getTheme(theme);
      if (themeObj) {
        return defaultTheme.getStyles(themeObj);
      }
    }

    return defaultTheme.getStyles(theme);
  },

  /**
   * 获取兼容性主题
   * @param {string|Object} theme - 主题名称或主题对象
   * @returns {Object} 兼容性主题对象
   */
  getCompatTheme(theme) {
    if (!theme) {
      return defaultTheme.getCompatTheme();
    }

    if (typeof theme === 'string') {
      const themeName = theme.toLowerCase();

      if (themeName === 'dark') {
        return darkTheme.getCompatTheme();
      } else if (themeName === 'minimal') {
        return minimalTheme.getCompatTheme();
      }

      const themeObj = this.getTheme(theme);
      return themeObj || defaultTheme.getCompatTheme();
    }

    if (typeof theme === 'object' && theme !== null) {
      return defaultTheme.mergeTheme(theme);
    }

    return defaultTheme.getCompatTheme();
  },
};

export default themes;
