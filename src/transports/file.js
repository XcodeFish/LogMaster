/**
 * @file 文件传输模块
 * @module transports/file
 * @author LogMaster
 * @license MIT
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';
import { BaseTransport, TransportConfigError, TransportError } from './base.js';
import { TRANSPORT, LOG_LEVELS } from '../core/constants.js';

// 文件操作的Promise版本
const fsAsync = {
  stat: promisify(fs.stat),
  mkdir: promisify(fs.mkdir),
  writeFile: promisify(fs.writeFile),
  appendFile: promisify(fs.appendFile),
  rename: promisify(fs.rename),
  unlink: promisify(fs.unlink),
  readdir: promisify(fs.readdir),
  access: promisify(fs.access),
};

// 压缩功能
const gzipAsync = promisify(zlib.gzip);

/**
 * 文件锁管理器
 * @private
 */
class FileLockManager {
  constructor() {
    this.locks = new Map();
    this.rotationLocks = new Map();
    this.waitTimeout = 5000; // 等待锁的最大时间(毫秒)
    this.lockExpiry = 10000; // 锁的过期时间(毫秒)，防止死锁
    this.retryInterval = 50; // 重试间隔(毫秒)
    this.maxRetries = 10; // 最大重试次数
  }

  /**
   * 获取文件锁
   * @param {string} filePath - 文件路径
   * @param {Object} [options] - 锁选项
   * @param {number} [options.timeout] - 自定义超时时间
   * @param {number} [options.retryCount=0] - 当前重试次数
   * @returns {Promise<boolean>} 获取锁成功的Promise
   */
  async acquire(filePath, options = {}) {
    const timeout = options.timeout || this.waitTimeout;
    const retryCount = options.retryCount || 0;
    const startTime = Date.now();

    // 检查锁是否存在
    if (this.locks.has(filePath)) {
      const lockInfo = this.locks.get(filePath);

      // 检查锁是否过期
      if (Date.now() - lockInfo.timestamp > this.lockExpiry) {
        console.warn(`文件锁已过期，强制释放: ${filePath}，持有者: ${lockInfo.owner}`);
        this.release(filePath);
      } else {
        // 锁仍然有效，检查是否等待超时
        if (Date.now() - startTime > timeout) {
          // 超时但仍有重试次数
          if (retryCount < this.maxRetries) {
            // 计算下一次重试的延迟，使用指数退避
            const nextRetryDelay = Math.min(this.retryInterval * Math.pow(1.5, retryCount), 1000);

            // 添加随机抖动(±20%)
            const jitter = (Math.random() * 0.4 - 0.2) * nextRetryDelay;
            const delay = nextRetryDelay + jitter;

            // 等待后重试
            await new Promise(resolve => setTimeout(resolve, delay));

            // 递归重试，增加重试计数
            return this.acquire(filePath, {
              timeout,
              retryCount: retryCount + 1,
            });
          }

          console.warn(`获取文件锁超时: ${filePath}，已重试${retryCount}次`);
          return false;
        }

        // 等待一段时间再检查
        const waitTime = Math.min(this.retryInterval, 100);
        await new Promise(resolve => setTimeout(resolve, waitTime));

        // 递归检查，不增加重试计数，因为这是正常的等待过程
        return this.acquire(filePath, options);
      }
    }

    // 获取锁
    const owner = `pid-${process.pid || 'browser'}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 5)}`;
    this.locks.set(filePath, {
      timestamp: Date.now(),
      owner,
      retryCount,
    });

    return true;
  }

  /**
   * 释放文件锁
   * @param {string} filePath - 文件路径
   * @param {string} [owner] - 锁的所有者，用于验证
   * @returns {boolean} 是否成功释放
   */
  release(filePath, owner) {
    // 如果指定了所有者，验证所有权
    if (owner) {
      const lockInfo = this.locks.get(filePath);
      if (!lockInfo || lockInfo.owner !== owner) {
        return false; // 不是锁的所有者，不能释放
      }
    }

    this.locks.delete(filePath);
    return true;
  }

