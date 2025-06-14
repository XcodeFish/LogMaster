/**
 * @file 传输系统基类
 * @module transports/base
 * @author LogMaster
 * @license MIT
 */

import { LOG_LEVELS, LOG_LEVEL_NAMES, TRANSPORT } from '../core/constants.js';

/**
 * 传输配置验证错误
 * @extends Error
 */
class TransportConfigError extends Error {
  /**
   * 创建传输配置验证错误
   * @param {string} message - 错误消息
   */
  constructor(message) {
    super(`传输配置错误: ${message}`);
    this.name = 'TransportConfigError';
  }
}

/**
 * 传输运行时错误
 * @extends Error
 */
class TransportError extends Error {
  /**
   * 创建传输运行时错误
   * @param {string} message - 错误消息
   * @param {Error} [cause] - 原始错误
   */
  constructor(message, cause) {
    super(`传输错误: ${message}${cause ? ` (${cause.message})` : ''}`);
    this.name = 'TransportError';
    this.cause = cause;
  }
}

/**
 * 传输接口定义
 * @interface
 */
class Transport {
  /**
   * 日志方法（必须实现）
   * @abstract
   * @param {Object} _logEntry - 日志条目
   * @param {number} _logEntry.level - 日志级别
   * @param {Date} _logEntry.timestamp - 时间戳
   * @param {Array} _logEntry.formattedArgs - 格式化后的参数
   * @param {Array} _logEntry.originalArgs - 原始参数
   * @param {string} _logEntry.environment - 环境
   */
  log(_logEntry) {
    throw new Error('必须实现log方法');
  }

  /**
   * 初始化方法（可选实现）
   * @abstract
   */
  init() {
    // 可选实现
  }

  /**
   * 销毁方法（可选实现）
   * @abstract
   */
  destroy() {
    // 可选实现
  }

  /**
   * 批量日志方法（可选实现）
   * @abstract
   * @param {Array<Object>} logEntries - 日志条目数组
   */
  bulkLog(logEntries) {
    // 默认实现：逐条发送日志
    logEntries.forEach(entry => this.log(entry));
  }
}

/**
 * 基础传输抽象类
 * @abstract
 * @extends Transport
 */
class BaseTransport extends Transport {
  /**
   * 创建基础传输实例
   * @param {Object} [options={}] - 传输选项
   * @param {string} [options.name='transport'] - 传输名称
   * @param {string} [options.id] - 传输ID，如果不提供则自动生成
   * @param {number} [options.level=LOG_LEVELS.DEBUG] - 最低日志级别
   * @param {Function} [options.formatter] - 自定义格式化函数
   * @param {Function} [options.filter] - 自定义过滤函数
   * @param {boolean} [options.enabled=true] - 是否启用
   * @param {boolean} [options.handleExceptions=false] - 是否处理未捕获异常
   * @param {number} [options.batchSize=0] - 批处理大小，0表示不使用批处理
   * @param {number} [options.batchTimeout=TRANSPORT.DEFAULT_BATCH_TIMEOUT] - 批处理超时时间(毫秒)
   * @param {number} [options.maxRetries=TRANSPORT.DEFAULT_RETRY_COUNT] - 最大重试次数
   * @param {number} [options.retryDelay=TRANSPORT.DEFAULT_RETRY_DELAY] - 重试间隔(毫秒)
   * @param {boolean} [options.silent=false] - 静默模式，不抛出错误
   * @param {number} [options.batchRetries=TRANSPORT.DEFAULT_BATCH_RETRY_COUNT] - 批处理最大重试次数
   */
  constructor(options = {}) {
    super();

    // 基本配置
    this.name = options.name || 'transport';
    this.id = options.id || this._generateId();
    this._logLevel = options.level !== undefined ? options.level : LOG_LEVELS.DEBUG;
    this.formatter = options.formatter || null;
    this.filter = options.filter || null;
    this.enabled = options.enabled !== undefined ? Boolean(options.enabled) : true;
    this.handleExceptions = Boolean(options.handleExceptions);
    this.silent = Boolean(options.silent);

    // 批处理相关
    this.batchSize = options.batchSize || 0;
    this.batchQueue = [];
    this.batchTimeout = null;
    this.batchTimeoutMs = options.batchTimeout || TRANSPORT.DEFAULT_BATCH_TIMEOUT;
    this.batchRetries = options.batchRetries || TRANSPORT.DEFAULT_BATCH_RETRY_COUNT;

    // 重试相关
    this.maxRetries = options.maxRetries || TRANSPORT.DEFAULT_RETRY_COUNT;
    this.retryDelay = options.retryDelay || TRANSPORT.DEFAULT_RETRY_DELAY;

    // 状态追踪
    this._ready = false;
    this._destroyed = false;
    this._errorCount = 0;
    this._lastError = null;

    // 调用验证方法
    this._validateConfig(options);
  }

