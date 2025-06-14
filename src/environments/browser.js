/**
 * @file 浏览器环境适配器
 * @module environments/browser
 * @author LogMaster Team
 * @license MIT
 */

/**
 * 检测浏览器是否支持颜色
 * @private
 * @returns {boolean} 是否支持颜色
 */
function _detectColorSupport() {
  // 检查CSS API支持
  if (
    typeof window !== 'undefined' &&
    typeof window.CSS !== 'undefined' &&
    CSS.supports &&
    CSS.supports('color', 'var(--color)')
  ) {
    return true;
  }

  // 检查匹配媒体查询支持
  if (typeof window !== 'undefined' && typeof window.matchMedia !== 'undefined') {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isLightMode = window.matchMedia('(prefers-color-scheme: light)').matches;
    if (isDarkMode || isLightMode) {
      return true;
    }
  }

  // 默认认为现代浏览器支持颜色
  return typeof window !== 'undefined';
}

/**
 * 使用现代API检测浏览器信息
 * @private
 * @returns {Object|null} 浏览器信息或null（如果检测失败）
 */
function _detectBrowserWithModernAPI() {
  if (typeof navigator === 'undefined' || typeof navigator.userAgentData === 'undefined') {
    return null;
  }

  const result = {
    name: 'unknown',
    version: '0',
    mobile: navigator.userAgentData.mobile,
    userAgent: navigator.userAgent,
    modern: true,
  };

  // 检查brands信息
  const brandInfo = navigator.userAgentData.brands || [];
  for (const brand of brandInfo) {
    if (brand.brand === 'Google Chrome') {
      result.name = 'Chrome';
      result.version = brand.version;
      break;
    } else if (brand.brand === 'Microsoft Edge') {
      result.name = 'Edge';
      result.version = brand.version;
      break;
    } else if (brand.brand.includes('Firefox')) {
      result.name = 'Firefox';
      result.version = brand.version;
      break;
    } else if (brand.brand.includes('Safari')) {
      result.name = 'Safari';
      result.version = brand.version;
      break;
    }
  }

  return result.name !== 'unknown' ? result : null;
}

/**
 * 检测移动设备
 * @private
 * @param {string} userAgent - 用户代理字符串
 * @returns {boolean} 是否为移动设备
 */
