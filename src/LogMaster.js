/**
 * @file LogMaster主类实现
 * @module LogMaster
 * @author LogMaster
 * @license MIT
 */

import { LOG_LEVELS, ENVIRONMENTS, DEFAULT_CONFIG, THEMES } from './core/constants.js';

import { deepMerge, environmentDetector } from './core/utils.js';

/**
 * LogMaster 主类，提供日志管理功能
 * @class LogMaster
 */
class LogMaster {
  /**
   * 创建LogMaster实例
   * @param {Object} [userConfig={}] - 用户配置选项
   * @param {string} [userConfig.environment] - 运行环境，支持'development'、'testing'、'production'
   * @param {number} [userConfig.logLevel] - 日志级别，参考LOG_LEVELS常量
   * @param {boolean} [userConfig.useColors] - 是否使用颜色
   * @param {boolean} [userConfig.showTimestamp] - 是否显示时间戳
   * @param {boolean} [userConfig.showBadge] - 是否显示日志级别标记
   * @param {boolean} [userConfig.stackTraceEnabled] - 是否启用堆栈跟踪
   * @param {number} [userConfig.maxArrayLength] - 数组最大打印长度
   * @param {number} [userConfig.maxStringLength] - 字符串最大打印长度
   * @param {number} [userConfig.stackTraceLimit] - 堆栈跟踪最大深度
   * @param {string} [userConfig.dateFormat] - 日期格式
   * @param {Object} [userConfig.theme] - 主题配置
   */
  constructor(userConfig = {}) {
    // 初始化私有属性
    this._config = {};
    this._environment = null;
    this._logLevel = null;
    this._theme = null;
    this._transports = [];
    this._storage = null;
    this._seen = new WeakSet(); // 用于检测循环引用的WeakSet

    // 初始化配置
    this._initConfig(userConfig);

    // 自动检测环境
    this._detectEnvironment();

    // 初始化存储机制
    this._initStorage();
  }

  /**
   * 初始化配置
   * @private
   * @param {Object} userConfig - 用户配置
   */
  _initConfig(userConfig) {
    // 验证用户配置
    this._validateConfig(userConfig);

    // 合并默认配置与用户配置
    this._config = deepMerge({}, DEFAULT_CONFIG, userConfig);

    // 设置日志级别
    this._logLevel = this._config.LOG_LEVEL;

    // 设置主题
    this._theme = this._config.theme || THEMES.DEFAULT;
  }

  /**
   * 验证用户配置
   * @private
   * @param {Object} config - 用户配置
   * @throws {Error} 如果配置无效则抛出错误
   */
  _validateConfig(config) {
    // 验证环境设置
    if (config.ENVIRONMENT && !Object.values(ENVIRONMENTS).includes(config.ENVIRONMENT)) {
      throw new Error(`无效的环境设置: ${config.ENVIRONMENT}`);
    }

    // 验证日志级别设置
    if (
      config.LOG_LEVEL !== undefined &&
      (typeof config.LOG_LEVEL !== 'number' ||
        config.LOG_LEVEL < LOG_LEVELS.DEBUG ||
        config.LOG_LEVEL > LOG_LEVELS.SILENT)
    ) {
      throw new Error(`无效的日志级别: ${config.LOG_LEVEL}`);
    }

    // 验证日期格式
    if (config.DATE_FORMAT && typeof config.DATE_FORMAT !== 'string') {
      throw new Error('日期格式必须是字符串');
    }

    // 验证其他布尔类型选项
    ['USE_COLORS', 'SHOW_TIMESTAMP', 'SHOW_BADGE', 'STACK_TRACE_ENABLED'].forEach(key => {
      if (config[key] !== undefined && typeof config[key] !== 'boolean') {
        throw new Error(`${key} 必须是布尔类型`);
      }
    });

    // 验证数字类型选项
    ['MAX_ARRAY_LENGTH', 'MAX_STRING_LENGTH', 'STACK_TRACE_LIMIT'].forEach(key => {
      if (config[key] !== undefined && (typeof config[key] !== 'number' || config[key] < 0)) {
        throw new Error(`${key} 必须是非负数值`);
      }
    });

    // 验证主题设置
    if (config.theme && typeof config.theme !== 'object') {
      throw new Error('主题必须是对象类型');
    }
  }

