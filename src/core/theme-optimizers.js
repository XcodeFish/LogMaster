/**
 * @file 主题优化策略模块
 * @module core/theme-optimizers
 * @author LogMaster
 * @license MIT
 */

import themeEnvironment from './theme-environment.js';

/**
 * 主题优化策略
 */
const themeOptimizers = {
  /**
   * 应用紧凑模式优化
   * @param {Object} theme - 主题配置
   * @returns {Object} 优化后的主题配置
   */
  applyCompactMode(theme) {
    const optimized = { ...theme };

    // 减少内边距和外边距
    if (optimized.styles.badge) {
      optimized.styles.badge.padding = '1px 3px';
      optimized.styles.badge.marginRight = '3px';
    }

    // 减少行高
    if (optimized.fonts) {
      optimized.fonts.lineHeight = 1.2;
    }

    // 减少组间距
    if (optimized.styles.group) {
      optimized.styles.group.marginLeft = '5px';
      optimized.styles.group.paddingLeft = '3px';
    }

    // 减少表格内边距
    if (optimized.styles.tableCell) {
      optimized.styles.tableCell.padding = '1px 3px';
    }

    // 减少堆栈信息边距
    if (optimized.styles.stack) {
      optimized.styles.stack.marginTop = '2px';
      optimized.styles.stack.marginBottom = '2px';
    }

    return optimized;
  },

  /**
   * 应用单色模式优化
   * @param {Object} theme - 主题配置
   * @param {Object} options - 单色模式选项
   * @param {string} options.baseColor - 基础颜色
   * @returns {Object} 优化后的主题配置
   */
  applyMonochromeMode(theme, options = {}) {
    const optimized = { ...theme };
    const baseColor = options.baseColor || '#666666';

    // 使用灰度色阶
    optimized.colors = {
      ...optimized.colors,
      debug: '#999999',
      info: baseColor,
      warn: '#444444',
      error: '#222222',
      timestamp: '#aaaaaa',
      badge: '#888888',
      stack: '#aaaaaa',
      text: '#333333',
      border: '#dddddd',
      muted: '#cccccc',
    };

    // 调整图标为文本符号
    optimized.icons = {
      ...optimized.icons,
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
    };

    return optimized;
  },

  /**
   * 应用打印优化模式
   * @param {Object} theme - 主题配置
   * @returns {Object} 优化后的主题配置
   */
  applyPrintOptimizedMode(theme) {
    const optimized = { ...theme };

    // 使用打印友好的颜色
    optimized.colors = {
      ...optimized.colors,
      debug: '#000000',
      info: '#000000',
      warn: '#000000',
      error: '#000000',
      timestamp: '#666666',
      badge: '#ffffff',
      stack: '#666666',
      background: '#ffffff',
      text: '#000000',
      border: '#cccccc',
      muted: '#666666',
    };

    // 使用打印友好的字体
    if (optimized.fonts) {
      optimized.fonts.primary = 'Times New Roman, serif';
    }

    // 禁用动画
    if (optimized.animations) {
      optimized.animations.enabled = false;
    }

    // 调整徽章样式
    if (optimized.styles.badge) {
      optimized.styles.badge.border = '1px solid #000000';
    }

    return optimized;
  },

  /**
   * 应用阅读优化模式
   * @param {Object} theme - 主题配置
   * @returns {Object} 优化后的主题配置
   */
  applyReadabilityMode(theme) {
    const optimized = { ...theme };

    // 使用更易于阅读的字体
    if (optimized.fonts) {
      optimized.fonts.primary = 'Verdana, Geneva, sans-serif';
      optimized.fonts.size = '14px';
      optimized.fonts.lineHeight = 1.6;
    }

    // 增加对比度
    optimized.colors = {
      ...optimized.colors,
      debug: '#0066cc',
      info: '#006633',
      warn: '#cc6600',
      error: '#cc0000',
      text: '#333333',
      background: '#f8f8f8',
    };

    // 调整间距
    if (optimized.styles.badge) {
      optimized.styles.badge.padding = '2px 6px';
      optimized.styles.badge.marginRight = '8px';
    }

    if (optimized.styles.tableCell) {
      optimized.styles.tableCell.padding = '5px 8px';
    }

    return optimized;
  },

  /**
   * 隐藏视觉元素
   * @param {Object} theme - 主题配置
   * @param {Object} options - 隐藏选项
   * @param {boolean} options.hideIcons - 是否隐藏图标
   * @param {boolean} options.hideBadges - 是否隐藏徽章
   * @param {boolean} options.hideTimestamp - 是否隐藏时间戳
   * @returns {Object} 优化后的主题配置
   */
  hideVisualElements(theme, options = {}) {
    const optimized = { ...theme };

    // 隐藏图标
    if (options.hideIcons) {
      optimized.icons = {
        debug: '',
        info: '',
        warn: '',
        error: '',
        group: '',
        groupEnd: '',
        table: '',
        trace: '',
        time: '',
        assert: '',
        custom: '',
      };
    }

    // 隐藏徽章
    if (options.hideBadges && optimized.styles.badge) {
      optimized.styles.badge.display = 'none';
    }

    // 隐藏时间戳
    if (options.hideTimestamp && optimized.styles.timestamp) {
      optimized.styles.timestamp.display = 'none';
    }

    return optimized;
  },

  /**
   * 应用环境适配优化
   * @param {Object} theme - 主题配置
   * @returns {Object} 优化后的主题配置
   */
  applyEnvironmentAdaptations(theme) {
    let optimized = { ...theme };

    // 检测减少动画偏好
    if (themeEnvironment.browserPrefersReducedMotion()) {
      optimized.animations = {
        ...optimized.animations,
        enabled: false,
        duration: '0s',
      };
    }

    // 检测高对比度偏好
    if (themeEnvironment.browserPrefersHighContrast()) {
      optimized = this.applyReadabilityMode(optimized);

      // 进一步提高对比度
      optimized.colors.debug = '#0000ff';
      optimized.colors.info = '#008000';
      optimized.colors.warn = '#ff8000';
      optimized.colors.error = '#ff0000';
      optimized.colors.text = '#000000';
      optimized.colors.background = '#ffffff';
    }

    return optimized;
  },

  /**
   * 应用多个优化策略
   * @param {Object} theme - 主题配置
   * @param {Object} options - 优化选项
   * @returns {Object} 优化后的主题配置
   */
  applyOptimizations(theme, options = {}) {
    let optimized = { ...theme };

    // 应用选定的优化策略
    if (options.compact) {
      optimized = this.applyCompactMode(optimized);
    }

    if (options.monochrome) {
      optimized = this.applyMonochromeMode(optimized, {
        baseColor: options.monochromeBaseColor,
      });
    }

    if (options.printOptimized) {
      optimized = this.applyPrintOptimizedMode(optimized);
    }

    if (options.readabilityOptimized) {
      optimized = this.applyReadabilityMode(optimized);
    }

    // 隐藏视觉元素
    optimized = this.hideVisualElements(optimized, {
      hideIcons: options.hideIcons,
      hideBadges: options.hideBadges,
      hideTimestamp: options.hideTimestamp,
    });

    // 应用环境适配
    if (options.adaptToEnvironment !== false) {
      optimized = this.applyEnvironmentAdaptations(optimized);
    }

    return optimized;
  },
};

export default themeOptimizers;
