/**
 * @file 颜色工具模块
 * @module core/color-utils
 * @author LogMaster
 * @license MIT
 */

/**
 * 颜色工具
 */
const colorUtils = {
  /**
   * 解析十六进制颜色为RGB
   * @param {string} hex - 十六进制颜色值
   * @returns {Object} RGB对象
   */
  hexToRgb(hex) {
    // 移除#前缀
    const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;

    // 处理简写形式 (#fff -> #ffffff)
    /* eslint-disable indent */
    const fullHex =
      cleanHex.length === 3
        ? cleanHex
            .split('')
            .map(c => c + c)
            .join('')
        : cleanHex;
    /* eslint-enable indent */

    // 转换为RGB
    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);

    return { r, g, b };
  },

  /**
   * 将RGB转换为十六进制颜色
   * @param {number} r - 红色值 (0-255)
   * @param {number} g - 绿色值 (0-255)
   * @param {number} b - 蓝色值 (0-255)
   * @returns {string} 十六进制颜色值
   */
  rgbToHex(r, g, b) {
    /* eslint-disable indent */
    return (
      '#' +
      [r, g, b]
        .map(x => {
          const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
    /* eslint-enable indent */
  },

  /**
   * 计算颜色亮度
   * @param {Object} rgb - RGB对象
   * @returns {number} 亮度值 (0-1)
   */
  calculateLuminance(rgb) {
    // 转换为sRGB
    const srgb = {
      r: rgb.r / 255,
      g: rgb.g / 255,
      b: rgb.b / 255,
    };

    // 应用gamma校正
    const gammaCorrected = {
      r: srgb.r <= 0.03928 ? srgb.r / 12.92 : Math.pow((srgb.r + 0.055) / 1.055, 2.4),
      g: srgb.g <= 0.03928 ? srgb.g / 12.92 : Math.pow((srgb.g + 0.055) / 1.055, 2.4),
      b: srgb.b <= 0.03928 ? srgb.b / 12.92 : Math.pow((srgb.b + 0.055) / 1.055, 2.4),
    };

    // 计算相对亮度
    return 0.2126 * gammaCorrected.r + 0.7152 * gammaCorrected.g + 0.0722 * gammaCorrected.b;
  },

  /**
   * 计算两个颜色之间的对比度
   * @param {string} color1 - 第一个十六进制颜色
   * @param {string} color2 - 第二个十六进制颜色
   * @returns {number} 对比度比值
   */
  calculateContrast(color1, color2) {
    const lum1 = this.calculateLuminance(this.hexToRgb(color1));
    const lum2 = this.calculateLuminance(this.hexToRgb(color2));

    // 确保亮度较高的值在前面
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    // 计算对比度
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * 调整颜色亮度
   * @param {string} color - 十六进制颜色
   * @param {number} factor - 亮度调整因子 (正数变亮，负数变暗)
   * @returns {string} 调整后的十六进制颜色
   */
  adjustBrightness(color, factor) {
    const rgb = this.hexToRgb(color);

    // 调整RGB值
    const adjusted = {
      r: rgb.r + factor * 255,
      g: rgb.g + factor * 255,
      b: rgb.b + factor * 255,
    };

    return this.rgbToHex(adjusted.r, adjusted.g, adjusted.b);
  },

  /**
   * 调整颜色饱和度
   * @param {string} color - 十六进制颜色
   * @param {number} factor - 饱和度调整因子 (0-2, 1为原值)
   * @returns {string} 调整后的十六进制颜色
   */
  adjustSaturation(color, factor) {
    const rgb = this.hexToRgb(color);

    // 转换为HSL
    const hsl = this._rgbToHsl(rgb.r, rgb.g, rgb.b);

    // 调整饱和度
    const newS = Math.max(0, Math.min(1, hsl.s * factor));

    // 如果是灰色，直接返回
    if (newS === 0) {
      return this.rgbToHex(hsl.l * 255, hsl.l * 255, hsl.l * 255);
    }

    // 计算新的RGB
    const adjustedRgb = this._hslToRgb(hsl.h, newS, hsl.l);
    return this.rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
  },

  /**
   * 确保颜色对比度达到指定值
   * @param {string} foreground - 前景色
   * @param {string} background - 背景色
   * @param {number} targetContrast - 目标对比度
   * @returns {string} 调整后的前景色
   */
  ensureContrast(foreground, background, targetContrast) {
    let currentContrast = this.calculateContrast(foreground, background);
    let adjustedForeground = foreground;

    // 如果对比度不足，调整前景色
    if (currentContrast < targetContrast) {
      // 确定是需要变亮还是变暗
      const fgLum = this.calculateLuminance(this.hexToRgb(foreground));
      const bgLum = this.calculateLuminance(this.hexToRgb(background));

      const step = 0.01;
      const factor = fgLum > bgLum ? step : -step;

      // 逐步调整亮度直到达到目标对比度
      while (currentContrast < targetContrast) {
        adjustedForeground = this.adjustBrightness(adjustedForeground, factor);
        currentContrast = this.calculateContrast(adjustedForeground, background);

        // 防止无限循环
        if (
          factor > 0 &&
          this.hexToRgb(adjustedForeground).r >= 255 &&
          this.hexToRgb(adjustedForeground).g >= 255 &&
          this.hexToRgb(adjustedForeground).b >= 255
        ) {
          break;
        }

        if (
          factor < 0 &&
          this.hexToRgb(adjustedForeground).r <= 0 &&
          this.hexToRgb(adjustedForeground).g <= 0 &&
          this.hexToRgb(adjustedForeground).b <= 0
        ) {
          break;
        }
      }
    }

    return adjustedForeground;
  },

  /**
   * 从RGB转换为HSL (辅助方法)
   * @param {number} r - 红色值 (0-255)
   * @param {number} g - 绿色值 (0-255)
   * @param {number} b - 蓝色值 (0-255)
   * @returns {Object} HSL对象
   * @private
   */
  _rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h /= 6;
    }

    return { h, s, l };
  },

  /**
   * 从HSL转换为RGB (辅助方法)
   * @param {number} h - 色相 (0-1)
   * @param {number} s - 饱和度 (0-1)
   * @param {number} l - 亮度 (0-1)
   * @returns {Object} RGB对象
   * @private
   */
  _hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // 灰色
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  },
};

export default colorUtils;
