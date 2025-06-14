/**
 * @file 简约主题测试
 * @module tests/minimal-theme
 * @author LogMaster
 * @license MIT
 */

import { expect } from 'chai';
import sinon from 'sinon';
import minimalTheme from '../src/themes/minimal.js';
import { environmentDetector } from '../src/core/utils.js';

describe('简约主题 (minimal.js)', () => {
  // 在每个测试后恢复所有存根
  afterEach(() => {
    sinon.restore();
  });

  describe('基本功能', () => {
    it('应返回完整的简约主题配置', () => {
      const theme = minimalTheme.getTheme();

      // 验证主题结构
      expect(theme).to.be.an('object');
      expect(theme.colors).to.be.an('object');
      expect(theme.icons).to.be.an('object');
      expect(theme.fonts).to.be.an('object');
      expect(theme.styles).to.be.an('object');
      expect(theme.format).to.be.an('object');
      expect(theme.animations).to.be.an('object');
      expect(theme.minimal).to.be.an('object');

      // 验证简约主题标记
      expect(theme.isMinimal).to.be.true;
    });

    it('应正确合并用户自定义主题', () => {
      const userTheme = {
        colors: {
          debug: '#custom-color',
          background: '#custom-bg',
        },
        fonts: {
          size: '11px',
        },
      };

      const mergedTheme = minimalTheme.mergeTheme(userTheme);

      // 验证自定义属性被正确合并
      expect(mergedTheme.colors.debug).to.equal('#custom-color');
      expect(mergedTheme.colors.background).to.equal('#custom-bg');
      expect(mergedTheme.fonts.size).to.equal('11px');

      // 验证未覆盖的属性保持原样
      expect(mergedTheme.colors.info).to.not.equal(undefined);
      expect(mergedTheme.colors.error).to.not.equal(undefined);
    });

    it('应返回正确的样式对象', () => {
      const styles = minimalTheme.getStyles();

      // 验证样式对象包含所有必要的样式
      expect(styles).to.be.an('object');
      expect(styles.debug).to.be.an('object');
      expect(styles.info).to.be.an('object');
      expect(styles.warn).to.be.an('object');
      expect(styles.error).to.be.an('object');
      expect(styles.badge).to.be.an('object');
      expect(styles.timestamp).to.be.an('object');
    });

    it('应返回简化的兼容主题', () => {
      const compatTheme = minimalTheme.getCompatTheme();

      // 验证兼容主题包含必要的颜色
      expect(compatTheme).to.be.an('object');
      expect(compatTheme.debug).to.be.a('string');
      expect(compatTheme.info).to.be.a('string');
      expect(compatTheme.warn).to.be.a('string');
      expect(compatTheme.error).to.be.a('string');
      expect(compatTheme.timestamp).to.be.a('string');
      expect(compatTheme.badge).to.be.a('string');
      expect(compatTheme.stack).to.be.a('string');
    });
  });

  describe('特殊模式', () => {
    it('应返回紧凑模式简约主题', () => {
      const compactTheme = minimalTheme.getCompactTheme();

      // 验证紧凑模式标记
      expect(compactTheme.minimal.compactMode).to.be.true;

      // 验证紧凑模式特性
      expect(compactTheme.fonts.lineHeight).to.be.lessThan(1.3); // 更紧凑的行高
      expect(compactTheme.styles.badge.padding).to.equal('0 2px'); // 最小化徽章内边距
    });

    it('应返回单色模式简约主题', () => {
      const monochromeTheme = minimalTheme.getMonochromeTheme();

      // 验证单色模式标记
      expect(monochromeTheme.minimal.monochromeMode).to.be.true;

      // 验证颜色都是灰度
      expect(monochromeTheme.colors.debug).to.equal('#606060');
      expect(monochromeTheme.colors.info).to.equal('#404040');
      expect(monochromeTheme.colors.warn).to.equal('#505050');
      expect(monochromeTheme.colors.error).to.equal('#606060');
    });

    it('应返回打印优化版简约主题', () => {
      const printTheme = minimalTheme.getPrintTheme();

      // 验证打印优化版标记
      expect(printTheme.isPrintOptimized).to.be.true;

      // 验证打印优化特性
      expect(printTheme.fonts.size).to.equal('10pt'); // 打印友好的单位
      expect(printTheme.fonts.primary).to.include('Georgia'); // 衬线字体
      expect(printTheme.minimal.monochromeMode).to.be.true; // 单色模式
      expect(printTheme.minimal.hideIcons).to.be.true; // 隐藏图标
    });

    it('应返回阅读优化版简约主题', () => {
      const readabilityTheme = minimalTheme.getReadabilityTheme();

      // 验证阅读优化版标记
      expect(readabilityTheme.isReadabilityOptimized).to.be.true;

      // 验证阅读优化特性
      expect(readabilityTheme.fonts.size).to.equal('14px'); // 更大的字体
      expect(readabilityTheme.fonts.lineHeight).to.equal(1.6); // 更宽松的行高
      expect(readabilityTheme.fonts.primary).to.include('Georgia'); // 衬线字体
      expect(readabilityTheme.colors.background).to.equal('#fcfcf7'); // 暖色背景
    });
  });

  describe('视觉元素控制', () => {
    it('应返回无图标简约主题', () => {
      const noIconsTheme = minimalTheme.getNoIconsTheme();

      // 验证无图标标记
      expect(noIconsTheme.minimal.hideIcons).to.be.true;

      // 验证所有图标为空
      Object.values(noIconsTheme.icons).forEach(icon => {
        expect(icon).to.equal('');
      });
    });

    it('应返回无徽章简约主题', () => {
      const noBadgeTheme = minimalTheme.getNoBadgeTheme();

      // 验证无徽章标记
      expect(noBadgeTheme.minimal.hideBadge).to.be.true;

      // 验证徽章样式被最小化
      expect(noBadgeTheme.styles.badge.padding).to.equal('0');
      expect(noBadgeTheme.styles.badge.border).to.equal('none');
      expect(noBadgeTheme.styles.badge.marginRight).to.equal('0');
    });

    it('应返回无时间戳简约主题', () => {
      const noTimestampTheme = minimalTheme.getNoTimestampTheme();

      // 验证无时间戳标记
      expect(noTimestampTheme.minimal.hideTimestamp).to.be.true;

      // 验证时间戳格式为空
      expect(noTimestampTheme.format.timestamp).to.equal('');
    });
  });

  describe('环境适配', () => {
    it('应检测系统减少动画偏好', () => {
      // 模拟浏览器环境
      sinon.stub(environmentDetector, 'isBrowser').returns(true);

      // 模拟减少动画偏好
      global.window = {
        matchMedia: query => {
          if (query === '(prefers-reduced-motion: reduce)') {
            return { matches: true };
          }
          return { matches: false };
        },
      };

      const theme = minimalTheme.getTheme();

      // 验证动画被禁用
      expect(theme.animations.enabled).to.be.false;
      expect(theme.animations.duration).to.equal('0s');

      // 清理模拟
      delete global.window;
    });
  });

  describe('组合功能', () => {
    it('应支持多种模式组合', () => {
      // 组合紧凑模式和无图标模式
      const combinedTheme = minimalTheme.getTheme({
        compactMode: true,
        hideIcons: true,
      });

      // 验证组合特性
      expect(combinedTheme.minimal.compactMode).to.be.true;
      expect(combinedTheme.minimal.hideIcons).to.be.true;
      expect(combinedTheme.fonts.lineHeight).to.be.lessThan(1.3);
      Object.values(combinedTheme.icons).forEach(icon => {
        expect(icon).to.equal('');
      });
    });

    it('应支持通过自定义主题覆盖模式设置', () => {
      // 通过合并覆盖为非紧凑模式
      const customTheme = minimalTheme.mergeTheme(
        {
          minimal: {
            compactMode: false,
          },
        },
        { compactMode: true },
      );

      // 验证自定义设置优先级更高
      expect(customTheme.minimal.compactMode).to.be.false;
    });
  });
});