  /**
   * 自动检测运行环境
   * @private
   */
  _detectEnvironment() {
    // 如果用户已经设置环境，则使用用户设置
    if (this._config.ENVIRONMENT) {
      this._environment = this._config.ENVIRONMENT;
      return;
    }

    // 否则自动检测环境
    if (environmentDetector.isNode()) {
      // 在Node.js环境下通过NODE_ENV检测环境
      const nodeEnv = process.env.NODE_ENV || '';

      if (nodeEnv.includes('prod')) {
        this._environment = ENVIRONMENTS.PRODUCTION;
      } else if (nodeEnv.includes('test')) {
        this._environment = ENVIRONMENTS.TESTING;
      } else {
        this._environment = ENVIRONMENTS.DEVELOPMENT;
      }
    } else if (environmentDetector.isBrowser()) {
      // 在浏览器环境下通过域名或URL参数检测环境
      const hostname = window.location.hostname;

      // 通过URL参数判断环境
      const urlParams = new URLSearchParams(window.location.search);
      const envParam = urlParams.get('env');

      if (envParam) {
        if (envParam === 'prod') {
          this._environment = ENVIRONMENTS.PRODUCTION;
        } else if (envParam === 'test') {
          this._environment = ENVIRONMENTS.TESTING;
        } else {
          this._environment = ENVIRONMENTS.DEVELOPMENT;
        }
      } else {
        // 通过域名判断环境
        if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
          this._environment = ENVIRONMENTS.DEVELOPMENT;
        } else if (hostname.includes('test') || hostname.includes('staging')) {
          this._environment = ENVIRONMENTS.TESTING;
        } else {
          this._environment = ENVIRONMENTS.PRODUCTION;
        }
      }
    } else {
      // 默认为开发环境
      this._environment = ENVIRONMENTS.DEVELOPMENT;
    }