  /**
   * 获取轮转操作锁
   * @param {string} filePath - 文件路径
   * @param {Object} [options] - 锁选项
   * @param {number} [options.timeout] - 自定义超时时间
   * @param {number} [options.retryCount=0] - 当前重试次数
   * @returns {Promise<Object>} 锁信息对象，包含成功状态和锁ID
   */
  async acquireRotationLock(filePath, options = {}) {
    const timeout = options.timeout || this.waitTimeout;
    const retryCount = options.retryCount || 0;
    const startTime = Date.now();

    // 检查锁是否存在
    if (this.rotationLocks.has(filePath)) {
      const lockInfo = this.rotationLocks.get(filePath);

      // 检查锁是否过期
      if (Date.now() - lockInfo.timestamp > this.lockExpiry) {
        console.warn(`轮转锁已过期，强制释放: ${filePath}，持有者: ${lockInfo.owner}`);
        this.releaseRotationLock(filePath);
      } else {
        // 锁仍然有效，检查是否等待超时
        if (Date.now() - startTime > timeout) {
          // 超时但仍有重试次数
          if (retryCount < this.maxRetries) {
            // 计算下一次重试的延迟，使用指数退避
            const nextRetryDelay = Math.min(this.retryInterval * Math.pow(2, retryCount), 2000);

            // 添加随机抖动(±30%)
            const jitter = (Math.random() * 0.6 - 0.3) * nextRetryDelay;
            const delay = nextRetryDelay + jitter;

            // 等待后重试
            await new Promise(resolve => setTimeout(resolve, delay));

            // 递归重试，增加重试计数
            return this.acquireRotationLock(filePath, {
              timeout,
              retryCount: retryCount + 1,
            });
          }

          console.warn(`获取轮转锁超时: ${filePath}，已重试${retryCount}次`);
          return { success: false };
        }

        // 等待一段时间再检查
        await new Promise(resolve => setTimeout(resolve, 100));

        // 递归检查
        return this.acquireRotationLock(filePath, options);
      }
    }

    // 获取锁
    const lockId = `rotation-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    this.rotationLocks.set(filePath, {
      timestamp: Date.now(),
      owner: lockId,
      retryCount,
    });

    return {
      success: true,
      lockId,
    };
  }

  /**
   * 释放轮转操作锁
   * @param {string} filePath - 文件路径
   * @param {string} [lockId] - 锁ID，用于验证
   * @returns {boolean} 是否成功释放
   */
  releaseRotationLock(filePath, lockId) {
    // 如果指定了锁ID，验证所有权
    if (lockId) {
      const lockInfo = this.rotationLocks.get(filePath);
      if (!lockInfo || lockInfo.owner !== lockId) {
        return false; // 不是锁的所有者，不能释放
      }
    }

    this.rotationLocks.delete(filePath);
    return true;
  }
}

// 全局锁管理器实例
const lockManager = new FileLockManager();

/**
 * 文件传输类
 * @extends BaseTransport
 */
class FileTransport extends BaseTransport {
  /**
   * 创建文件传输实例
   * @param {Object} [options={}] - 传输选项
   * @param {string} options.filename - 日志文件名
   * @param {string} [options.dirname='.'] - 日志目录
   * @param {string|number} [options.maxSize='10m'] - 最大文件大小，支持k/m/g后缀
   * @param {number} [options.maxFiles=5] - 保留的最大文件数
   * @param {boolean} [options.compress=false] - 是否压缩旧日志
   * @param {string} [options.datePattern='YYYY-MM-DD'] - 日期格式化模式
   * @param {boolean} [options.createDirectory=true] - 是否自动创建目录
   * @param {boolean} [options.useLocking=true] - 是否使用文件锁
   * @param {boolean} [options.appendNewline=true] - 自动在每条日志后添加换行符
   * @param {string} [options.eol='\n'] - 行尾符
   * @param {string|function} [options.format] - 格式字符串或格式化函数
   * @param {Object} [options.formatOptions={}] - 格式化选项
   * @param {string} [options.extension='.log'] - 文件扩展名
   * @param {boolean} [options.json=false] - 是否使用JSON格式
   * @param {Object|function} [options.jsonReplacer=null] - JSON replacer函数
   * @param {number} [options.jsonSpace=2] - JSON格式化空格
   * @param {boolean} [options.tailable=true] - 是否按日期创建可追加的文件
   * @param {boolean} [options.rotateBySize=true] - 是否根据大小轮转日志
   * @param {boolean} [options.rotateByDate=false] - 是否根据日期轮转日志
   * @param {boolean} [options.zippedArchive=false] - 是否压缩归档日志
   */
  constructor(options = {}) {
    // 调用父类构造函数
    super({
      name: 'file',
      level: LOG_LEVELS.INFO,
      ...options,
    });

    // 验证和处理文件选项
    this._validateFileOptions(options);

    // 基本文件配置
    this.filename = options.filename;
    this.dirname = options.dirname || '.';
    this.fullpath = path.join(this.dirname, this.filename);
    this.extension = options.extension || '.log';

    // 文件大小和轮转配置
    this.maxSize = this._parseSize(options.maxSize || TRANSPORT.DEFAULT_FILE_MAX_SIZE);
    this.maxFiles = options.maxFiles || TRANSPORT.DEFAULT_FILE_MAX_FILES;
    this.rotateBySize = options.rotateBySize !== false;
    this.rotateByDate = options.rotateByDate === true;
    this.datePattern = options.datePattern || 'YYYY-MM-DD';
    this.tailable = options.tailable !== false;

    // 压缩配置
    this.compress = options.compress === true;
    this.zippedArchive = options.zippedArchive === true;

    // 格式化配置
    this.json = options.json === true;
    this.jsonReplacer = options.jsonReplacer || null;
    this.jsonSpace = options.jsonSpace || 2;
    this.format = options.format || this._defaultFormat;
    this.formatOptions = options.formatOptions || {};

    // 写入配置
    this.appendNewline = options.appendNewline !== false;
    this.eol = options.eol || '\n';
    this.createDirectory = options.createDirectory !== false;
    this.useLocking = options.useLocking !== false;

    // 文件状态
    this._size = 0;
    this._fileStream = null;
    this._currentFilename = '';
    this._currentFileDate = '';
    this._opening = false;
    this._reopening = false;
    this._fileError = null;
    this._rotateScheduled = false;
  }

  /**
   * 解析文件大小字符串
   * @private
   * @param {string|number} size - 大小字符串，如"10m", "1g"
   * @returns {number} 字节数
   */
  _parseSize(size) {
    if (typeof size === 'number') {
      return size;
    }

    const units = {
      b: 1,
      k: 1024,
      m: 1024 * 1024,
      g: 1024 * 1024 * 1024,
    };

    const match = /^(\d+)(b|k|m|g)$/i.exec(size.toString());
    if (!match) {
      return TRANSPORT.DEFAULT_FILE_MAX_SIZE;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    return value * (units[unit] || 1);
  }

  /**
   * 验证文件传输选项
   * @private
   * @param {Object} options - 选项对象
   * @throws {TransportConfigError} 如果选项无效
   */
  _validateFileOptions(options) {
    // 验证必需的文件名
    if (!options.filename) {
      throw new TransportConfigError('未指定filename选项');
    }

    // 验证文件大小格式
    if (options.maxSize && typeof options.maxSize === 'string') {
      const sizeRegex = /^(\d+)(b|k|m|g)$/i;
      if (!sizeRegex.test(options.maxSize)) {
        throw new TransportConfigError(
          `无效的maxSize格式: ${options.maxSize}。` + '有效格式示例: "10m", "1g"',
        );
      }
    }

    // 验证maxFiles是正整数
    if (
      options.maxFiles !== undefined &&
      (typeof options.maxFiles !== 'number' ||
        options.maxFiles < 0 ||
        !Number.isInteger(options.maxFiles))
    ) {
      throw new TransportConfigError('maxFiles必须是非负整数');
    }

    // 验证format是字符串或函数
    if (
      options.format !== undefined &&
      typeof options.format !== 'string' &&
      typeof options.format !== 'function'
    ) {
      throw new TransportConfigError('format必须是字符串或函数');
    }
  }

  /**
   * 默认的日志格式化函数
   * @private
   * @param {Object} logEntry - 日志条目
   * @returns {string} 格式化后的日志字符串
   */
  _defaultFormat(logEntry) {
    const { timestamp, level, message, environment } = logEntry;
    return `[${timestamp}] [${level}] [${environment}]: ${message}`;
  }

  /**
   * 格式化日志条目
   * @private
   * @param {Object} logEntry - 日志条目
   * @returns {string} 格式化后的字符串
   */
  _formatLog(logEntry) {
    // 首先使用父类的格式化方法
    const formattedEntry = this._formatLogEntry(logEntry);

    // JSON格式
    if (this.json) {
      return JSON.stringify(formattedEntry, this.jsonReplacer, this.jsonSpace);
    }

    // 自定义格式化函数
    if (typeof this.format === 'function') {
      return this.format(formattedEntry, this.formatOptions);
    }

    // 字符串格式模板
    if (typeof this.format === 'string') {
      let result = this.format;
      Object.entries(formattedEntry).forEach(([key, value]) => {
        result = result.replace(new RegExp(`%{${key}}`, 'g'), value);
      });
      return result;
    }

    // 默认格式
    return this._defaultFormat(formattedEntry);
  }

  /**
   * 获取当前日期格式化字符串
   * @private
   * @returns {string} 格式化后的日期字符串
   */
  _getFormattedDate() {
    const now = new Date();
    const pattern = this.datePattern;

    // 简单的日期格式化
    const replacements = {
      YYYY: now.getFullYear(),
      MM: String(now.getMonth() + 1).padStart(2, '0'),
      DD: String(now.getDate()).padStart(2, '0'),
      HH: String(now.getHours()).padStart(2, '0'),
      mm: String(now.getMinutes()).padStart(2, '0'),
      ss: String(now.getSeconds()).padStart(2, '0'),
    };

    let result = pattern;
    Object.entries(replacements).forEach(([key, value]) => {
      result = result.replace(key, value);
    });

    return result;
  }

  /**
   * 获取当前日志文件名
   * @private
   * @returns {string} 完整的日志文件路径
   */
  _getFilename() {
    let filename = this.filename;

    // 根据日期创建文件名
    if (this.rotateByDate) {
      const date = this._getFormattedDate();
      if (date !== this._currentFileDate) {
        this._currentFileDate = date;
        filename = `${this.filename}.${date}`;
      } else if (this._currentFilename) {
        return this._currentFilename;
      } else {
        filename = `${this.filename}.${date}`;
      }
    }

    // 添加扩展名
    if (!filename.endsWith(this.extension)) {
      filename = `${filename}${this.extension}`;
    }

    // 完整路径
    const filePath = path.join(this.dirname, filename);
    this._currentFilename = filePath;

    return filePath;
  }

  /**
   * 确保目录存在
   * @private
   * @returns {Promise<void>} 完成的Promise
   */
  async _ensureDirectory() {
    try {
      await fsAsync.access(this.dirname, fs.constants.F_OK);
    } catch (err) {
      if (this.createDirectory) {
        try {
          await fsAsync.mkdir(this.dirname, { recursive: true });
        } catch (mkdirErr) {
          throw new TransportError(`创建目录失败: ${this.dirname}`, mkdirErr);
        }
      } else {
        throw new TransportError(`目录不存在: ${this.dirname}`, err);
      }
    }
  }

  /**
   * 打开或创建日志文件
   * @private
   * @returns {Promise<void>} 完成的Promise
   */
  async _openFile() {
    // 防止多次打开
    if (this._opening) {
      return;
    }

    this._opening = true;
    const filename = this._getFilename();

    try {
      // 确保目录存在
      await this._ensureDirectory();

      // 检查文件大小
      try {
        const stat = await fsAsync.stat(filename);
        this._size = stat.size;
      } catch (err) {
        // 文件不存在，大小为0
        this._size = 0;
      }

      // 创建可写流
      this._fileStream = fs.createWriteStream(filename, {
        flags: 'a',
        encoding: 'utf8',
        mode: 0o666,
      });

      // 处理错误
      this._fileStream.on('error', err => {
        this._fileError = err;
        this._fileStream = null;
      });

      this._opening = false;
      this._fileError = null;
    } catch (err) {
      this._opening = false;
      this._fileError = err;
      throw new TransportError(`打开日志文件失败: ${filename}`, err);
    }
  }

  /**
   * 关闭日志文件
   * @private
   * @returns {Promise<void>} 完成的Promise
   */
  async _closeFile() {
    return new Promise((resolve, reject) => {
      if (!this._fileStream) {
        resolve();
        return;
      }

      const stream = this._fileStream;
      this._fileStream = null;

      stream.end(() => {
        stream.removeAllListeners();
        resolve();
      });

      // 处理错误
      stream.once('error', err => {
        stream.removeAllListeners();
        reject(err);
      });
    });
  }

  /**
   * 轮转日志文件
   * @private
   * @returns {Promise<void>} 完成的Promise
   */
  async _rotateFile() {
    // 防止多次轮转
    if (this._rotateScheduled) {
      return;
    }

    this._rotateScheduled = true;

    // 尝试获取轮转锁
    const filename = this._currentFilename;
    if (!filename) {
      this._rotateScheduled = false;
      return;
    }

    // 获取轮转锁
    const lockAcquired = await lockManager.acquireRotationLock(filename);
    if (!lockAcquired) {
      // 无法获取轮转锁，可能其他实例正在轮转
      this._rotateScheduled = false;
      return;
    }

    try {
      // 关闭当前文件
      await this._closeFile();

      // 获取所有相关日志文件
      const dirname = path.dirname(filename);
      const basename = path.basename(filename);
      const files = await fsAsync.readdir(dirname);

      // 按照修改时间排序，找出要轮转的文件
      const logFiles = [];
      for (const file of files) {
        // 仅处理当前日志文件相关的文件
        if (
          !file.startsWith(basename.replace(this.extension, '')) ||
          (!file.endsWith(this.extension) && !file.endsWith(`${this.extension}.gz`))
        ) {
          continue;
        }

        const filePath = path.join(dirname, file);
        const stat = await fsAsync.stat(filePath);
        logFiles.push({ name: file, path: filePath, mtime: stat.mtime });
      }

      // 对文件排序，最老的在前
      logFiles.sort((a, b) => a.mtime - b.mtime);

      // 如果超过最大文件数，删除最老的文件
      if (logFiles.length >= this.maxFiles && this.maxFiles > 0) {
        const toRemove = logFiles.slice(0, logFiles.length - this.maxFiles + 1);
        for (const file of toRemove) {
          try {
            await fsAsync.unlink(file.path);
          } catch (err) {
            // 删除失败，但继续处理
            console.error(`删除旧日志文件失败: ${file.path}`, err);
          }
        }
      }

      // 检查文件是否存在
      try {
        await fsAsync.access(filename, fs.constants.F_OK);

        // 重命名当前文件
        const timestamp = Date.now();
        const targetPath = `${filename}.${timestamp}`;
        await fsAsync.rename(filename, targetPath);

        // 压缩旧日志文件
        if (this.compress || this.zippedArchive) {
          try {
            const content = await fsAsync.readFile(targetPath);
            const compressed = await gzipAsync(content);
            await fsAsync.writeFile(`${targetPath}.gz`, compressed);
            await fsAsync.unlink(targetPath);
          } catch (err) {
            // 压缩失败，保留原文件
            console.error(`压缩日志文件失败: ${targetPath}`, err);
          }
        }
      } catch (err) {
        // 文件可能不存在，这是正常的，继续处理
        if (err.code !== 'ENOENT') {
          console.error(`轮转文件操作失败: ${filename}`, err);
        }
      }

      // 重新打开文件
      await this._openFile();
    } catch (err) {
      throw new TransportError('轮转日志文件失败', err);
    } finally {
      // 释放轮转锁
      lockManager.releaseRotationLock(filename);
      this._rotateScheduled = false;
      this._size = 0;
    }
  }

  /**
   * 检查是否需要轮转日志
   * @private
   * @returns {Promise<boolean>} 是否执行了轮转
   */
  async _checkRotate() {
    // 如果已经计划轮转，不重复检查
    if (this._rotateScheduled) {
      return false;
    }

    // 检查是否需要按大小轮转
    const needSizeRotate = this.rotateBySize && this._size >= this.maxSize;

    // 检查是否需要按日期轮转
    const currentDate = this._getFormattedDate();
    const needDateRotate =
      this.rotateByDate && this._currentFileDate && currentDate !== this._currentFileDate;

    // 如果不需要轮转，直接返回
    if (!needSizeRotate && !needDateRotate) {
      return false;
    }

    // 标记轮转计划
    this._rotateScheduled = true;

    try {
      // 获取轮转锁
      const { success, lockId } = await lockManager.acquireRotationLock(this._currentFilename, {
        timeout: 2000, // 轮转锁使用更短的超时时间
      });

      if (!success) {
        console.warn(`无法获取轮转锁，跳过轮转: ${this._currentFilename}`);
        this._rotateScheduled = false;
        return false;
      }

      try {
        // 执行轮转
        await this._rotateFile();
        return true;
      } finally {
        // 释放轮转锁
        lockManager.releaseRotationLock(this._currentFilename, lockId);
      }
    } catch (err) {
      console.error(`日志轮转失败: ${err.message}`);
      this._rotateScheduled = false;
      return false;
    }
  }

  /**
   * 加强的文件锁处理机制
   * @private
   * @param {string} filePath - 文件路径
   * @param {Function} callback - 文件操作回调
   * @returns {Promise<any>} 操作结果
   */
  async _withFileLock(filePath, callback) {
    const lockFile = `${filePath}.lock`;
    let lockRetries = 0;
    const maxRetries = (this._config && this._config.MAX_LOCK_RETRIES) || 5;
    const retryDelay = (this._config && this._config.LOCK_RETRY_DELAY) || 100;
    const lockTimeout = (this._config && this._config.LOCK_TIMEOUT) || 10000;

    // 尝试获取锁
    while (lockRetries < maxRetries) {
      try {
        // 检查锁文件是否已经存在
        const lockExists = await fsAsync
          .access(lockFile)
          .then(() => true)
          .catch(() => false);

        if (lockExists) {
          // 检查锁是否过期
          try {
            const stats = await fsAsync.stat(lockFile);
            const lockAge = Date.now() - stats.mtime.getTime();

            if (lockAge > lockTimeout) {
              // 锁已过期，强制释放
              await fsAsync.unlink(lockFile).catch(() => {});
              console.warn(`文件锁已过期(${lockAge}ms)，强制释放: ${lockFile}`);
            } else {
              // 锁被占用，等待后重试
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              lockRetries++;
              continue;
            }
          } catch (statErr) {
            // 无法获取锁文件状态，假设锁可能已经释放
            console.warn(`无法获取锁文件状态: ${statErr.message}`);
          }
        }

        // 创建锁文件
        const lockContent = `${process.pid || 'browser'}-${Date.now()}`;
        await fsAsync.writeFile(lockFile, lockContent);

        try {
          // 执行文件操作
          const result = await callback();
          return result;
        } finally {
          // 释放锁
          await fsAsync.unlink(lockFile).catch(unlinkErr => {
            console.warn(`释放文件锁失败: ${unlinkErr.message}`);
          });
        }
      } catch (err) {
        lockRetries++;
        if (lockRetries >= maxRetries) {
          throw new Error(`无法获取文件锁，已达到最大重试次数: ${err.message}`);
        }

        // 计算下一次重试的延迟，使用指数退避
        const nextRetryDelay = Math.min(retryDelay * Math.pow(1.5, lockRetries), 2000);

        // 添加随机抖动(±30%)
        const jitter = (Math.random() * 0.6 - 0.3) * nextRetryDelay;
        const delay = nextRetryDelay + jitter;

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error(`无法获取文件锁，已达到最大重试次数`);
  }

  /**
   * 使用文件锁写入数据
   * @private
   * @param {string} filePath - 文件路径
   * @param {string|Buffer} data - 要写入的数据
   * @param {Object} [options] - 写入选项
   * @returns {Promise<boolean>} 写入是否成功
   */
  async _writeWithLock(filePath, data, options = {}) {
    return this._withFileLock(filePath, async () => {
      // 执行实际的写入操作
      if (options.append) {
        await fsAsync.appendFile(filePath, data);
      } else {
        await fsAsync.writeFile(filePath, data);
      }
      return true;
    });
  }

  /**
   * 写入日志
   * @protected
   * @param {string|Object} formattedEntry - 格式化后的日志条目
   * @param {number} [retryCount=0] - 当前重试次数
   * @returns {Promise<boolean>} 写入是否成功
   */
  async _write(formattedEntry, retryCount = 0) {
    // 如果文件流不存在，打开文件
    if (!this._fileStream) {
      await this._openFile();
    }

    // 格式化日志
    let data =
      typeof formattedEntry === 'string' ? formattedEntry : this._formatLog(formattedEntry);

    // 添加换行符
    if (this.appendNewline && !data.endsWith(this.eol)) {
      data += this.eol;
    }

    try {
      // 检查是否需要轮转日志
      await this._checkRotate();

      // 使用文件锁处理写入
      if (this.useLocking) {
        // 使用新的文件锁机制
        await this._writeWithLock(this._currentFilename, data, { append: true });

        // 更新文件大小
        this._size += Buffer.byteLength(data);
        return true;
      } else {
        // 不使用文件锁，直接写入
        return new Promise((resolve, reject) => {
          this._fileStream.write(data, err => {
            if (err) {
              reject(new TransportError('写入日志失败', err));
            } else {
              // 更新文件大小
              this._size += Buffer.byteLength(data);
              resolve(true);
            }
          });
        });
      }
    } catch (error) {
      // 处理写入错误
      if (retryCount < this.maxRetries) {
        // 计算重试延迟
        const delay = Math.min(200 * Math.pow(1.5, retryCount), 3000);

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._write(formattedEntry, retryCount + 1);
      } else {
        // 超过重试次数，抛出错误
        throw new TransportError(`写入日志失败，已重试 ${retryCount} 次`, error);
      }
    }
  }

  /**
   * 批量写入日志（覆盖父类方法以优化性能）
   * @public
   * @param {Array<Object>} logEntries - 日志条目数组
   * @param {number} [retryCount=0] - 当前重试次数
   * @returns {Promise<boolean>} 是否全部成功写入
   */
  async bulkLog(logEntries, retryCount = 0) {
    if (!logEntries || logEntries.length === 0) {
      return true;
    }

    // 如果文件流不存在，打开文件
    if (!this._fileStream) {
      await this._openFile();
    }

    // 批量格式化日志
    const dataArray = logEntries.map(entry => {
      let data = this._formatLog(entry);

      // 添加换行符
      if (this.appendNewline && !data.endsWith(this.eol)) {
        data += this.eol;
      }

      return data;
    });

    // 合并为单一数据
    const data = dataArray.join('');

    try {
      // 检查是否需要轮转日志
      await this._checkRotate();

      // 使用文件锁处理写入
      if (this.useLocking) {
        // 使用新的文件锁机制
        await this._writeWithLock(this._currentFilename, data, { append: true });

        // 更新文件大小
        this._size += Buffer.byteLength(data);
        return true;
      } else {
        // 不使用文件锁，直接写入
        return new Promise((resolve, reject) => {
          this._fileStream.write(data, err => {
            if (err) {
              reject(new TransportError('批量写入日志失败', err));
            } else {
              // 更新文件大小
              this._size += Buffer.byteLength(data);
              resolve(true);
            }
          });
        });
      }
    } catch (error) {
      // 处理写入错误
      if (retryCount < this.maxRetries) {
        // 计算重试延迟
        const delay = Math.min(200 * Math.pow(1.5, retryCount), 3000);

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.bulkLog(logEntries, retryCount + 1);
      } else {
        // 超过重试次数，尝试单条写入
        console.warn(`批量写入失败，回退到单条处理: ${error.message}`);

        let success = true;
        for (const entry of logEntries) {
          try {
            await this._write(entry);
          } catch (e) {
            success = false;
            // 记录错误但继续处理
            console.error(`单条日志写入失败: ${e.message}`);
          }
        }

        return success;
      }
    }
  }

  /**
   * 初始化传输器
   * @public
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async init() {
    if (this._ready) {
      return true;
    }

    try {
      await this._ensureDirectory();
      await this._openFile();
      this._ready = true;
      return true;
    } catch (err) {
      this._ready = false;
      if (!this.silent) {
        throw err;
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

    try {
      await this._closeFile();
      this._destroyed = true;
      this._ready = false;
      return true;
    } catch (err) {
      if (!this.silent) {
        throw new TransportError('关闭文件传输失败', err);
      }
      return false;
    }
  }

  /**
   * 获取传输状态
   * @public
   * @returns {Object} 传输状态
   */
  getStatus() {
    const baseStatus = super.getStatus();
    return {
      ...baseStatus,
      filename: this._currentFilename,
      size: this._size,
      maxSize: this.maxSize,
      fileError: this._fileError ? this._fileError.message : null,
      isOpen: !!this._fileStream,
      opening: this._opening,
      rotateScheduled: this._rotateScheduled,
    };
  }
}

export default FileTransport;
