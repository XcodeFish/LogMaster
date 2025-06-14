/**
 * @file 工具函数模块
 * @module utils
 * @author LogMaster
 * @license MIT
 */

/**
 * 类型检测工具
 */
export const typeCheckers = {
  /**
   * 检查是否为对象
   * @param {*} obj - 待检查的值
   * @returns {boolean} 是否为对象
   */
  isObject: obj => obj !== null && typeof obj === 'object' && !Array.isArray(obj),

  /**
   * 检查是否为数组
   * @param {*} obj - 待检查的值
   * @returns {boolean} 是否为数组
   */
  isArray: obj => Array.isArray(obj),

  /**
   * 检查是否为函数
   * @param {*} obj - 待检查的值
   * @returns {boolean} 是否为函数
   */
  isFunction: obj => typeof obj === 'function',

  /**
   * 检查是否为字符串
   * @param {*} obj - 待检查的值
   * @returns {boolean} 是否为字符串
   */
  isString: obj => typeof obj === 'string',

  /**
   * 检查是否为数字
   * @param {*} obj - 待检查的值
   * @returns {boolean} 是否为数字
   */
  isNumber: obj => typeof obj === 'number' && !isNaN(obj),

  /**
   * 检查是否为布尔值
   * @param {*} obj - 待检查的值
   * @returns {boolean} 是否为布尔值
   */
  isBoolean: obj => typeof obj === 'boolean',

  /**
   * 检查是否为undefined
   * @param {*} obj - 待检查的值
   * @returns {boolean} 是否为undefined
   */
  isUndefined: obj => obj === undefined,

  /**
   * 检查是否为null
   * @param {*} obj - 待检查的值
   * @returns {boolean} 是否为null
   */
  isNull: obj => obj === null,

  /**
   * 检查是否为Error对象
   * @param {*} obj - 待检查的值
   * @returns {boolean} 是否为Error对象
   */
  isError: obj => obj instanceof Error,

  /**
   * 检查是否为Date对象
   * @param {*} obj - 待检查的值
   * @returns {boolean} 是否为Date对象
   */
  isDate: obj => obj instanceof Date,

  /**
   * 检查值是否为空 (null, undefined, 空字符串, 空数组, 空对象)
   * @param {*} value - 待检查的值
   * @returns {boolean} 是否为空
   */
  isEmpty: value => {
    if (value == null) return true;
    if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
    if (value instanceof Map || value instanceof Set) return value.size === 0;
    if (typeCheckers.isObject(value)) return Object.keys(value).length === 0;
    return false;
  },

  /**
   * 检查是否为有效的URL
   * @param {string} str - 待检查的字符串
   * @returns {boolean} 是否为有效URL
   */
  isValidUrl: str => {
    if (!typeCheckers.isString(str)) return false;
    try {
      new URL(str);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * 检查是否为纯对象 (使用对象字面量或Object构造函数创建)
   * @param {*} obj - 待检查的值
   * @returns {boolean} 是否为纯对象
   */
  isPlainObject: obj => {
    if (!obj || typeof obj !== 'object') return false;
    const proto = Object.getPrototypeOf(obj);
    return proto === null || proto === Object.prototype;
  },
};

/**
 * 深度合并对象
 * @param {Object} target - 目标对象
 * @param {Object} source - 源对象
 * @param {Object} [options] - 合并选项
 * @param {boolean} [options.concatArrays=false] - 是否合并数组而非替换
 * @param {boolean} [options.overwriteWithNull=false] - null值是否覆盖现有值
 * @returns {Object} 合并后的对象
 */
export const deepMerge = (target, source, options = {}, seen = new WeakMap()) => {
  const { concatArrays = false, overwriteWithNull = false } = options;

  // 如果source不是对象，直接返回target
  if (!typeCheckers.isObject(source)) {
    return target;
  }

  // 如果target不是对象，初始化为空对象
  if (!typeCheckers.isObject(target)) {
    target = {};
  }

  // 检测循环引用
  if (seen.has(source)) {
    return seen.get(source);
  }
  seen.set(source, target);

  // 遍历源对象的所有属性
  Object.keys(source).forEach(key => {
    const targetValue = target[key];
    const sourceValue = source[key];

    // 如果source值为null且选项不允许null覆盖，则跳过
    if (sourceValue === null && !overwriteWithNull && targetValue !== undefined) {
      return;
    }

    // 检测循环引用
    if (sourceValue === source) {
      target[key] = target;
      return;
    }

    // 递归合并对象
    if (typeCheckers.isObject(sourceValue) && typeCheckers.isObject(targetValue)) {
      target[key] = deepMerge(targetValue, sourceValue, options, seen);
    }
    // 处理数组，根据选项决定连接还是替换
    else if (Array.isArray(sourceValue)) {
      if (Array.isArray(targetValue) && concatArrays) {
        target[key] = [...targetValue, ...sourceValue];
      } else {
        target[key] = [...sourceValue];
      }
    }
    // 简单值直接替换
    else if (sourceValue !== undefined) {
      target[key] = sourceValue;
    }
  });

  return target;
};

/**
 * 环境检测工具
 */
export const environmentDetector = {
  /**
   * 检测是否为浏览器环境
   * @returns {boolean} 是否为浏览器环境
   */
  isBrowser: () => typeof window !== 'undefined' && typeof document !== 'undefined',

  /**
   * 检测是否为Node.js环境
   * @returns {boolean} 是否为Node.js环境
   */
  isNode: () =>
    typeof process !== 'undefined' && process.versions != null && process.versions.node != null,

  /**
   * 检测是否为React Native环境
   * @returns {boolean} 是否为React Native环境
   */
  isReactNative: () => typeof navigator !== 'undefined' && navigator.product === 'ReactNative',

  /**
   * 检测是否为开发环境
   * @returns {boolean} 是否为开发环境
   */
  isDevelopment: () => {
    if (environmentDetector.isNode()) {
      return process.env.NODE_ENV !== 'production';
    }
    // 浏览器环境下可以根据域名、特殊标记等判断
    return (
      environmentDetector.isBrowser() &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.indexOf('.local') !== -1)
    );
  },

  /**
   * 获取当前环境类型
   * @returns {string} 环境类型 ('browser', 'node', 'react-native', 'unknown')
   */
  getEnvironmentType: () => {
    if (environmentDetector.isBrowser()) return 'browser';
    if (environmentDetector.isNode()) return 'node';
    if (environmentDetector.isReactNative()) return 'react-native';
    return 'unknown';
  },

  /**
   * 获取浏览器信息
   * @returns {Object|null} 浏览器信息对象或null（如果不在浏览器环境中）
   */
  getBrowserInfo: () => {
    if (!environmentDetector.isBrowser()) return null;

    const userAgent = navigator.userAgent;
    const browsers = {
      chrome: /chrome|chromium|crios/i,
      firefox: /firefox|fxios/i,
      safari: /safari/i,
      edge: /edg/i,
      ie: /msie|trident/i,
      opera: /opr/i,
    };

    // 检测浏览器类型
    let browserName = 'unknown';
    Object.keys(browsers).forEach(name => {
      if (browsers[name].test(userAgent)) {
        browserName = name;
      }
    });

    // 由于Chrome包含Safari字符串，需特殊处理
    if (browserName === 'safari' && /chrome|chromium|crios/i.test(userAgent)) {
      browserName = 'chrome';
    }

    return {
      name: browserName,
      userAgent,
      language: navigator.language,
      platform: navigator.platform,
    };
  },
};

/**
 * 错误处理工具
 */
export const errorHandler = {
  /**
   * 包装函数，捕获并处理可能的错误
   * @param {Function} fn - 需要包装的函数
   * @param {Function} errorHandler - 错误处理函数
   * @returns {Function} 包装后的函数
   */
  tryCatch: (fn, errorHandler) =>
    function (...args) {
      try {
        return fn.apply(this, args);
      } catch (error) {
        return errorHandler(error);
      }
    },

  /**
   * 从错误对象中提取关键信息
   * @param {Error} error - 错误对象
   * @returns {Object} 包含错误关键信息的对象
   */
  extractErrorInfo: error => {
    if (!error) return { message: 'Unknown error' };

    return {
      name: error.name || 'Error',
      message: error.message || 'An unknown error occurred',
      stack: error.stack || '',
      code: error.code || undefined,
      fileName: error.fileName || undefined,
      lineNumber: error.lineNumber || undefined,
      columnNumber: error.columnNumber || undefined,
    };
  },

  /**
   * 清理错误堆栈信息，移除不必要的内部堆栈信息
   * @param {string} stack - 错误堆栈字符串
   * @returns {string} 清理后的堆栈信息
   */
  cleanStackTrace: stack => {
    if (!stack) return '';

    return stack
      .split('\n')
      .filter(line => !line.includes('node_modules/') && !line.includes('internal/'))
      .join('\n');
  },

  /**
   * 创建自定义错误类
   * @param {string} name - 错误类名称
   * @param {string} [defaultMessage=''] - 默认错误消息
   * @returns {ErrorClass} 自定义错误类
   */
  createCustomError: (name, defaultMessage = '') => {
    class CustomError extends Error {
      constructor(message = defaultMessage, options = {}) {
        super(message);
        this.name = name;
        Object.keys(options).forEach(key => {
          this[key] = options[key];
        });

        // 确保正确的堆栈跟踪
        if (Error.captureStackTrace) {
          Error.captureStackTrace(this, this.constructor);
        }
      }
    }

    return CustomError;
  },

  /**
   * 延迟重试函数执行
   * @param {Function} fn - 要执行的函数
   * @param {Object} options - 重试选项
   * @param {number} [options.maxRetries=3] - 最大重试次数
   * @param {number} [options.delay=1000] - 重试延迟(ms)
   * @param {Function} [options.shouldRetry] - 决定是否应该重试的函数
   * @returns {Promise<*>} 函数执行结果
   */
  retryWithDelay: async (fn, options = {}) => {
    const { maxRetries = 3, delay = 1000, shouldRetry = () => true } = options;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(attempt);
      } catch (error) {
        lastError = error;

        if (attempt >= maxRetries || !shouldRetry(error, attempt)) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  },
};

/**
 * 字符串处理工具
 */
export const stringUtils = {
  /**
   * 截断字符串
   * @param {string} str - 要截断的字符串
   * @param {number} maxLength - 最大长度
   * @param {string} suffix - 后缀
   * @returns {string} 截断后的字符串
   */
  truncate: (str, maxLength = 100, suffix = '...') => {
    if (!typeCheckers.isString(str)) {
      str = String(str);
    }

    if (str.length <= maxLength) {
      return str;
    }

    return str.substring(0, maxLength) + suffix;
  },

  /**
   * 使字符串首字母大写
   * @param {string} str - 输入字符串
   * @returns {string} 首字母大写的字符串
   */
  capitalize: str => {
    if (!str || !typeCheckers.isString(str)) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * 格式化模板字符串，替换占位符
   * @param {string} template - 模板字符串，如 "Hello, {name}!"
   * @param {Object} data - 数据对象，如 { name: "World" }
   * @returns {string} 格式化后的字符串
   */
  format: (template, data) => {
    if (!template) return '';

    return template.replace(/{([^{}]*)}/g, (match, key) => {
      const value = data[key];
      return value === undefined ? match : String(value);
    });
  },

  /**
   * 去除字符串中的HTML标签
   * @param {string} html - 包含HTML的字符串
   * @returns {string} 纯文本内容
   */
  stripHtml: html => {
    if (!html || !typeCheckers.isString(html)) return '';
    return html.replace(/<[^>]*>/g, '');
  },

  /**
   * 转义HTML特殊字符
   * @param {string} str - 需要转义的字符串
   * @returns {string} 转义后的字符串
   */
  escapeHtml: str => {
    if (!str || !typeCheckers.isString(str)) return '';
    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return str.replace(/[&<>"']/g, match => htmlEntities[match]);
  },

  /**
   * 生成指定长度的随机字符串
   * @param {number} [length=8] - 字符串长度
   * @param {string} [charset='alphanumeric'] - 字符集类型: 'alphanumeric', 'alpha', 'numeric', 'hex'
   * @returns {string} 生成的随机字符串
   */
  randomString: (length = 8, charset = 'alphanumeric') => {
    let chars;
    switch (charset) {
      case 'alpha':
        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        break;
      case 'numeric':
        chars = '0123456789';
        break;
      case 'hex':
        chars = '0123456789abcdef';
        break;
      case 'alphanumeric':
      default:
        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    }

    let result = '';
    const charactersLength = chars.length;

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  },
};

/**
 * 安全的JSON操作
 */
export const safeJSON = {
  /**
   * 安全的JSON.parse
   * @param {string} str - JSON字符串
   * @param {*} defaultValue - 解析失败时的默认值
   * @returns {*} 解析结果或默认值
   */
  parse: (str, defaultValue = {}) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return defaultValue;
    }
  },

  /**
   * 安全的JSON.stringify
   * @param {*} obj - 要序列化的对象
   * @param {Function} replacer - 替换函数或数组
   * @param {number|string} space - 缩进
   * @returns {string} JSON字符串或空字符串（如果序列化失败）
   */
  stringify: (obj, replacer = null, space = 2) => {
    try {
      return JSON.stringify(obj, replacer, space);
    } catch (e) {
      return '';
    }
  },

  /**
   * 序列化对象，处理循环引用
   * @param {*} obj - 要序列化的对象
   * @returns {string} 安全序列化后的字符串
   */
  stringifySafe: obj => {
    const seen = new WeakSet();

    return JSON.stringify(
      obj,
      (key, value) => {
        // 处理特殊对象类型
        if (value === undefined) return '[undefined]';
        if (value === null) return null;
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack,
          };
        }
        if (value instanceof Date) return value.toISOString();
        if (value instanceof RegExp) return value.toString();

        // 处理循环引用
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }

        return value;
      },
      2,
    );
  },

  /**
   * 将对象转换为URL查询字符串
   * @param {Object} obj - 要转换的对象
   * @param {boolean} [skipNulls=true] - 是否跳过null和undefined值
   * @returns {string} URL查询字符串
   */
  toQueryString: (obj, skipNulls = true) => {
    if (!typeCheckers.isObject(obj)) return '';

    return Object.keys(obj)
      .filter(key => !skipNulls || obj[key] != null)
      .map(key => {
        const value = obj[key];
        if (value === null || value === undefined) return `${encodeURIComponent(key)}=`;
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .join('&');
  },

  /**
   * 解析URL查询字符串为对象
   * @param {string} queryString - 要解析的查询字符串
   * @returns {Object} 解析结果
   */
  parseQueryString: queryString => {
    if (!queryString || !typeCheckers.isString(queryString)) return {};

    // 移除开头的'?'
    const cleanQuery = queryString.startsWith('?') ? queryString.substring(1) : queryString;

    // 处理空查询字符串
    if (!cleanQuery) return {};

    return cleanQuery.split('&').reduce((result, part) => {
      const [key, value] = part.split('=').map(decodeURIComponent);
      result[key] = value !== undefined ? value : '';
      return result;
    }, {});
  },
};

/**
 * 颜色处理工具
 */
export const colorUtils = {
  /**
   * 检查颜色是否有效
   * @param {string} color - 颜色值 (十六进制, rgb, rgba)
   * @returns {boolean} 是否有效
   */
  isValidColor: color => {
    if (!color || typeof color !== 'string') return false;

    // 十六进制颜色格式校验 (#fff 或 #ffffff)
    if (color.startsWith('#')) {
      return /^#([0-9A-F]{3}){1,2}$/i.test(color);
    }

    // rgb/rgba格式校验
    if (color.startsWith('rgb')) {
      return /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*\d*\.?\d+\s*)?\)$/i.test(color);
    }

    // 支持命名颜色
    const namedColors = [
      'black',
      'silver',
      'gray',
      'white',
      'maroon',
      'red',
      'purple',
      'fuchsia',
      'green',
      'lime',
      'olive',
      'yellow',
      'navy',
      'blue',
      'teal',
      'aqua',
    ];

    return namedColors.includes(color.toLowerCase());
  },

  /**
   * 将十六进制颜色转换为RGB
   * @param {string} hex - 十六进制颜色值
   * @returns {Object|null} RGB对象 {r, g, b} 或null（如果转换失败）
   */
  hexToRgb: hex => {
    if (!hex || typeof hex !== 'string') return null;

    // 移除#前缀
    hex = hex.replace(/^#/, '');

    // 处理简写形式 (#fff -> #ffffff)
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map(c => c + c)
        .join('');
    }

    // 验证格式
    if (hex.length !== 6) {
      return null;
    }

    // 解析RGB值
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // 验证解析结果
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return null;
    }

    return { r, g, b };
  },

  /**
   * 获取颜色的亮度值
   * @param {string} color - 颜色值
   * @returns {number} 亮度值 (0-255)，-1表示无效颜色
   */
  getLuminance: color => {
    const rgb = colorUtils.hexToRgb(color);
    if (!rgb) return -1;

    // 使用感知亮度公式: (0.299*R + 0.587*G + 0.114*B)
    return Math.round(rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114);
  },

  /**
   * 判断是否应该使用暗色文本（基于背景色亮度）
   * @param {string} backgroundColor - 背景颜色
   * @returns {boolean} 是否应该使用暗色文本
   */
  shouldUseDarkText: backgroundColor => {
    const luminance = colorUtils.getLuminance(backgroundColor);
    // 如果亮度值大于128，使用暗色文本
    return luminance > 128;
  },

  /**
   * RGB转换为十六进制颜色
   * @param {number} r - 红色 (0-255)
   * @param {number} g - 绿色 (0-255)
   * @param {number} b - 蓝色 (0-255)
   * @returns {string} 十六进制颜色
   */
  rgbToHex: (r, g, b) => {
    // 确保RGB值在有效范围内
    r = Math.max(0, Math.min(255, Math.round(r)));
    g = Math.max(0, Math.min(255, Math.round(g)));
    b = Math.max(0, Math.min(255, Math.round(b)));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  },

  /**
   * 调整颜色亮度
   * @param {string} hex - 十六进制颜色
   * @param {number} amount - 调整量 (-100到100)
   * @returns {string} 调整后的颜色
   */
  adjustBrightness: (hex, amount) => {
    const rgb = colorUtils.hexToRgb(hex);
    if (!rgb) return hex;

    // 限制调整量在-100到100之间
    amount = Math.max(-100, Math.min(100, amount));

    // 亮度增加时，向白色调整；减少时，向黑色调整
    const adjustColor = c => {
      if (amount > 0) {
        // 向白色调整 (增加亮度)
        return Math.round(c + ((255 - c) * amount) / 100);
      }
      // 向黑色调整 (减少亮度)
      return Math.round(c * (1 + amount / 100));
    };

    return colorUtils.rgbToHex(adjustColor(rgb.r), adjustColor(rgb.g), adjustColor(rgb.b));
  },
};