    // 根据环境自动调整日志级别
    if (!this._config.LOG_LEVEL) {
      switch (this._environment) {
        case ENVIRONMENTS.PRODUCTION:
          this._logLevel = LOG_LEVELS.ERROR;
          break;
        case ENVIRONMENTS.TESTING:
          this._logLevel = LOG_LEVELS.WARN;
          break;
        default:
          this._logLevel = LOG_LEVELS.DEBUG;
      }
    }
  }

  /**
   * 初始化存储机制
   * @private
   */
  _initStorage() {
    // 根据环境选择合适的存储机制
    if (environmentDetector.isBrowser()) {
      try {
        // 尝试使用localStorage
        if (window.localStorage) {
          this._storage = {
            getItem: key => window.localStorage.getItem(`logmaster_${key}`),
            setItem: (key, value) => window.localStorage.setItem(`logmaster_${key}`, value),
            removeItem: key => window.localStorage.removeItem(`logmaster_${key}`),
          };
        } else {
          // 降级使用内存存储
          this._initMemoryStorage();
        }
      } catch (e) {
        // localStorage可能被禁用，降级使用内存存储
        this._initMemoryStorage();
      }
    } else if (environmentDetector.isNode()) {
      // Node.js环境下初始化内存存储
      this._initMemoryStorage();
    } else {
      // 未知环境下初始化内存存储
      this._initMemoryStorage();
    }

    // 从存储中恢复配置
    this._restoreConfigFromStorage();
  }

  /**
   * 初始化内存存储
   * @private
   */
  _initMemoryStorage() {
    const memoryStore = new Map();

    this._storage = {
      getItem: key => memoryStore.get(`logmaster_${key}`),
      setItem: (key, value) => memoryStore.set(`logmaster_${key}`, value),
      removeItem: key => memoryStore.delete(`logmaster_${key}`),
    };
  }

  /**
   * 从存储中恢复配置
   * @private
   */
  _restoreConfigFromStorage() {
    if (!this._storage) return;

    try {
      // 尝试从存储中读取日志级别
      const storedLogLevel = this._storage.getItem('logLevel');
      if (storedLogLevel !== null && !isNaN(parseInt(storedLogLevel, 10))) {
        this._logLevel = parseInt(storedLogLevel, 10);
      }

      // 尝试从存储中读取主题
      const storedTheme = this._storage.getItem('theme');
      if (storedTheme) {
        try {
          const parsedTheme = JSON.parse(storedTheme);
          if (parsedTheme && typeof parsedTheme === 'object') {
            this._theme = parsedTheme;
          }
        } catch (e) {
          // 解析失败，使用当前主题
        }
      }
    } catch (e) {
      // 恢复配置失败，保持默认配置
      console.error('Failed to restore LogMaster config from storage:', e);
    }
  }

  /**
   * 保存配置到存储
   * @private
   * @param {string} key - 配置键
   * @param {*} value - 配置值
   */
  _saveConfigToStorage(key, value) {
    if (!this._storage) return;

    try {
      if (typeof value === 'object') {
        this._storage.setItem(key, JSON.stringify(value));
      } else {
        this._storage.setItem(key, String(value));
      }
    } catch (e) {
      // 保存配置失败
      console.error('Failed to save LogMaster config to storage:', e);
    }
  }

  /**
   * 设置运行环境
   * @public
   * @param {string} environment - 环境名称，支持 'development'、'testing'、'production'
   * @returns {LogMaster} 返回当前实例，支持链式调用
   * @throws {Error} 如果环境名称无效则抛出错误
   */
  setEnvironment(environment) {
    // 验证环境参数
    if (!Object.values(ENVIRONMENTS).includes(environment)) {
      throw new Error(
        `无效的环境设置: ${environment}。有效值: ${Object.values(ENVIRONMENTS).join(', ')}`,
      );
    }

    // 更新环境设置
    this._environment = environment;
    this._config.ENVIRONMENT = environment;

    // 根据环境自动调整日志级别（仅当未明确设置日志级别时）
    const isLogLevelExplicitlySet = this._storage && this._storage.getItem('logLevel') !== null;
    if (!isLogLevelExplicitlySet) {
      switch (environment) {
        case ENVIRONMENTS.PRODUCTION:
          this._logLevel = LOG_LEVELS.ERROR;
          this._saveConfigToStorage('logLevel', LOG_LEVELS.ERROR);
          break;
        case ENVIRONMENTS.TESTING:
          this._logLevel = LOG_LEVELS.WARN;
          this._saveConfigToStorage('logLevel', LOG_LEVELS.WARN);
          break;
        case ENVIRONMENTS.DEVELOPMENT:
          this._logLevel = LOG_LEVELS.DEBUG;
          this._saveConfigToStorage('logLevel', LOG_LEVELS.DEBUG);
          break;
      }
    }

    // 保存环境设置到存储
    this._saveConfigToStorage('environment', environment);

    // 返回实例以支持链式调用
    return this;
  }

  /**
   * 设置日志级别
   * @public
   * @param {(string|number)} level - 日志级别，可以是数字(0-4)或字符串('DEBUG', 'INFO', 'WARN', 'ERROR', 'SILENT')
   * @returns {LogMaster} 返回当前实例，支持链式调用
   * @throws {Error} 如果日志级别无效则抛出错误
   */
  setLogLevel(level) {
    let numericLevel;

    // 处理字符串类型的日志级别
    if (typeof level === 'string') {
      const upperLevel = level.toUpperCase();
      if (!Object.prototype.hasOwnProperty.call(LOG_LEVELS, upperLevel)) {
        throw new Error(`无效的日志级别: ${level}。有效值: ${Object.keys(LOG_LEVELS).join(', ')}`);
      }
      numericLevel = LOG_LEVELS[upperLevel];
    } else if (typeof level === 'number') {
      // 处理数字类型的日志级别
      if (level < LOG_LEVELS.DEBUG || level > LOG_LEVELS.SILENT) {
        throw new Error(
          `无效的日志级别数值: ${level}。有效范围: ${LOG_LEVELS.DEBUG}-${LOG_LEVELS.SILENT}`,
        );
      }
      numericLevel = level;
    } else {
      throw new Error('日志级别必须是字符串或数字');
    }

    // 更新日志级别
    this._logLevel = numericLevel;
    this._config.LOG_LEVEL = numericLevel;

    // 保存日志级别到存储
    this._saveConfigToStorage('logLevel', numericLevel);

    // 返回实例以支持链式调用
    return this;
  }

  /**
   * 设置日志主题
   * @public
   * @param {(string|Object)} theme - 主题名称（预设主题）或自定义主题对象
   * @returns {LogMaster} 返回当前实例，支持链式调用
   * @throws {Error} 如果主题无效则抛出错误
   */
  setTheme(theme) {
    let themeObject;

    // 处理字符串类型的主题名称
    if (typeof theme === 'string') {
      const themeName = theme.toUpperCase();
      if (!Object.prototype.hasOwnProperty.call(THEMES, themeName)) {
        throw new Error(`未找到预设主题: ${theme}。可用主题: ${Object.keys(THEMES).join(', ')}`);
      }
      themeObject = THEMES[themeName];
    } else if (typeof theme === 'object' && theme !== null) {
      // 处理对象类型的自定义主题
      // 验证主题对象的结构
      this._validateTheme(theme);
      themeObject = theme;
    } else {
      throw new Error('主题必须是字符串(预设主题名称)或对象(自定义主题)');
    }

    // 更新主题
    this._theme = themeObject;
    this._config.theme = themeObject;

    // 保存主题到存储
    this._saveConfigToStorage('theme', themeObject);

    // 返回实例以支持链式调用
    return this;
  }

  /**
   * 验证主题对象的结构
   * @private
   * @param {Object} theme - 主题对象
   * @throws {Error} 如果主题结构无效则抛出错误
   */
  _validateTheme(theme) {
    // 验证必需的颜色属性
    const requiredColors = ['debug', 'info', 'warn', 'error'];
    for (const colorType of requiredColors) {
      if (!theme[colorType] || typeof theme[colorType] !== 'string') {
        throw new Error(`主题必须包含有效的 ${colorType} 颜色属性`);
      }
    }

    // 验证其他可选属性类型
    if (theme.badge && typeof theme.badge !== 'object') {
      throw new Error('主题的 badge 属性必须是对象类型');
    }

    if (theme.timestamp && typeof theme.timestamp !== 'string') {
      throw new Error('主题的 timestamp 属性必须是字符串类型');
    }
  }

  /**
   * 重置所有配置为默认值
   * @public
   * @returns {LogMaster} 返回当前实例，支持链式调用
   */
  resetConfig() {
    // 重置配置为默认值
    this._config = deepMerge({}, DEFAULT_CONFIG);

    // 重置环境（自动检测）
    this._environment = null;
    this._detectEnvironment();

    // 重置日志级别
    this._logLevel = this._config.LOG_LEVEL;

    // 重置主题
    this._theme = THEMES.DEFAULT;

    // 清除存储中的配置
    if (this._storage) {
      this._storage.removeItem('environment');
      this._storage.removeItem('logLevel');
      this._storage.removeItem('theme');
    }

    // 返回实例以支持链式调用
    return this;
  }

  /**
   * 内部日志处理方法
   * @private
   * @param {number} level - 日志级别
   * @param {Array<any>} args - 日志参数
   * @returns {boolean} 是否成功输出日志
   */
  _log(level, args) {
    // 如果当前日志级别高于要输出的级别，则不输出
    if (level < this._logLevel) {
      return false;
    }

    // 如果没有参数，则不输出
    if (!args || args.length === 0) {
      return false;
    }

    try {
      // 获取日志级别对应的方法名和颜色
      const levelInfo = this._getLevelInfo(level);
      if (!levelInfo) {
        return false;
      }

      // 格式化日志内容
      const formattedArgs = this._formatLogArgs(args, levelInfo);

      // 输出到控制台
      this._writeToConsole(levelInfo.method, formattedArgs);

      // 输出到所有传输器
      this._writeToTransports(level, formattedArgs, args);

      return true;
    } catch (err) {
      // 日志处理过程出错，输出错误信息到控制台
      console.error('LogMaster 日志处理错误:', err);
      return false;
    }
  }

  /**
   * 获取日志级别信息
   * @private
   * @param {number} level - 日志级别
   * @returns {Object|null} 日志级别信息对象或null
   */
  _getLevelInfo(level) {
    switch (level) {
      case LOG_LEVELS.DEBUG:
        return { name: 'debug', method: 'debug', color: this._theme.debug, badge: '🔍 DEBUG' };
      case LOG_LEVELS.INFO:
        return { name: 'info', method: 'info', color: this._theme.info, badge: 'ℹ️ INFO' };
      case LOG_LEVELS.WARN:
        return { name: 'warn', method: 'warn', color: this._theme.warn, badge: '⚠️ WARN' };
      case LOG_LEVELS.ERROR:
        return { name: 'error', method: 'error', color: this._theme.error, badge: '❌ ERROR' };
      default:
        return null;
    }
  }

  /**
   * 格式化日志参数
   * @private
   * @param {Array<any>} args - 原始日志参数
   * @param {Object} levelInfo - 日志级别信息
   * @returns {Array<any>} 格式化后的日志参数
   */
  _formatLogArgs(args, levelInfo) {
    const formattedArgs = [...args];

    // 添加时间戳
    if (this._config.SHOW_TIMESTAMP) {
      const timestamp = this._getFormattedTimestamp();
      formattedArgs.unshift(`%c${timestamp}%c`, `color: ${this._theme.timestamp || '#888'}`, '');
    }

    // 添加日志级别标记
    if (this._config.SHOW_BADGE) {
      formattedArgs.unshift(
        `%c${levelInfo.badge}%c`,
        `color: ${levelInfo.color}; font-weight: bold`,
        '',
      );
    }

    // 处理特殊对象（错误、对象等）
    return this._prettyPrint(formattedArgs);
  }

  /**
   * 获取格式化的时间戳
   * @private
   * @returns {string} 格式化后的时间戳
   */
  _getFormattedTimestamp() {
    const now = new Date();
    const format = this._config.DATE_FORMAT || 'HH:MM:SS';

    // 简单的时间格式化
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    return format
      .replace('HH', hours)
      .replace('MM', minutes)
      .replace('SS', seconds)
      .replace('ms', milliseconds);
  }

  /**
   * 美化打印内容
   * @private
   * @param {Array<any>} args - 日志参数
   * @returns {Array<any>} 美化后的日志参数
   */
  _prettyPrint(args) {
    return args.map(arg => {
      // 处理错误对象
      if (arg instanceof Error) {
        return this._formatError(arg);
      }

      // 处理对象和数组
      if (typeof arg === 'object' && arg !== null) {
        return this._formatObject(arg);
      }

      // 直接返回原始值
      return arg;
    });
  }

  /**
   * 格式化错误对象
   * @private
   * @param {Error} error - 错误对象
   * @returns {string} 格式化后的错误信息
   */
  _formatError(error) {
    let result = `${error.name}: ${error.message}`;

    // 添加堆栈信息
    if (this._config.STACK_TRACE_ENABLED && error.stack) {
      const stackLines = error.stack.split('\n').slice(1, this._config.STACK_TRACE_LIMIT + 1);

      result += '\n' + stackLines.map(line => `  ${line.trim()}`).join('\n');
    }

    return result;
  }

  /**
   * 格式化对象
   * @private
   * @param {Object} obj - 要格式化的对象
   * @returns {any} 格式化后的对象
   */
  _formatObject(obj) {
    // 在浏览器环境下，直接返回对象供控制台格式化
    if (environmentDetector.isBrowser()) {
      return obj;
    }

    // 在Node环境下，使用JSON.stringify进行格式化
    try {
      return JSON.stringify(
        obj,
        (key, value) => {
          // 处理循环引用
          if (typeof value === 'object' && value !== null) {
            if (this._seen.has(value)) {
              return '[Circular]';
            }
            this._seen.add(value);
          }
          return value;
        },
        2,
      );
    } catch (e) {
      return `[无法序列化的对象: ${e.message}]`;
    } finally {
      // 清空循环引用检测集合
      this._seen.clear();
    }
  }

  /**
   * 输出到控制台
   * @private
   * @param {string} method - 控制台方法
   * @param {Array<any>} args - 日志参数
   */
  _writeToConsole(method, args) {
    // 如果不使用颜色，移除颜色相关格式化
    if (!this._config.USE_COLORS) {
      args = args.filter(arg => typeof arg !== 'string' || !arg.startsWith('%c'));
    }

    // 输出到控制台
    if (console && typeof console[method] === 'function') {
      console[method](...args);
    } else if (console && typeof console.log === 'function') {
      // 降级到console.log
      console.log(...args);
    }
  }

  /**
   * 输出到所有传输器
   * @private
   * @param {number} level - 日志级别
   * @param {Array<any>} formattedArgs - 格式化后的参数
   * @param {Array<any>} originalArgs - 原始参数
   */
  _writeToTransports(level, formattedArgs, originalArgs) {
    // 跳过传输处理，如果没有传输器
    if (!this._transports || this._transports.length === 0) {
      return;
    }

    // 准备传递给传输器的日志对象
    const logEntry = {
      level,
      timestamp: new Date(),
      formattedArgs,
      originalArgs,
      environment: this._environment,
    };

    // 发送到所有传输器
    for (const transport of this._transports) {
      if (typeof transport.log === 'function') {
        try {
          transport.log(logEntry);
        } catch (e) {
          // 传输错误，输出到控制台但不中断流程
          console.error('LogMaster 传输错误:', e);
        }
      }
    }
  }

  /**
   * 输出调试级别日志
   * @public
   * @param {...any} args - 日志内容
   * @returns {LogMaster} 返回当前实例，支持链式调用
   */
  debug(...args) {
    this._log(LOG_LEVELS.DEBUG, args);
    return this;
  }

  /**
   * 输出信息级别日志
   * @public
   * @param {...any} args - 日志内容
   * @returns {LogMaster} 返回当前实例，支持链式调用
   */
  info(...args) {
    this._log(LOG_LEVELS.INFO, args);
    return this;
  }

  /**
   * 输出警告级别日志
   * @public
   * @param {...any} args - 日志内容
   * @returns {LogMaster} 返回当前实例，支持链式调用
   */
  warn(...args) {
    this._log(LOG_LEVELS.WARN, args);
    return this;
  }

  /**
   * 输出错误级别日志
   * @public
   * @param {...any} args - 日志内容
   * @returns {LogMaster} 返回当前实例，支持链式调用
   */
  error(...args) {
    this._log(LOG_LEVELS.ERROR, args);
    return this;
  }

  /**
   * 输出生产环境错误日志
   * 即使在较高日志级别下也会输出
   * @public
   * @param {...any} args - 日志内容
   * @returns {LogMaster} 返回当前实例，支持链式调用
   */
  prodError(...args) {
    // 在生产环境下，总是输出错误，不管日志级别如何
    if (this._environment === ENVIRONMENTS.PRODUCTION) {
      // 临时存储原日志级别
      const originalLevel = this._logLevel;

      // 临时将日志级别设为ERROR以确保输出
      this._logLevel = LOG_LEVELS.ERROR;

      // 输出错误日志
      this._log(LOG_LEVELS.ERROR, args);

      // 恢复原日志级别
      this._logLevel = originalLevel;
    } else {
      // 非生产环境下，等同于普通错误日志
      this.error(...args);
    }

    return this;
  }

  /**
   * 创建日志分组
   * @public
   * @param {string} label - 分组标签
   * @param {boolean} [collapsed=false] - 是否创建折叠分组
   * @returns {LogMaster} 返回当前实例，支持链式调用
   */
  group(label, collapsed = false) {
    // 如果当前日志级别为静默，不创建分组
    if (this._logLevel === LOG_LEVELS.SILENT) {
      return this;
    }

    try {
      // 根据环境选择合适的分组方法
      if (environmentDetector.isBrowser()) {
        // 浏览器环境使用原生console方法
        const method = collapsed ? 'groupCollapsed' : 'group';

        // 检查浏览器是否支持分组方法
        if (console && typeof console[method] === 'function') {
          console[method](label);
        } else if (console && typeof console.log === 'function') {
          // 降级处理：使用特殊格式的log
          console.log(`%c${collapsed ? '▶' : '▼'} ${label}`, 'font-weight: bold;');
        }
      } else if (environmentDetector.isNode()) {
        // Node环境下使用简单的分组表示
        const indent = this._getGroupIndent();
        console.log(`${indent}${collapsed ? '▶' : '▼'} ${label}`);

        // 增加缩进级别
        this._increaseGroupIndent();
      }

      // 记录分组状态
      this._groupStatus = this._groupStatus || {
        active: true,
        level: 0,
        collapsed: collapsed,
      };
      this._groupStatus.level++;
    } catch (err) {
      // 分组创建失败时，静默降级
      console.error('LogMaster 分组创建失败:', err);
    }

    return this;
  }

  /**
   * 创建折叠的日志分组
   * @public
   * @param {string} label - 分组标签
   * @returns {LogMaster} 返回当前实例，支持链式调用
   */
  groupCollapsed(label) {
    return this.group(label, true);
  }

  /**
   * 结束当前日志分组
   * @public
   * @returns {LogMaster} 返回当前实例，支持链式调用
   */
  groupEnd() {
    // 如果当前日志级别为静默，不处理分组结束
    if (this._logLevel === LOG_LEVELS.SILENT) {
      return this;
    }

    // 如果没有活动分组，不执行操作
    if (!this._groupStatus || !this._groupStatus.active || this._groupStatus.level <= 0) {
      return this;
    }

    try {
      // 根据环境选择合适的分组结束方法
      if (environmentDetector.isBrowser()) {
        // 浏览器环境使用原生console方法
        if (console && typeof console.groupEnd === 'function') {
          console.groupEnd();
        }
      } else if (environmentDetector.isNode()) {
        // Node环境下减少缩进级别
        this._decreaseGroupIndent();
      }

      // 更新分组状态
      this._groupStatus.level--;
      if (this._groupStatus.level <= 0) {
        this._groupStatus.active = false;
        this._groupStatus.level = 0;
      }
    } catch (err) {
      // 分组结束失败时，静默降级
      console.error('LogMaster 分组结束失败:', err);
    }

    return this;
  }

  /**
   * 获取当前分组的缩进字符串
   * @private
   * @returns {string} 缩进字符串
   */
  _getGroupIndent() {
    const level = this._groupStatus && this._groupStatus.active ? this._groupStatus.level : 0;
    return '  '.repeat(level);
  }

  /**
   * 增加分组缩进级别
   * @private
   */
  _increaseGroupIndent() {
    if (!this._groupStatus) {
      this._groupStatus = { active: true, level: 1, collapsed: false };
    } else {
      this._groupStatus.level++;
      this._groupStatus.active = true;
    }
  }

  /**
   * 减少分组缩进级别
   * @private
   */
  _decreaseGroupIndent() {
    if (this._groupStatus && this._groupStatus.level > 0) {
      this._groupStatus.level--;
      if (this._groupStatus.level <= 0) {
        this._groupStatus.active = false;
        this._groupStatus.level = 0;
      }
    }
  }

  /**
   * 以表格形式显示数据
   * @public
   * @param {Array|Object} data - 要显示的数据（数组或对象）
   * @param {Array} [columns] - 要显示的列名数组（可选）
   * @returns {LogMaster} 返回当前实例，支持链式调用
   */
  table(data, columns) {
    // 如果当前日志级别高于INFO，不显示表格
    if (this._logLevel > LOG_LEVELS.INFO) {
      return this;
    }

    // 数据验证
    if (!data || typeof data !== 'object') {
      this.warn('table方法需要一个对象或数组作为参数');
      return this;
    }

    try {
      // 在浏览器环境中使用原生console.table
      if (environmentDetector.isBrowser() && console && typeof console.table === 'function') {
        if (columns) {
          console.table(data, columns);
        } else {
          console.table(data);
        }
        return this;
      }

      // 在不支持原生表格的环境中（如Node.js或老旧浏览器）
      // 创建一个简化版表格
      const formattedTable = this._formatTableData(data, columns);
      console.log(formattedTable);
    } catch (err) {
      this.warn('表格数据显示失败', err);
    }

    return this;
  }

  /**
   * 格式化表格数据为字符串
   * @private
   * @param {Array|Object} data - 要格式化的数据
   * @param {Array} [columns] - 要显示的列
   * @returns {string} 格式化后的表格字符串
   */
  _formatTableData(data, columns) {
    // 将数据转换为一致的数组格式
    let items;
    if (Array.isArray(data)) {
      items = data;
    } else {
      items = [];
      const entries = Object.entries(data);
      for (const [key, value] of entries) {
        items.push({
          [Array.isArray(data) ? 'Index' : 'Key']: key,
          Value: this._formatTableValue(value),
        });
      }
    }

    if (items.length === 0) {
      return '(空表)';
    }

    // 确定表格列
    let tableColumns = columns;
    if (!tableColumns) {
      // 如果没有指定列，从数据中提取
      tableColumns =
        Array.isArray(data) && items.length > 0 && typeof items[0] === 'object'
          ? [...new Set(items.flatMap(item => Object.keys(item)))]
          : ['Value'];
    }

    // 根据配置限制列数
    const maxColumns = this._config.MAX_TABLE_COLUMNS || 10;
    if (tableColumns.length > maxColumns) {
      tableColumns = tableColumns.slice(0, maxColumns);
    }

    // 计算每列的最大宽度
    const columnWidths = {};
    tableColumns.forEach(col => {
      // 列名的长度
      columnWidths[col] = col.length;

      // 所有值的最大长度
      items.forEach(item => {
        const value = item[col] !== undefined ? String(item[col]) : '';
        const valueLength = this._getVisualLength(value);
        columnWidths[col] = Math.max(columnWidths[col], valueLength);
      });

      // 限制最大列宽
      const maxWidth = this._config.MAX_TABLE_CELL_WIDTH || 30;
      columnWidths[col] = Math.min(columnWidths[col], maxWidth);
    });

    // 构建表头
    let result = '\n';
    // 表头分隔行
    let header = '| ';
    let separator = '| ';

    tableColumns.forEach(col => {
      const width = columnWidths[col];
      header += col.padEnd(width) + ' | ';
      separator += '-'.repeat(width) + ' | ';
    });

    result += header + '\n' + separator + '\n';

    // 构建表格行
    const maxRows = this._config.MAX_TABLE_ROWS || 100;
    const limitedItems = items.slice(0, maxRows);

    limitedItems.forEach(item => {
      let row = '| ';

      tableColumns.forEach(col => {
        const value =
          item[col] !== undefined
            ? this._truncateForTable(String(item[col]), columnWidths[col])
            : '';
        row += value.padEnd(columnWidths[col]) + ' | ';
      });

      result += row + '\n';
    });

    // 如果有行被截断，添加提示
    if (items.length > maxRows) {
      result += `\n... (截断了 ${items.length - maxRows} 行)`;
    }

    return result;
  }

  /**
   * 获取字符串的可视长度（考虑中文字符）
   * @private
   * @param {string} str - 输入字符串
   * @returns {number} 可视长度
   */
  _getVisualLength(str) {
    let length = 0;
    for (let i = 0; i < str.length; i++) {
      // 中文和其他全角字符计为2个长度
      length += /[\u4e00-\u9fa5]|[\uff00-\uffff]/.test(str[i]) ? 2 : 1;
    }
    return length;
  }

  /**
   * 根据最大宽度截断字符串（用于表格单元格）
   * @private
   * @param {string} str - 输入字符串
   * @param {number} maxWidth - 最大宽度
   * @returns {string} 截断后的字符串
   */
  _truncateForTable(str, maxWidth) {
    if (this._getVisualLength(str) <= maxWidth) {
      return str;
    }

    let result = '';
    let currentLength = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const charLength = /[\u4e00-\u9fa5]|[\uff00-\uffff]/.test(char) ? 2 : 1;

      if (currentLength + charLength > maxWidth - 3) {
        result += '...';
        break;
      }

      result += char;
      currentLength += charLength;
    }

    return result;
  }

  /**
   * 格式化表格单元格值
   * @private
   * @param {any} value - 单元格值
   * @returns {string} 格式化后的字符串
   */
  _formatTableValue(value) {
    if (value === null) {
      return 'null';
    }
    if (value === undefined) {
      return 'undefined';
    }
    if (typeof value === 'function') {
      return '[Function]';
    }
    if (typeof value === 'object') {
      try {
        return (
          JSON.stringify(value).substring(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '')
        );
      } catch (e) {
        return '[Object]';
      }
    }
    return String(value);
  }

  /**
   * 获取当前堆栈跟踪信息
   * @private
   * @param {number} [limit] - 堆栈帧数量限制，默认使用配置中的STACK_TRACE_LIMIT
   * @returns {Array<string>} 堆栈跟踪信息数组
   */
  _getStackTrace(limit) {
    const stackLimit = limit || this._config.STACK_TRACE_LIMIT || 10;

    try {
      // 创建一个错误对象来获取堆栈
      const err = new Error();

      // 获取原始堆栈字符串
      let stack = err.stack || '';

      // 移除第一行（错误消息和错误名称）
      stack = stack.split('\n').slice(1);

      // 过滤掉LogMaster内部的堆栈帧
      stack = stack.filter(line => !line.includes('LogMaster.js'));

      // 规范化堆栈帧格式
      const normalizedStack = stack.map(line => {
        // 尝试提取文件名、行号和列号
        line = line.trim();

        // 移除前缀如 "at "
        if (line.startsWith('at ')) {
          line = line.substring(3);
        }

        return line;
      });

      // 限制堆栈帧数量
      return normalizedStack.slice(0, stackLimit);
    } catch (err) {
      // 堆栈获取失败时返回空数组
      return ['无法获取堆栈信息'];
    }
  }

  /**
   * 打印调用堆栈
   * @public
   * @param {string} [message] - 可选的消息
   * @param {number} [limit] - 堆栈深度限制
   * @returns {LogMaster} 返回当前实例，支持链式调用
   */
  trace(message, limit) {
    // 获取堆栈信息
    const stack = this._getStackTrace(limit);

    // 如果提供了消息，则在堆栈前显示消息
    if (message) {
      this.info(message);
    } else {
      this.info('堆栈跟踪:');
    }

    // 显示堆栈信息
    const formattedStack = stack.map((line, index) => `  ${index + 1}: ${line}`).join('\n');
    console.log(formattedStack);

    return this;
  }

  /**
   * 添加日志传输器
   * @public
   * @param {Object} transport - 传输器对象，必须实现log方法
   * @param {Object} [options] - 传输器配置选项
   * @param {boolean} [options.initialize=true] - 是否初始化传输器
   * @returns {LogMaster} 返回当前实例，支持链式调用
   * @throws {Error} 如果传输器无效或已存在则抛出错误
   */
  addTransport(transport, options = { initialize: true }) {
    // 验证传输器有效性
    if (!this._isValidTransport(transport)) {
      throw new Error('无效的传输器：传输器必须是对象且实现log方法');
    }

    // 确保传输器数组存在
    if (!this._transports) {
      this._transports = [];
    }

    // 检查传输器是否已存在
    if (this._hasTransport(transport)) {
      throw new Error('传输器已存在，每个传输器只能添加一次');
    }

    // 如果传输器没有ID，为其生成一个唯一ID
    if (!transport.id) {
      transport.id = this._generateTransportId();
    }

    // 初始化传输器（如果需要）
    if (options.initialize && typeof transport.init === 'function') {
      try {
        transport.init();
      } catch (err) {
        throw new Error(`传输器初始化失败: ${err.message}`);
      }
    }

    // 添加传输器到列表
    this._transports.push(transport);

    return this;
  }

  /**
   * 移除日志传输器
   * @public
   * @param {Object|string} transportOrId - 传输器对象或传输器ID
   * @param {Object} [options] - 移除选项
   * @param {boolean} [options.destroy=true] - 是否调用传输器的destroy方法
   * @returns {LogMaster} 返回当前实例，支持链式调用
   */
  removeTransport(transportOrId, options = { destroy: true }) {
    // 如果没有传输器列表或为空，直接返回
    if (!this._transports || this._transports.length === 0) {
      return this;
    }

    // 查找要移除的传输器索引
    const index = this._findTransportIndex(transportOrId);

    // 如果未找到传输器，直接返回
    if (index === -1) {
      return this;
    }

    // 获取传输器引用
    const transport = this._transports[index];

    // 调用传输器的destroy方法（如果有且需要）
    if (options.destroy && typeof transport.destroy === 'function') {
      try {
        transport.destroy();
      } catch (err) {
        console.error(`传输器销毁失败: ${err.message}`);
      }
    }

    // 从数组中移除传输器
    this._transports.splice(index, 1);

    return this;
  }

  /**
   * 清除所有传输器
   * @public
   * @param {Object} [options] - 清除选项
   * @param {boolean} [options.destroy=true] - 是否调用传输器的destroy方法
   * @returns {LogMaster} 返回当前实例，支持链式调用
   */
  clearTransports(options = { destroy: true }) {
    // 如果没有传输器列表或为空，直接返回
    if (!this._transports || this._transports.length === 0) {
      return this;
    }

    // 如果需要，调用每个传输器的destroy方法
    if (options.destroy) {
      this._transports.forEach(transport => {
        if (typeof transport.destroy === 'function') {
          try {
            transport.destroy();
          } catch (err) {
            console.error(`传输器销毁失败: ${err.message}`);
          }
        }
      });
    }

    // 清空传输器数组
    this._transports = [];

    return this;
  }

  /**
   * 检查传输器是否有效
   * @private
   * @param {Object} transport - 要检查的传输器
   * @returns {boolean} 传输器是否有效
   */
  _isValidTransport(transport) {
    return (
      transport !== null && typeof transport === 'object' && typeof transport.log === 'function'
    );
  }

  /**
   * 检查传输器是否已存在
   * @private
   * @param {Object} transport - 要检查的传输器
   * @returns {boolean} 传输器是否已存在
   */
  _hasTransport(transport) {
    if (!this._transports || this._transports.length === 0) {
      return false;
    }

    // 通过ID或引用检查传输器是否已存在
    return this._transports.some(t => (transport.id && t.id === transport.id) || t === transport);
  }

  /**
   * 查找传输器索引
   * @private
   * @param {Object|string} transportOrId - 传输器对象或ID
   * @returns {number} 传输器索引，未找到则返回-1
   */
  _findTransportIndex(transportOrId) {
    if (!this._transports || this._transports.length === 0) {
      return -1;
    }

    // 根据传输器对象或ID查找
    if (typeof transportOrId === 'string') {
      // 通过ID查找
      return this._transports.findIndex(t => t.id === transportOrId);
    } else if (transportOrId && typeof transportOrId === 'object') {
      // 通过引用或ID查找
      return this._transports.findIndex(
        t => t === transportOrId || (transportOrId.id && t.id === transportOrId.id),
      );
    }

    return -1;
  }

  /**
   * 生成唯一的传输器ID
   * @private
   * @returns {string} 唯一ID
   */
  _generateTransportId() {
    return `transport_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default LogMaster;
