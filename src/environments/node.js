/**
 * @file Node.js环境适配器
 * @module environments/node
 * @author LogMaster Team
 * @license MIT
 */

/**
 * 安全地导入Node.js模块
 * @private
 * @param {string} moduleName - 模块名称
 * @returns {Object|null} 导入的模块或null
 */
function safeRequire(moduleName) {
  try {
    // 使用动态导入而非直接require，以便兼容打包环境
    // 在某些打包环境中，如webpack和rollup，可以通过配置避免打包这些导入
    return require(moduleName);
  } catch (e) {
    return null;
  }
}

/**
 * Node.js环境适配器
 * 提供Node.js特性检测、API适配、配置存储和进程环境处理
 */
class NodeEnvironment {
  /**
   * 创建Node.js环境适配器实例
   * @param {Object} [options={}] - 配置选项
   * @param {string} [options.configPath='.logmaster'] - 配置文件名
   * @param {string} [options.configDir] - 配置目录，默认为用户主目录
   * @param {boolean} [options.detectFeatures=true] - 是否自动检测环境特性
   */
  constructor(options = {}) {
    this._configPath = options.configPath || '.logmaster';
    this._configDir = options.configDir || null; // 如果为null，则使用用户主目录
    this._features = {
      colorSupport: false,
      fsSupport: false,
      processSupport: false,
      streamSupport: false,
    };

    // 延迟导入，支持在浏览器环境中使用
    this._fs = null;
    this._path = null;
    this._os = null;
    this._stream = null;
    this._process = typeof process !== 'undefined' ? process : null;

    this._consoleAPI = {
      log: this._safeConsoleCall('log'),
      info: this._safeConsoleCall('info'),
      warn: this._safeConsoleCall('warn'),
      error: this._safeConsoleCall('error'),
      debug: this._safeConsoleCall('debug'),
      group: this._safeConsoleCall('group'),
      groupCollapsed: this._safeConsoleCall('groupCollapsed'),
      groupEnd: this._safeConsoleCall('groupEnd'),
      table: this._safeConsoleCall('table'),
      time: this._safeConsoleCall('time'),
      timeEnd: this._safeConsoleCall('timeEnd'),
      clear: this._safeConsoleCall('clear'),
    };

    if (options.detectFeatures !== false) {
      this.detectFeatures();
    }
  }

  /**
   * 检测Node.js环境特性
   * @returns {Object} 检测到的特性对象
   */
  detectFeatures() {
    // 检查是否在Node.js环境
    const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

    if (!isNode) {
      return this._features;
    }

    // 动态导入Node.js模块，使用安全导入方式
    this._fs = safeRequire('fs');
    this._path = safeRequire('path');
    this._os = safeRequire('os');
    this._stream = safeRequire('stream');

    this._features.fsSupport = !!this._fs;
    this._features.streamSupport = !!this._stream;

    // 检测颜色支持
    this._features.colorSupport = this._detectColorSupport();

    // 检测进程支持
    this._features.processSupport = !!this._process;

    return this._features;
  }