function _detectMobileDevice(userAgent) {
  if (!userAgent) return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

/**
 * 基于现代浏览器特性检测浏览器信息
 * @private
 * @param {string} userAgent - 用户代理字符串
 * @returns {Object} 浏览器信息对象
 */
function _detectBrowserWithFeatures(userAgent) {
  const result = {
    name: 'unknown',
    version: '0',
    mobile: _detectMobileDevice(userAgent),
    userAgent: userAgent,
    modern: true,
  };

  // 使用特性检测判断现代浏览器
  if (typeof window !== 'undefined') {
    const hasIntersectionObserver = 'IntersectionObserver' in window;
    const hasResizeObserver = 'ResizeObserver' in window;

    result.modern = hasIntersectionObserver && hasResizeObserver;

    // 通过UA和特性组合判断浏览器类型
    if (userAgent.indexOf('Firefox') > -1) {
      result.name = 'Firefox';
      result.version = _extractVersion(userAgent, /Firefox\/(\d+\.\d+)/);
    } else if (userAgent.indexOf('Edge') > -1 || userAgent.indexOf('Edg/') > -1) {
      result.name = 'Edge';
      result.version =
        _extractVersion(userAgent, /Edge\/(\d+\.\d+)/) ||
        _extractVersion(userAgent, /Edg\/(\d+\.\d+)/);
    } else if (userAgent.indexOf('Chrome') > -1) {
      result.name = 'Chrome';
      result.version = _extractVersion(userAgent, /Chrome\/(\d+\.\d+)/);
    } else if (userAgent.indexOf('Safari') > -1) {
      result.name = 'Safari';
      result.version = _extractVersion(userAgent, /Version\/(\d+\.\d+)/);
    }
  }

  return result;
}

/**
 * 检测传统浏览器信息
 * @private
 * @param {string} userAgent - 用户代理字符串
 * @returns {Object} 浏览器信息对象
 */
function _detectLegacyBrowser(userAgent) {
  const result = {
    name: 'unknown',
    version: '0',
    mobile: _detectMobileDevice(userAgent),
    userAgent: userAgent,
    modern: false,
  };

  if (userAgent.indexOf('Trident/') > -1 || userAgent.indexOf('MSIE') > -1) {
    result.name = 'IE';
    result.version = _extractVersion(userAgent, /(?:MSIE |rv:)(\d+\.\d+)/);
  } else if (userAgent.indexOf('Firefox') > -1) {
    result.name = 'Firefox';
    result.version = _extractVersion(userAgent, /Firefox\/(\d+\.\d+)/);
  } else if (userAgent.indexOf('Chrome') > -1) {
    result.name = 'Chrome';
    result.version = _extractVersion(userAgent, /Chrome\/(\d+\.\d+)/);
  } else if (userAgent.indexOf('Safari') > -1) {
    result.name = 'Safari';
    result.version = _extractVersion(userAgent, /Version\/(\d+\.\d+)/);
  }

  return result;
}

/**
 * 从用户代理字符串中提取版本号
 * @private
 * @param {string} userAgent - 用户代理字符串
 * @param {RegExp} regex - 提取版本的正则表达式
 * @returns {string} 提取的版本号或默认值"0"
 */
function _extractVersion(userAgent, regex) {
  const match = userAgent.match(regex);
  return match && match[1] ? match[1] : '0';
}

/**
 * 浏览器环境适配器
 * 提供浏览器特性检测、控制台API适配、localStorage集成等功能
 */
class BrowserEnvironment {
  /**
   * 创建浏览器环境适配器实例
   * @param {Object} [options={}] - 配置选项
   * @param {string} [options.storageKey='logmaster_config'] - localStorage存储键名
   * @param {boolean} [options.detectFeatures=true] - 是否自动检测浏览器特性
   */
  constructor(options = {}) {
    this._storageKey = options.storageKey || 'logmaster_config';
    this._features = {
      colorSupport: false,
      groupSupport: false,
      tableSupport: false,
      timeSupport: false,
      storageSupport: false,
    };

    this._consoleAPI = {
      log: this._safeConsoleCall('log'),
      info: this._safeConsoleCall('info'),
      warn: this._safeConsoleCall('warn'),
      error: this._safeConsoleCall('error'),
      debug: this._safeConsoleCall('debug'),
      group: null,
      groupCollapsed: null,
      groupEnd: null,
      table: null,
      time: null,
      timeEnd: null,
    };

    if (options.detectFeatures !== false) {
      this.detectFeatures();
    }
  }

  /**
   * 检测浏览器特性和支持的控制台API
   * @returns {Object} 检测到的特性对象
   */
  detectFeatures() {
    // 检查是否在浏览器环境
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

    if (!isBrowser) {
      return this._features;
    }

    // 检测控制台API
    const hasConsole = typeof console !== 'undefined';

    if (hasConsole) {
      // 检测颜色支持
      this._features.colorSupport = _detectColorSupport();

      // 检测分组支持
      this._features.groupSupport =
        typeof console.group === 'function' && typeof console.groupEnd === 'function';

      // 设置分组API
      if (this._features.groupSupport) {
        this._consoleAPI.group = this._safeConsoleCall('group');
        this._consoleAPI.groupCollapsed = this._safeConsoleCall('groupCollapsed');
        this._consoleAPI.groupEnd = this._safeConsoleCall('groupEnd');
      } else {
        // 降级实现
        this._consoleAPI.group = this._groupFallback.bind(this);
        this._consoleAPI.groupCollapsed = this._groupFallback.bind(this);
        this._consoleAPI.groupEnd = this._groupEndFallback.bind(this);
      }

      // 检测表格支持
      this._features.tableSupport = typeof console.table === 'function';

      // 设置表格API
      if (this._features.tableSupport) {
        this._consoleAPI.table = this._safeConsoleCall('table');
      } else {
        this._consoleAPI.table = this._tableFallback.bind(this);
      }

      // 检测计时支持
      this._features.timeSupport =
        typeof console.time === 'function' && typeof console.timeEnd === 'function';

      // 设置计时API
      if (this._features.timeSupport) {
        this._consoleAPI.time = this._safeConsoleCall('time');
        this._consoleAPI.timeEnd = this._safeConsoleCall('timeEnd');
      } else {
        // 使用内部计时器作为降级方案
        this._timers = {};
        this._consoleAPI.time = this._timeFallback.bind(this);
        this._consoleAPI.timeEnd = this._timeEndFallback.bind(this);
      }
    }

    // 检测localStorage支持
    try {
      localStorage.setItem('__logmaster_test__', '1');
      localStorage.removeItem('__logmaster_test__');
      this._features.storageSupport = true;
    } catch (e) {
      this._features.storageSupport = false;
    }

    return this._features;
  }

  /**
   * 获取安全的控制台调用函数
   * @private
   * @param {string} method - 控制台方法名
   * @returns {Function} 安全封装的控制台方法
   */
  _safeConsoleCall(method) {
    return (...args) => {
      if (typeof console !== 'undefined' && typeof console[method] === 'function') {
        try {
          console[method](...args);
        } catch (e) {
          // 降级为基本日志输出
          if (typeof console.log === 'function') {
            console.log(...args);
          }
        }
      }
    };
  }

  /**
   * 控制台分组功能的降级实现
   * @private
   * @param {string} label - 分组标签
   */
  _groupFallback(label) {
    this._consoleAPI.log(`▼ ${label}`);
  }

  /**
   * 控制台结束分组功能的降级实现
   * @private
   */
  _groupEndFallback() {
    this._consoleAPI.log('▲ 分组结束');
  }

  /**
   * 控制台表格功能的降级实现
   * @private
   * @param {Array|Object} data - 表格数据
   * @param {Array} [_columns] - 要显示的列（未使用）
   */
  _tableFallback(data, _columns) {
    if (Array.isArray(data)) {
      data.forEach((row, index) => {
        this._consoleAPI.log(`[${index}]:`, row);
      });
    } else if (data && typeof data === 'object') {
      Object.keys(data).forEach(key => {
        this._consoleAPI.log(`${key}:`, data[key]);
      });
    } else {
      this._consoleAPI.log(data);
    }
  }

  /**
   * 控制台计时功能的降级实现
   * @private
   * @param {string} label - 计时器标签
   */
  _timeFallback(label = 'default') {
    this._timers = this._timers || {};
    this._timers[label] = Date.now();
  }

  /**
   * 控制台计时结束功能的降级实现
   * @private
   * @param {string} label - 计时器标签
   */
  _timeEndFallback(label = 'default') {
    if (this._timers && this._timers[label]) {
      const duration = Date.now() - this._timers[label];
      this._consoleAPI.log(`${label}: ${duration}ms`);
      delete this._timers[label];
    } else {
      this._consoleAPI.warn(`Timer '${label}' does not exist`);
    }
  }

  /**
   * 保存配置到localStorage
   * @param {Object} config - 要保存的配置对象
   * @returns {boolean} 是否保存成功
   */
  saveConfig(config) {
    if (!this._features.storageSupport) {
      return false;
    }

    try {
      const serialized = JSON.stringify(config);
      localStorage.setItem(this._storageKey, serialized);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 从localStorage加载配置
   * @returns {Object|null} 加载的配置对象或null
   */
  loadConfig() {
    if (!this._features.storageSupport) {
      return null;
    }

    try {
      const serialized = localStorage.getItem(this._storageKey);
      return serialized ? JSON.parse(serialized) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * 清除保存的配置
   * @returns {boolean} 是否清除成功
   */
  clearConfig() {
    if (!this._features.storageSupport) {
      return false;
    }

    try {
      localStorage.removeItem(this._storageKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 获取控制台API
   * @returns {Object} 适配后的控制台API
   */
  getConsoleAPI() {
    return this._consoleAPI;
  }

  /**
   * 获取检测到的特性
   * @returns {Object} 浏览器特性对象
   */
  getFeatures() {
    return { ...this._features };
  }

  /**
   * 判断当前是否为生产环境
   * @returns {boolean} 是否为生产环境
   */
  isProduction() {
    // 通过多种方式检测生产环境
    return (
      // 检查常见的环境变量
      (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') ||
      // 检查URL中是否有production相关标记
      (typeof window !== 'undefined' &&
        window.location &&
        (window.location.hostname.indexOf('www.') === 0 ||
          (!window.location.hostname.includes('localhost') &&
            !window.location.hostname.includes('dev') &&
            !window.location.hostname.includes('test')))) ||
      // 检查是否禁用了开发者工具
      (typeof console !== 'undefined' && (console.debug === undefined || console.debug === null))
    );
  }

  /**
   * 获取浏览器信息
   * @returns {Object} 浏览器信息对象
   */
  getBrowserInfo() {
    if (typeof navigator === 'undefined') {
      return { name: 'unknown', version: '0', mobile: false };
    }

    const ua = navigator.userAgent;

    // 尝试使用现代API检测
    const modernResult = _detectBrowserWithModernAPI();
    if (modernResult) {
      return modernResult;
    }

    // 尝试使用特性检测
    const hasModernFeatures =
      typeof IntersectionObserver !== 'undefined' && typeof ResizeObserver !== 'undefined';

    if (hasModernFeatures) {
      return _detectBrowserWithFeatures(ua);
    } else {
      // 降级到传统检测
      return _detectLegacyBrowser(ua);
    }
  }

  /**
   * 增强开发者工具功能
   * @returns {Object} 增强的开发者工具API
   */
  enhanceDevTools() {
    const devTools = {};

    // 只在非生产环境提供开发者工具增强
    if (this.isProduction()) {
      return devTools;
    }

    // 创建自定义控制台标记样式
    devTools.createCustomStyle = (label, bgColor, textColor) => {
      const styles = [
        `background: ${bgColor}`,
        `color: ${textColor}`,
        'padding: 2px 4px',
        'border-radius: 2px',
        'font-weight: bold',
      ].join(';');

      return {
        label,
        log: (...args) => console.log(`%c${label}`, styles, ...args),
        info: (...args) => console.info(`%c${label}`, styles, ...args),
        warn: (...args) => console.warn(`%c${label}`, styles, ...args),
        error: (...args) => console.error(`%c${label}`, styles, ...args),
      };
    };

    // 提供性能标记辅助工具
    const perfMarks = {};

    devTools.perf = {
      mark: name => {
        perfMarks[name] = performance.now();
        if (typeof performance !== 'undefined' && performance.mark) {
          performance.mark(`logmaster-${name}-start`);
        }
      },

      measure: (name, startMark) => {
        if (!perfMarks[startMark]) {
          console.warn(`性能标记 '${startMark}' 不存在`);
          return 0;
        }

        const duration = performance.now() - perfMarks[startMark];

        if (typeof performance !== 'undefined' && performance.measure) {
          try {
            performance.measure(`logmaster-${name}`, `logmaster-${startMark}-start`);
          } catch (e) {
            // 忽略测量错误
          }
        }

        delete perfMarks[startMark];
        return duration;
      },

      logMeasure: (name, startMark) => {
        const duration = devTools.perf.measure(name, startMark);
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
        return duration;
      },
    };

    // 提供DOM元素检查辅助方法
    devTools.inspect = selector => {
      if (typeof document === 'undefined') return null;

      try {
        const el = document.querySelector(selector);
        if (el) {
          console.log('🔍 检查元素:', el);
          return el;
        } else {
          console.warn(`未找到元素: ${selector}`);
          return null;
        }
      } catch (e) {
        console.error('元素检查错误:', e);
        return null;
      }
    };

    return devTools;
  }

  /**
   * 为网络请求添加日志记录功能
   * 通过拦截fetch和XHR提供网络日志功能
   * @returns {Function} 恢复原始实现的函数
   */
  enableNetworkLogging() {
    // 只在非生产环境启用网络日志记录
    if (this.isProduction() || typeof window === 'undefined') {
      return () => {}; // 返回空函数
    }

    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    // 拦截fetch请求
    window.fetch = async (url, options = {}) => {
      const startTime = Date.now();
      console.log(`🌐 Fetch 请求: ${url}`, options);

      try {
        const response = await originalFetch(url, options);
        const duration = Date.now() - startTime;

        console.log(`✅ Fetch 完成 (${duration}ms): ${url}`, {
          status: response.status,
          statusText: response.statusText,
          headers: Array.from(response.headers.entries()),
        });

        // 克隆响应以不影响原始数据流
        // 确保返回的是原始响应的完整克隆
        return response.clone();
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ Fetch 错误 (${duration}ms): ${url}`, error);
        throw error;
      }
    };

    // 拦截XHR请求
    XMLHttpRequest.prototype.open = function (...args) {
      this._logMasterUrl = args[1] || 'unknown';
      this._logMasterMethod = args[0] || 'GET';
      return originalXHROpen.apply(this, args);
    };

    XMLHttpRequest.prototype.send = function (data) {
      const xhr = this;
      const startTime = Date.now();

      console.log(`🌐 XHR ${xhr._logMasterMethod} 请求: ${xhr._logMasterUrl}`, data || '');

      xhr.addEventListener('load', () => {
        const duration = Date.now() - startTime;
        console.log(`✅ XHR 完成 (${duration}ms): ${xhr._logMasterUrl}`, {
          status: xhr.status,
          statusText: xhr.statusText,
          responseType: xhr.responseType,
          responseHeaders: xhr.getAllResponseHeaders(),
        });
      });

      xhr.addEventListener('error', () => {
        const duration = Date.now() - startTime;
        console.error(`❌ XHR 错误 (${duration}ms): ${xhr._logMasterUrl}`);
      });

      xhr.addEventListener('abort', () => {
        const duration = Date.now() - startTime;
        console.warn(`⚠️ XHR 中止 (${duration}ms): ${xhr._logMasterUrl}`);
      });

      return originalXHRSend.apply(xhr, arguments);
    };

    // 返回恢复函数
    return () => {
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
      XMLHttpRequest.prototype.send = originalXHRSend;
    };
  }
}

export default BrowserEnvironment;