/**
 * 日期处理工具
 */
export const dateUtils = {
  /**
   * 格式化日期
   * @param {Date|string|number} date - 日期对象、时间戳或日期字符串
   * @param {string} [format='YYYY-MM-DD HH:mm:ss'] - 格式字符串
   * @returns {string} 格式化后的日期字符串
   */
  format: (date, format = 'YYYY-MM-DD HH:mm:ss') => {
    // 确保date是Date对象
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    // 如果日期无效，返回空字符串
    if (isNaN(date.getTime())) {
      return '';
    }

    const padZero = num => String(num).padStart(2, '0');

    const tokens = {
      YYYY: date.getFullYear(),
      MM: padZero(date.getMonth() + 1),
      DD: padZero(date.getDate()),
      HH: padZero(date.getHours()),
      mm: padZero(date.getMinutes()),
      ss: padZero(date.getSeconds()),
      SSS: String(date.getMilliseconds()).padStart(3, '0'),
    };

    return format.replace(/YYYY|MM|DD|HH|mm|ss|SSS/g, match => tokens[match]);
  },

  /**
   * 获取相对时间描述
   * @param {Date|string|number} date - 日期对象、时间戳或日期字符串
   * @param {Date} [now=new Date()] - 当前日期，默认为现在
   * @returns {string} 相对时间描述
   */
  getRelativeTime: (date, now = new Date()) => {
    // 确保date是Date对象
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    // 如果日期无效，返回空字符串
    if (isNaN(date.getTime())) {
      return '';
    }

    const diff = now.getTime() - date.getTime();
    const seconds = Math.abs(Math.floor(diff / 1000));
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    const prefix = diff < 0 ? '还有' : '';
    const suffix = diff < 0 ? '' : '前';

    if (seconds < 60) return `${prefix}刚刚${suffix}`;
    if (minutes < 60) return `${prefix}${minutes}分钟${suffix}`;
    if (hours < 24) return `${prefix}${hours}小时${suffix}`;
    if (days < 30) return `${prefix}${days}天${suffix}`;
    if (months < 12) return `${prefix}${months}个月${suffix}`;
    return `${prefix}${years}年${suffix}`;
  },
};
