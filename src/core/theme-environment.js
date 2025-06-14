/**
 * @file 主题环境检测模块
 * @module core/theme-environment
 * @author LogMaster
 * @license MIT
 */

import { environmentDetector } from './utils.js';

/**
 * 主题环境检测工具
 */
const themeEnvironment = {
  /**
   * 检测浏览器环境颜色支持
   * @returns {boolean} 是否支持彩色输出
   */
  browserSupportsColors() {
    if (!environmentDetector.isBrowser()) return false;
    return !!(window.chrome || (window.console && (console.firebug || console.exception)));
  },

  /**
   * 检测浏览器暗色模式偏好
   * @returns {boolean} 是否偏好暗色模式
   */
  browserPrefersDarkMode() {
    if (!environmentDetector.isBrowser()) return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  },

  /**
   * 检测浏览器减少动画偏好
   * @returns {boolean} 是否偏好减少动画
   */
  browserPrefersReducedMotion() {
    if (!environmentDetector.isBrowser()) return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  },

  /**
   * 检测浏览器高对比度偏好
   * @returns {boolean} 是否偏好高对比度
   */
  browserPrefersHighContrast() {
    if (!environmentDetector.isBrowser()) return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches);
  },

  /**
   * 检测Node.js环境颜色支持
   * @returns {boolean} 是否支持彩色输出
   */
  nodeSupportsColors() {
    if (!environmentDetector.isNode()) return false;
    return !!(
      process.env.FORCE_COLOR !== '0' &&
      (process.env.FORCE_COLOR || (process.stdout && process.stdout.isTTY))
    );
  },

  /**
   * 获取环境特定的主题调整
   * @param {Object} baseTheme - 基础主题配置
   * @returns {Object} 环境调整后的主题配置
   */
  getEnvironmentAdjustedTheme(baseTheme) {
    const theme = { ...baseTheme };

    // 浏览器环境特定配置
    if (environmentDetector.isBrowser()) {
      if (!this.browserSupportsColors()) {
        // 降级为简单颜色方案
        theme.colors = {
          ...theme.colors,
          debug: 'blue',
          info: 'green',
          warn: 'orange',
          error: 'red',
          timestamp: 'gray',
          badge: 'lightgray',
          stack: 'gray',
        };
      }

      if (this.browserPrefersDarkMode()) {
        // 自动调整为暗色模式友好的颜色
        theme.colors.background = '#1e1e1e';
        theme.colors.text = '#f0f0f0';
        theme.colors.border = '#444444';
        theme.colors.highlight = '#2a2a2a';
      }

      if (this.browserPrefersReducedMotion()) {
        // 减少或禁用动画
        theme.animations = {
          ...theme.animations,
          enabled: false,
          duration: '0s',
        };
      }
    }

    // Node.js环境特定配置
    if (environmentDetector.isNode()) {
      if (!this.nodeSupportsColors()) {
        // 移除所有颜色
        Object.keys(theme.colors).forEach(key => {
          theme.colors[key] = '';
        });

        // 使用ASCII字符替代图标
        theme.icons = {
          debug: '[D]',
          info: '[I]',
          warn: '[W]',
          error: '[E]',
          group: '[+]',
          groupEnd: '[-]',
          table: '[T]',
          trace: '[>]',
          time: '[t]',
          assert: '[!]',
          custom: '[*]',
        };
      }
    }

    return theme;
  },
};

export default themeEnvironment;