  /**
   * 生成唯一ID
   * @private
   * @returns {string} 唯一ID
   */
  _generateId() {
    return `${this.name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 验证配置有效性
   * @protected
   * @param {Object} config - 配置对象
   * @throws {TransportConfigError} 如果配置无效
   */
  _validateConfig(config) {
    // 验证日志级别
    if (config.level !== undefined) {
      if (
        typeof config.level !== 'number' ||
        config.level < LOG_LEVELS.DEBUG ||
        config.level > LOG_LEVELS.SILENT
      ) {
        throw new TransportConfigError(
          `无效的日志级别: ${config.level}。` + `有效值: ${JSON.stringify(LOG_LEVELS)}`,
        );
      }
    }

    // 验证各种函数类型选项
    ['formatter', 'filter'].forEach(option => {
      if (
        config[option] !== undefined &&
        config[option] !== null &&
        typeof config[option] !== 'function'
      ) {
        throw new TransportConfigError(`${option} 必须是函数类型`);
      }
    });

    // 验证数字类型选项
    ['batchSize', 'maxRetries', 'retryDelay'].forEach(option => {
      if (
        config[option] !== undefined &&
        (typeof config[option] !== 'number' || config[option] < 0)
      ) {
        throw new TransportConfigError(`${option} 必须是非负数值`);
      }
    });
  }

  /**
   * 检查日志是否应该被记录
   * @protected
   * @param {Object} logEntry - 日志条目
   * @returns {boolean} 是否应该记录
   */
  _shouldLog(logEntry) {
    // 禁用状态或已销毁不记录
    if (!this.enabled || this._destroyed) {
      return false;
    }

    // 级别过滤
    if (logEntry.level < this._logLevel) {
      return false;
    }

    // 自定义过滤器
    if (this.filter && !this.filter(logEntry)) {
      return false;
    }

    return true;
  }

  /**
   * 格式化日志条目
   * @protected
   * @param {Object} logEntry - 日志条目
   * @returns {*} 格式化后的日志
   */
  _formatLogEntry(logEntry) {
    // 使用自定义格式化器
    if (this.formatter) {
      return this.formatter(logEntry);
    }

    // 默认格式化为简单对象
    const { level, timestamp, originalArgs, environment } = logEntry;
    const levelName = LOG_LEVEL_NAMES[level] || 'UNKNOWN';

    return {
      timestamp: timestamp.toISOString(),
      level: levelName,
      environment,
      message: originalArgs
        .map(arg => {
          if (arg instanceof Error) {
            return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
          } else if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg);
            } catch (e) {
              return '[Object]';
            }
          } else {
            return String(arg);
          }
        })
        .join(' '),
    };
  }

  /**
   * 处理日志传输错误
   * @protected
   * @param {Error} error - 错误对象
   * @param {Object} [logEntry] - 导致错误的日志条目
   * @param {number} [retryCount=0] - 当前重试次数
   * @returns {Promise<boolean>} 是否处理成功
   */
  async _handleError(error, logEntry, retryCount = 0) {
    // 更新错误统计
    this._errorCount++;
    this._lastError = {
      error,
      timestamp: new Date(),
      logEntry,
    };

    // 决定是否重试
    if (retryCount < this.maxRetries && logEntry) {
      try {
        // 等待重试延迟
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));

        // 重试发送
        await this._write(logEntry, retryCount + 1);
        return true;
      } catch (retryError) {
        // 重试失败
        if (this.silent) {
          return false;
        }
        throw new TransportError(`重试失败 (${retryCount + 1}/${this.maxRetries})`, retryError);
      }
    }

    // 达到最大重试次数或无法重试
    if (!this.silent) {
      throw new TransportError(`传输失败`, error);
    }

    return false;
  }

  /**
   * 实际写入日志的方法，需要被子类实现
   * @abstract
   * @protected
   * @param {Object} formattedEntry - 格式化后的日志条目
   * @param {number} [_retryCount=0] - 当前重试次数
   * @returns {Promise<boolean>} 是否写入成功
   */
  async _write(formattedEntry, _retryCount = 0) {
    throw new Error('_write 方法必须由子类实现');
  }

  /**
   * 计算重试延迟时间
   * @private
   * @param {number} retryCount - 当前重试次数
   * @param {boolean} [addNetworkJitter=true] - 是否添加网络抖动
   * @returns {number} 延迟时间(毫秒)
   */
  _calculateRetryDelay(retryCount, addNetworkJitter = true) {
    // 基础延迟
    let delay = this.retryDelay;

    // 指数退避 (2^n * 基础延迟)
    delay = delay * Math.pow(2, retryCount);

    // 添加随机抖动，避免多个客户端同时重试导致的重试风暴
    if (addNetworkJitter) {
      // 使用更大的随机范围，±50%
      const jitterPercentage = 0.5;
      const jitter = (Math.random() * 2 * jitterPercentage - jitterPercentage) * delay;
      delay += jitter;

      // 添加额外的随机基础延迟，模拟网络波动
      const networkJitter = Math.floor(Math.random() * 100); // 0-100ms随机延迟
      delay += networkJitter;
    }

    // 限制最大延迟
    return Math.min(delay, 60000); // 最大60秒
  }

  /**
   * 处理批量日志
   * @protected
   * @param {boolean} [force=false] - 是否强制处理当前批次，不管大小
   * @param {number} [retryCount=0] - 当前重试次数
   */
  _processBatch(force = false, retryCount = 0) {
    // 取消任何待处理的批处理超时
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    // 如果队列为空，不处理
    if (this.batchQueue.length === 0) {
      return;
    }

    // 如果未达到批处理大小且不强制，设置超时
    if (!force && this.batchSize > 0 && this.batchQueue.length < this.batchSize) {
      this.batchTimeout = setTimeout(() => {
        this._processBatch(true);
      }, this.batchTimeoutMs); // 使用配置的超时时间
      return;
    }

    // 获取并清空当前批次
    const batch = [...this.batchQueue];
    this.batchQueue = [];

    // 处理批次
    try {
      this.bulkLog(batch);
    } catch (error) {
      // 批处理失败，尝试重试
      if (retryCount < this.batchRetries) {
        // 计算重试延迟，添加网络抖动
        const delay = this._calculateRetryDelay(retryCount, true);

        // 记录重试计划
        if (!this.silent && this._logLevel <= LOG_LEVELS.DEBUG) {
          console.debug(
            `计划批处理重试 #${retryCount + 1}/${this.batchRetries}，延迟: ${delay}ms，批量大小: ${
              batch.length
            }，错误: ${error.message}`,
          );
        }

        // 设置重试
        setTimeout(() => {
          this._processBatchRetry(batch, retryCount + 1, error);
        }, delay);
      } else {
        // 超过重试次数，回退到分组单条处理
        this._handleBatchFailure(batch, error);
      }
    }
  }

  /**
   * 重试处理批量日志
   * @private
   * @param {Array<Object>} batch - 日志批次
   * @param {number} retryCount - 当前重试次数
   * @param {Error} previousError - 上一次错误
   */
  _processBatchRetry(batch, retryCount, previousError) {
    try {
      // 记录重试信息
      if (!this.silent) {
        console.warn(
          `执行批处理重试 #${retryCount}/${this.batchRetries}，批量大小: ${batch.length}，上次错误: ${previousError.message}`,
        );
      }

      // 重试批处理
      this.bulkLog(batch);
    } catch (error) {
      // 重试失败
      if (retryCount < this.batchRetries) {
        // 继续重试，使用更大的延迟
        const delay = this._calculateRetryDelay(retryCount, true);

        // 记录下一次重试计划
        if (!this.silent) {
          console.warn(
            `批处理重试 #${retryCount} 失败，计划下一次重试 #${
              retryCount + 1
            }，延迟: ${delay}ms，错误: ${error.message}`,
          );
        }

        setTimeout(() => {
          this._processBatchRetry(batch, retryCount + 1, error);
        }, delay);
      } else {
        // 超过重试次数，回退到分组单条处理
        this._handleBatchFailure(batch, error);
      }
    }
  }

  /**
   * 处理批处理最终失败的情况
   * @private
   * @param {Array<Object>} batch - 日志批次
   * @param {Error} error - 批处理错误
   * @returns {Promise<Object>} 处理结果
   */
  async _handleBatchFailure(batch, error) {
    // 记录批处理失败
    this._markError(error, 'batch');

    if (!this.silent) {
      console.error(
        `批处理失败，经过 ${this.batchRetries} 次重试后回退到分组处理: ${error.message}`,
      );
    }

    // 结果统计
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // 将批次分成较小的组进行处理，避免一次性处理太多导致性能问题
    const groupSize = Math.max(5, Math.ceil(batch.length / 5)); // 最多分成5组，每组至少5条
    const groups = [];

    // 将批次分组
    for (let i = 0; i < batch.length; i += groupSize) {
      groups.push(batch.slice(i, i + groupSize));
    }

    // 使用延迟处理各个组，避免同时处理
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      const group = groups[groupIndex];

      // 添加递增延迟，错开处理时间
      const groupDelay = groupIndex * 200; // 每组间隔200ms

      try {
        // 等待延迟
        if (groupDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, groupDelay));
        }

        // 尝试对每组进行批处理
        await this._processFailedGroup(group, groupIndex + 1, groups.length, results);
      } catch (groupError) {
        // 组处理出错，记录但继续处理其他组
        if (!this.silent) {
          console.warn(`分组 ${groupIndex + 1}/${groups.length} 处理失败: ${groupError.message}`);
        }
      }
    }

    return results;
  }

  /**
   * 处理失败批次的单个分组
   * @private
   * @param {Array<Object>} group - 日志分组
   * @param {number} groupIndex - 分组索引
   * @param {number} totalGroups - 总分组数
   * @param {Object} results - 结果统计对象
   */
  async _processFailedGroup(group, groupIndex, totalGroups, results) {
    if (!this.silent && this._logLevel <= LOG_LEVELS.DEBUG) {
      console.debug(`处理失败批次分组 ${groupIndex}/${totalGroups}，条目数: ${group.length}`);
    }

    // 尝试对每组进行批处理
    try {
      await this.bulkLog(group);
      results.success += group.length;
    } catch (groupError) {
      if (!this.silent) {
        console.warn(
          `分组 ${groupIndex}/${totalGroups} 处理失败，回退到单条处理: ${groupError.message}`,
        );
      }

      // 组处理失败，回退到单条处理，但添加间隔避免并发
      for (let entryIndex = 0; entryIndex < group.length; entryIndex++) {
        const entry = group[entryIndex];

        // 添加小延迟，避免同时处理所有条目
        const entryDelay = Math.floor(entryIndex / 5) * 50; // 每5条日志间隔50ms

        try {
          // 等待延迟
          if (entryDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, entryDelay));
          }

          // 避免递归调用log方法，直接处理单条日志
          const formattedEntry = this._formatLogEntry(entry);
          await this._write(formattedEntry);
          results.success++;
        } catch (e) {
          results.failed++;
          results.errors.push({
            entry: entry,
            error: e.message,
          });

          this._handleError(e, entry);
        }
      }
    }
  }

  /**
   * 处理日志（公共接口方法）
   * @public
   * @param {Object} logEntry - 日志条目
   */
  log(logEntry) {
    // 检查是否应该记录
    if (!this._shouldLog(logEntry)) {
      return;
    }

    // 批处理模式
    if (this.batchSize > 0) {
      this.batchQueue.push(logEntry);

      // 如果队列达到批处理大小，处理批次
      if (this.batchQueue.length >= this.batchSize) {
        this._processBatch();
      } else if (!this.batchTimeout) {
        // 设置超时，以确保日志不会无限期等待
        this.batchTimeout = setTimeout(() => {
          this._processBatch(true);
        }, this.batchTimeoutMs); // 使用配置的超时时间
      }

      return;
    }

    // 单条处理模式
    try {
      // 格式化日志
      const formattedEntry = this._formatLogEntry(logEntry);

      // 写入日志
      this._write(formattedEntry).catch(error => {
        this._handleError(error, logEntry);
      });
    } catch (error) {
      this._handleError(error, logEntry);
    }
  }

  /**
   * 初始化传输器
   * @public
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async init() {
    if (this._ready || this._destroyed) {
      return this._ready;
    }

    try {
      // 这里子类应该实现具体初始化逻辑
      this._ready = true;
      return true;
    } catch (error) {
      this._ready = false;
      if (!this.silent) {
        throw new TransportError(`初始化失败`, error);
      }
      return false;
    }
  }

  /**
   * 销毁传输器
   * @public
   * @returns {Promise<boolean>} 销毁是否成功
   */
  async destroy() {
    if (this._destroyed) {
      return true;
    }

    // 处理未完成的批处理
    if (this.batchQueue.length > 0) {
      await this._processBatch(true);
    }

    try {
      // 这里子类应该实现具体销毁逻辑
      this._destroyed = true;
      this._ready = false;
      return true;
    } catch (error) {
      if (!this.silent) {
        throw new TransportError(`销毁失败`, error);
      }
      return false;
    }
  }

  /**
   * 获取传输状态
   * @public
   * @returns {Object} 状态对象
   */
  getStatus() {
    return {
      id: this.id,
      name: this.name,
      enabled: this.enabled,
      level: this._logLevel,
      levelName: LOG_LEVEL_NAMES[this._logLevel],
      ready: this._ready,
      destroyed: this._destroyed,
      errorCount: this._errorCount,
      lastError: this._lastError,
      batchSize: this.batchSize,
      queueSize: this.batchQueue.length,
    };
  }

  /**
   * 启用传输器
   * @public
   * @returns {BaseTransport} 当前实例，支持链式调用
   */
  enable() {
    this.enabled = true;
    return this;
  }

  /**
   * 禁用传输器
   * @public
   * @returns {BaseTransport} 当前实例，支持链式调用
   */
  disable() {
    this.enabled = false;
    return this;
  }

  /**
   * 设置日志级别
   * @public
   * @param {number} level - 日志级别
   * @returns {BaseTransport} 当前实例，支持链式调用
   * @throws {TransportConfigError} 如果日志级别无效
   */
  setLevel(level) {
    if (typeof level !== 'number' || level < LOG_LEVELS.DEBUG || level > LOG_LEVELS.SILENT) {
      throw new TransportConfigError(
        `无效的日志级别: ${level}。有效值: ${JSON.stringify(LOG_LEVELS)}`,
      );
    }

    this._logLevel = level;
    return this;
  }
}

export { Transport, BaseTransport, TransportError, TransportConfigError };