  /**
   * 检测终端是否支持颜色
   * @private
   * @returns {boolean} 是否支持颜色
   */
  _detectColorSupport() {
    if (!this._process || !this._process.stdout || !this._process.env) {
      return false;
    }

    if (this._process.stdout.isTTY) {
      const termEnv = (this._process.env.TERM || '').toLowerCase();
      const colorTerms = ['xterm', 'screen', 'vt100', 'color', 'ansi', 'cygwin', 'linux'];

      // 检查终端类型
      if (colorTerms.some(term => termEnv.includes(term))) {
        return true;
      }

      // 检查颜色级别
      const colorLevel = parseInt(this._process.env.COLORTERM, 10) || 0;
      if (colorLevel > 0) {
        return true;
      }
    }

    // 检查是否明确禁用颜色
    if (
      this._process.env.NO_COLOR ||
      this._process.env.NODE_DISABLE_COLORS ||
      this._process.env.TERM === 'dumb'
    ) {
      return false;
    }

    // 检查常用CI环境
    if (this._process.env.CI || this._process.env.TEAMCITY_VERSION) {
      return true;
    }

    return false;
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
   * 获取配置文件的完整路径
   * @private
   * @returns {string|null} 配置文件路径或null
   */
  _getConfigFilePath() {
    if (!this._features.fsSupport || !this._path) {
      return null;
    }

    let baseDir = this._configDir;

    if (!baseDir) {
      // 使用用户主目录作为默认目录
      baseDir = this._os && typeof this._os.homedir === 'function' ? this._os.homedir() : null;

      // 如果无法获取主目录，尝试使用其他方法
      if (!baseDir && this._process && this._process.env) {
        // 尝试从环境变量获取
        baseDir =
          this._process.env.HOME ||
          this._process.env.USERPROFILE ||
          this._process.env.HOMEPATH ||
          '.';
      }

      // 仍然无法获取目录，使用当前目录
      if (!baseDir) {
        baseDir = '.';
      }
    }

    return this._path.resolve(baseDir, this._configPath);
  }

  /**
   * 保存配置到文件
   * @param {Object} config - 要保存的配置对象
   * @returns {boolean} 是否保存成功
   */
  saveConfig(config) {
    const configFilePath = this._getConfigFilePath();
    if (!configFilePath || !this._fs) {
      return false;
    }

    try {
      // 确保目录存在
      const dirPath = this._path.dirname(configFilePath);
      if (!this._fs.existsSync(dirPath)) {
        this._fs.mkdirSync(dirPath, { recursive: true });
      }

      const serialized = JSON.stringify(config, null, 2);
      this._fs.writeFileSync(configFilePath, serialized, 'utf8');
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 从文件加载配置
   * @returns {Object|null} 加载的配置对象或null
   */
  loadConfig() {
    const configFilePath = this._getConfigFilePath();
    if (!configFilePath || !this._fs) {
      return null;
    }

    try {
      if (this._fs.existsSync(configFilePath)) {
        const content = this._fs.readFileSync(configFilePath, 'utf8');
        return JSON.parse(content);
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * 清除保存的配置
   * @returns {boolean} 是否清除成功
   */
  clearConfig() {
    const configFilePath = this._getConfigFilePath();
    if (!configFilePath || !this._fs) {
      return false;
    }

    try {
      if (this._fs.existsSync(configFilePath)) {
        this._fs.unlinkSync(configFilePath);
      }

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
   * @returns {Object} Node.js特性对象
   */
  getFeatures() {
    return { ...this._features };
  }

  /**
   * 判断当前是否为生产环境
   * @returns {boolean} 是否为生产环境
   */
  isProduction() {
    if (!this._process || !this._process.env) {
      return false;
    }

    // 通过环境变量检测生产环境
    return (
      this._process.env.NODE_ENV === 'production' ||
      this._process.env.ENV === 'production' ||
      this._process.env.ENVIRONMENT === 'production' ||
      false
    );
  }

  /**
   * 获取Node.js信息
   * @returns {Object} Node.js信息对象
   */
  getNodeInfo() {
    const info = {
      version: 'unknown',
      platform: 'unknown',
      arch: 'unknown',
      pid: -1,
      ppid: -1,
      memoryUsage: null,
      uptime: 0,
    };

    if (!this._process) {
      return info;
    }

    if (this._process.versions && this._process.versions.node) {
      info.version = this._process.versions.node;
    }

    if (this._process.platform) {
      info.platform = this._process.platform;
    }

    if (this._process.arch) {
      info.arch = this._process.arch;
    }

    if (this._process.pid) {
      info.pid = this._process.pid;
    }

    if (this._process.ppid) {
      info.ppid = this._process.ppid;
    }

    if (typeof this._process.memoryUsage === 'function') {
      try {
        info.memoryUsage = this._process.memoryUsage();
      } catch (e) {
        // 忽略内存使用获取错误
      }
    }

    if (typeof this._process.uptime === 'function') {
      try {
        info.uptime = this._process.uptime();
      } catch (e) {
        // 忽略运行时间获取错误
      }
    }

    return info;
  }

  /**
   * 注册进程信号处理
   * @param {Object} handlers - 信号处理器对象
   * @param {Function} [handlers.SIGINT] - SIGINT信号处理函数
   * @param {Function} [handlers.SIGTERM] - SIGTERM信号处理函数
   * @param {Function} [handlers.uncaughtException] - 未捕获异常处理函数
   * @param {Function} [handlers.unhandledRejection] - 未处理Promise拒绝处理函数
   * @returns {Function} 移除所有处理器的函数
   */
  registerProcessHandlers(handlers = {}) {
    if (!this._process) {
      return () => {}; // 返回空函数
    }

    const registeredHandlers = new Map();

    // 注册信号处理器
    if (handlers.SIGINT && typeof handlers.SIGINT === 'function') {
      this._process.on('SIGINT', handlers.SIGINT);
      registeredHandlers.set('SIGINT', handlers.SIGINT);
    }

    if (handlers.SIGTERM && typeof handlers.SIGTERM === 'function') {
      this._process.on('SIGTERM', handlers.SIGTERM);
      registeredHandlers.set('SIGTERM', handlers.SIGTERM);
    }

    // 注册异常处理器
    if (handlers.uncaughtException && typeof handlers.uncaughtException === 'function') {
      this._process.on('uncaughtException', handlers.uncaughtException);
      registeredHandlers.set('uncaughtException', handlers.uncaughtException);
    }

    if (handlers.unhandledRejection && typeof handlers.unhandledRejection === 'function') {
      this._process.on('unhandledRejection', handlers.unhandledRejection);
      registeredHandlers.set('unhandledRejection', handlers.unhandledRejection);
    }

    // 返回移除所有处理器的函数
    return () => {
      registeredHandlers.forEach((handler, event) => {
        if (this._process && typeof this._process.removeListener === 'function') {
          this._process.removeListener(event, handler);
        }
      });
      registeredHandlers.clear();
    };
  }

  /**
   * 创建写入流
   * @param {string} filePath - 文件路径
   * @param {Object} [options={}] - 流选项
   * @returns {Object|null} 写入流或null
   */
  createWriteStream(filePath, options = {}) {
    if (!this._features.fsSupport || !this._fs) {
      return null;
    }

    try {
      // 确保目录存在
      const dirPath = this._path.dirname(filePath);
      if (!this._fs.existsSync(dirPath)) {
        this._fs.mkdirSync(dirPath, { recursive: true });
      }

      return this._fs.createWriteStream(filePath, options);
    } catch (e) {
      return null;
    }
  }

  /**
   * 创建读取流
   * @param {string} filePath - 文件路径
   * @param {Object} [options={}] - 流选项
   * @returns {Object|null} 读取流或null
   */
  createReadStream(filePath, options = {}) {
    if (!this._features.fsSupport || !this._fs) {
      return null;
    }

    try {
      if (!this._fs.existsSync(filePath)) {
        return null;
      }

      return this._fs.createReadStream(filePath, options);
    } catch (e) {
      return null;
    }
  }

  /**
   * 创建转换流
   * @param {Object} [options={}] - 转换流选项
   * @param {Function} [transform] - 转换函数
   * @param {Function} [flush] - 刷新函数
   * @returns {Object|null} 转换流或null
   */
  createTransformStream(options = {}, transform, flush) {
    if (!this._features.streamSupport || !this._stream || !this._stream.Transform) {
      return null;
    }

    try {
      // 如果提供了转换函数和刷新函数，创建自定义转换流
      if (typeof transform === 'function') {
        return new this._stream.Transform({
          ...options,
          transform,
          flush: typeof flush === 'function' ? flush : undefined,
        });
      }
      // 否则创建基本转换流
      else {
        return new this._stream.Transform(options);
      }
    } catch (e) {
      return null;
    }
  }

  /**
   * 创建文件监听器
   * @param {string} filePath - 要监听的文件路径
   * @param {Object} [options={}] - 监听选项
   * @param {Function} callback - 变更回调函数
   * @returns {Object|Function|null} 监听器对象或取消监听函数或null
   */
  watchFile(filePath, options = {}, callback) {
    if (!this._features.fsSupport || !this._fs || typeof this._fs.watch !== 'function') {
      return null;
    }

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    try {
      const watcher = this._fs.watch(filePath, options, callback);

      // 返回取消监听的函数
      return () => {
        try {
          watcher.close();
        } catch (e) {
          // 忽略关闭错误
        }
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * 流水线处理：将多个流连接起来
   * @param {Array<Object>} streams - 流对象数组
   * @param {Object} [_options={}] - 选项（未使用）
   * @returns {Object|null} 最后一个流或null
   */
  pipeline(streams, _options = {}) {
    if (!this._features.streamSupport || !this._stream || !this._stream.pipeline) {
      return null;
    }

    if (!Array.isArray(streams) || streams.length < 2) {
      return null;
    }

    try {
      // 使用Promise包装pipeline操作
      return new Promise((resolve, reject) => {
        // 获取最后一个流
        const lastStream = streams[streams.length - 1];

        // 使用stream.pipeline连接所有流
        this._stream.pipeline(...streams, err => {
          if (err) {
            reject(err);
          } else {
            resolve(lastStream);
          }
        });
      });
    } catch (e) {
      return null;
    }
  }
}

export default NodeEnvironment;
