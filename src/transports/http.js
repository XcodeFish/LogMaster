/**
 * @file HTTP传输模块
 * @module transports/http
 * @author LogMaster
 * @license MIT
 */

// 根据环境导入不同的模块
import { BaseTransport, TransportConfigError, TransportError } from './base.js';
import { LOG_LEVELS, TRANSPORT } from '../core/constants.js';
import { environmentDetector } from '../core/utils.js';

// Node.js环境特定导入
let http, https, zlib, promisify, URL, gzipAsync, deflateAsync;
if (environmentDetector.isNode()) {
  http = require('http');
  https = require('https');
  zlib = require('zlib');
  URL = require('url').URL;
  promisify = require('util').promisify;

  // 压缩功能
  gzipAsync = promisify(zlib.gzip);
  deflateAsync = promisify(zlib.deflate);
}

// 身份验证类型
const AUTH_TYPES = {
  NONE: 'none',
  BASIC: 'basic',
  BEARER: 'bearer',
  CUSTOM: 'custom',
};

// 压缩类型
const COMPRESSION_TYPES = {
  NONE: 'none',
  GZIP: 'gzip',
  DEFLATE: 'deflate',
};

/**
 * HTTP传输类，用于通过HTTP协议发送日志到远程服务器
 * @extends BaseTransport
 */
class HTTPTransport extends BaseTransport {
  /**
   * 创建HTTP传输实例
   * @param {Object} [options={}] - 传输选项
   * @param {string} options.host - 目标服务器主机名
   * @param {number} [options.port] - 目标服务器端口
   * @param {string} [options.path='/log'] - 日志接收路径
   * @param {string} [options.url] - 完整URL（如果提供，将覆盖host、port和path）
   * @param {string} [options.method='POST'] - HTTP方法
   * @param {boolean} [options.ssl=false] - 是否使用SSL/TLS
   * @param {Object} [options.headers={}] - 自定义HTTP头
   * @param {string} [options.authType='none'] - 认证类型：'none', 'basic', 'bearer', 'custom'
   * @param {string} [options.username] - 基本认证用户名
   * @param {string} [options.password] - 基本认证密码
   * @param {string} [options.token] - Bearer令牌
   * @param {Function} [options.authProvider] - 自定义认证提供函数
   * @param {boolean} [options.batch=false] - 是否启用批处理
   * @param {number} [options.batchInterval=1000] - 批处理间隔(毫秒)
   * @param {number} [options.batchSize=10] - 批处理大小
   * @param {number} [options.maxRetries=TRANSPORT.DEFAULT_RETRY_COUNT] - 最大重试次数
   * @param {number} [options.retryDelay=TRANSPORT.DEFAULT_RETRY_DELAY] - 重试间隔(毫秒)
   * @param {boolean} [options.exponentialBackoff=true] - 是否使用指数退避策略
   * @param {string} [options.compression='none'] - 压缩类型：'none', 'gzip', 'deflate'
   * @param {number} [options.timeout=5000] - 请求超时(毫秒)
   * @param {number} [options.maxPayloadSize=1048576] - 最大负载大小(字节)，默认1MB
   * @param {number} [options.maxResponseSize=1048576] - 最大响应大小(字节)，默认1MB
   * @param {string} [options.contentType='application/json'] - 内容类型
   * @param {Object} [options.agent] - HTTP/HTTPS代理
   * @param {Object} [options.tls] - TLS/SSL选项
   * @param {boolean} [options.withCredentials=false] - 浏览器中是否允许跨域请求携带凭证
   */
  constructor(options = {}) {
    // 调用父类构造函数
    super({
      name: 'http',
      level: LOG_LEVELS.INFO,
      ...options,
    });

    // 检测环境
    this._isNode = environmentDetector.isNode();
    this._isBrowser = environmentDetector.isBrowser();

    // 验证环境支持
    if (!this._isNode && !this._isBrowser) {
      throw new TransportConfigError('HTTP传输仅支持Node.js和浏览器环境');
    }

    // 验证和处理HTTP选项
    this._validateHttpOptions(options);

    // 解析URL选项
    this._parseUrlOptions(options);

    // HTTP请求选项
    this.method = (options.method || 'POST').toUpperCase();
    this.headers = options.headers || {};
    this.contentType = options.contentType || 'application/json';
    this.timeout = options.timeout || 5000;
    this.maxPayloadSize = options.maxPayloadSize || 1048576; // 1MB
    this.maxResponseSize = options.maxResponseSize || 1048576; // 1MB 响应大小限制
    this.withCredentials = options.withCredentials === true;

    // Node.js特定选项
    if (this._isNode) {
      this.agent = options.agent || null;
      this.tlsOptions = options.tls || {};
    }

    // 认证配置
    this.authType = options.authType || AUTH_TYPES.NONE;
    this.username = options.username || '';
    this.password = options.password || '';
    this.token = options.token || '';
    this.authProvider = typeof options.authProvider === 'function' ? options.authProvider : null;

    // 批处理配置
    this.batch = options.batch === true;
    if (this.batch) {
      this.batchSize = options.batchSize || TRANSPORT.DEFAULT_BATCH_SIZE;
      this.batchInterval = options.batchInterval || 1000;
      this._batchQueue = [];
      this._batchTimer = null;
    }

    // 重试配置
    this.maxRetries = options.maxRetries || TRANSPORT.DEFAULT_RETRY_COUNT;
    this.retryDelay = options.retryDelay || TRANSPORT.DEFAULT_RETRY_DELAY;
    this.exponentialBackoff = options.exponentialBackoff !== false;

    // 压缩配置 (仅在Node.js环境中支持)
    this.compression =
      this._isNode && options.compression ? options.compression : COMPRESSION_TYPES.NONE;
    if (!Object.values(COMPRESSION_TYPES).includes(this.compression)) {
      this.compression = COMPRESSION_TYPES.NONE;
    }

    // 请求状态跟踪
    this._requestsTotal = 0;
    this._requestsFailed = 0;
    this._lastRequestTime = 0;
    this._lastResponseTime = 0;
    this._lastStatusCode = 0;
    this._lastError = null;
    this._batchQueueSize = 0;
  }

  /**
   * 验证HTTP传输选项
   * @private
   * @param {Object} options - 选项对象
   * @throws {TransportConfigError} 如果选项无效
   */
  _validateHttpOptions(options) {
    // URL或host是必需的
    if (!options.url && !options.host) {
      throw new TransportConfigError('必须提供url或host选项');
    }

    // 验证认证类型
    if (options.authType && !Object.values(AUTH_TYPES).includes(options.authType)) {
      throw new TransportConfigError(
        `无效的authType: ${options.authType}。` + `有效值: ${Object.values(AUTH_TYPES).join(', ')}`,
      );
    }

    // 验证基本认证
    if (options.authType === AUTH_TYPES.BASIC && (!options.username || !options.password)) {
      throw new TransportConfigError('基本认证需要提供username和password');
    }

    // 验证Bearer认证
    if (options.authType === AUTH_TYPES.BEARER && !options.token) {
      throw new TransportConfigError('Bearer认证需要提供token');
    }

    // 验证自定义认证
    if (options.authType === AUTH_TYPES.CUSTOM && typeof options.authProvider !== 'function') {
      throw new TransportConfigError('自定义认证需要提供authProvider函数');
    }

    // 验证压缩类型 (仅在Node.js环境中)
    if (
      this._isNode &&
      options.compression &&
      !Object.values(COMPRESSION_TYPES).includes(options.compression)
    ) {
      throw new TransportConfigError(
        `无效的compression: ${options.compression}。` +
          `有效值: ${Object.values(COMPRESSION_TYPES).join(', ')}`,
      );
    }

    // 验证HTTP方法
    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    if (options.method && !validMethods.includes(options.method.toUpperCase())) {
      throw new TransportConfigError(
        `无效的HTTP方法: ${options.method}。` + `有效值: ${validMethods.join(', ')}`,
      );
    }
  }

  /**
   * 解析URL选项，处理主机名、端口和路径
   * @private
   * @param {Object} options - 配置选项
   */
  _parseUrlOptions(options) {
    // 如果提供了完整URL，解析它
    if (options.url) {
      try {
        // 确保URL有协议前缀
        let urlString = options.url;
        if (!urlString.match(/^https?:\/\//i)) {
          // 默认使用http协议
          urlString = `http://${urlString}`;
        }

        // 浏览器和Node.js都有URL API
        const urlObj = new URL(urlString);
        this.protocol = urlObj.protocol;
        this.host = urlObj.hostname;
        this.port = urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80);
        this.path = urlObj.pathname + urlObj.search || '/log';

        // 根据协议设置SSL标志
        this.ssl = urlObj.protocol === 'https:';
      } catch (err) {
        throw new TransportConfigError(`无效的URL: ${options.url}`);
      }
    } else {
      // 否则从单独的参数构建
      this.host = options.host;

      // 检查主机名是否包含协议
      if (this.host.match(/^https?:\/\//i)) {
        const urlObj = new URL(this.host);
        this.host = urlObj.hostname;
        this.protocol = urlObj.protocol;
        this.ssl = urlObj.protocol === 'https:';
        if (urlObj.port) {
          this.port = parseInt(urlObj.port, 10);
        } else {
          this.port = this.ssl ? 443 : 80;
        }
      } else {
        this.port = options.port || (options.ssl ? 443 : 80);
        this.ssl = options.ssl === true;
        this.protocol = this.ssl ? 'https:' : 'http:';
      }

      this.path = options.path || '/log';
    }

    // 构建完整URL (用于浏览器fetch和Node.js调试)
    this.url = `${this.protocol}//${this.host}:${this.port}${this.path}`;
  }

  /**
   * 获取认证头
   * @private
   * @returns {Object} 包含认证头的对象
   */
  async _getAuthHeaders() {
    const headers = {};

    switch (this.authType) {
      case AUTH_TYPES.BASIC: {
        // 基本认证在浏览器和Node.js中的实现方式相同
        let credentials;
        if (typeof btoa === 'function') {
          // 浏览器环境
          credentials = btoa(`${this.username}:${this.password}`);
        } else {
          // Node.js环境
          credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
        }
        headers['Authorization'] = `Basic ${credentials}`;
        break;
      }
      case AUTH_TYPES.BEARER:
        headers['Authorization'] = `Bearer ${this.token}`;
        break;
      case AUTH_TYPES.CUSTOM:
        if (this.authProvider) {
          try {
            const customHeaders = await this.authProvider();
            Object.assign(headers, customHeaders);
          } catch (err) {
            throw new TransportError('自定义认证提供器失败', err);
          }
        }
        break;
      case AUTH_TYPES.NONE:
      default:
        // 不添加认证头
        break;
    }

    return headers;
  }

  /**
   * 压缩数据 (仅限Node.js环境)
   * @private
   * @param {string|Buffer} data - 要压缩的数据
   * @returns {Promise<Buffer>} 压缩后的数据
   */
  async _compressData(data) {
    // 浏览器环境不支持压缩
    if (!this._isNode) {
      return data;
    }

    if (this.compression === COMPRESSION_TYPES.GZIP) {
      return gzipAsync(data);
    } else if (this.compression === COMPRESSION_TYPES.DEFLATE) {
      return deflateAsync(data);
    }
    return Buffer.from(data);
  }

  /**
   * 发送HTTP请求
   * @private
   * @param {string|Object} data - 要发送的数据
   * @param {number} [retryCount=0] - 当前重试次数
   * @returns {Promise<Object>} 请求结果
   */
  async _sendRequest(data, retryCount = 0) {
    // 准备请求数据
    let requestData;
    if (typeof data === 'string') {
      requestData = data;
    } else {
      try {
        requestData = JSON.stringify(data);
      } catch (err) {
        throw new TransportError('数据序列化失败', err);
      }
    }

    // 检查数据大小
    const dataSize = this._getDataSize(requestData);
    if (dataSize > this.maxPayloadSize) {
      throw new TransportError(`数据大小(${dataSize})超过最大负载大小(${this.maxPayloadSize})`);
    }

    // 压缩数据 (仅限Node.js)
    let compressedData = requestData;
    if (this._isNode && this.compression !== COMPRESSION_TYPES.NONE) {
      try {
        compressedData = await this._compressData(requestData);
      } catch (err) {
        throw new TransportError('数据压缩失败', err);
      }
    }

    // 根据环境选择发送方法
    if (this._isBrowser) {
      return this._sendBrowserRequest(compressedData, retryCount);
    } else {
      return this._sendNodeRequest(compressedData, retryCount);
    }
  }

  /**
   * 获取数据大小
   * @private
   * @param {string|Buffer} data - 要计算大小的数据
   * @returns {number} 数据大小（字节）
   */
  _getDataSize(data) {
    if (this._isBrowser) {
      // 浏览器环境
      return new Blob([data]).size;
    } else {
      // Node.js环境
      return Buffer.byteLength(data);
    }
  }

  /**
   * 使用浏览器的fetch API发送请求
   * @private
   * @param {string} data - 要发送的数据
   * @param {number} retryCount - 当前重试次数
   * @returns {Promise<Object>} 请求结果
   */
  async _sendBrowserRequest(data, retryCount = 0) {
    // 准备请求头
    const headers = {
      'Content-Type': this.contentType,
      ...this.headers,
    };

    // 添加认证头
    const authHeaders = await this._getAuthHeaders();
    Object.assign(headers, authHeaders);

    // 跟踪请求
    this._requestsTotal++;
    this._lastRequestTime = Date.now();

    // 请求选项
    const fetchOptions = {
      method: this.method,
      headers,
      body: this.method !== 'GET' ? data : undefined,
      credentials: this.withCredentials ? 'include' : 'same-origin',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
    };

    try {
      // 发送请求
      const response = await fetch(this.url, fetchOptions);

      // 更新响应信息
      this._lastResponseTime = Date.now();
      this._lastStatusCode = response.status;

      // 检查响应大小
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > this.maxResponseSize) {
        this._requestsFailed++;
        const error = new TransportError(
          `HTTP响应数据过大，超过${this.maxResponseSize}字节限制`,
          new Error('Response too large'),
        );
        error.statusCode = response.status;
        error.responseSize = parseInt(contentLength, 10);

        // 检查是否应该重试
        if (this._shouldRetry(null, retryCount)) {
          return this._retryRequest(data, error, retryCount);
        }
        throw error;
      }

      // 处理响应数据
      const processedResponse = await this._processResponse(response);

      // 判断响应是否成功
      if (response.ok) {
        return {
          statusCode: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          data: processedResponse,
          timings: {
            request: this._lastRequestTime,
            response: this._lastResponseTime,
            duration: this._lastResponseTime - this._lastRequestTime,
          },
        };
      } else {
        // 请求失败
        this._requestsFailed++;
        const error = new TransportError(
          `HTTP请求失败，状态码: ${response.status}`,
          new Error(processedResponse || '无响应数据'),
        );
        error.statusCode = response.status;
        error.data = processedResponse;

        // 检查是否应该重试
        if (this._shouldRetry(response.status, retryCount)) {
          return this._retryRequest(data, error, retryCount);
        }

        throw error;
      }
    } catch (err) {
      // 网络错误或其他错误
      this._requestsFailed++;
      this._lastError = err;

      // 包装错误
      const error = new TransportError('HTTP请求错误', err);

      // 检查是否应该重试
      if (this._shouldRetry(null, retryCount)) {
        return this._retryRequest(data, error, retryCount);
      }

      throw error;
    }
  }

  /**
   * 使用Node.js的http/https模块发送请求
   * @private
   * @param {string|Buffer} data - 要发送的数据
   * @param {number} retryCount - 当前重试次数
   * @returns {Promise<Object>} 请求结果
   */
  async _sendNodeRequest(data, retryCount = 0) {
    // 准备请求头
    const headers = {
      'Content-Type': this.contentType,
      'Content-Length': Buffer.byteLength(data),
      ...this.headers,
    };

    // 添加压缩头
    if (this.compression === COMPRESSION_TYPES.GZIP) {
      headers['Content-Encoding'] = 'gzip';
    } else if (this.compression === COMPRESSION_TYPES.DEFLATE) {
      headers['Content-Encoding'] = 'deflate';
    }

    // 添加认证头
    const authHeaders = await this._getAuthHeaders();
    Object.assign(headers, authHeaders);

    // 请求选项
    const requestOptions = {
      hostname: this.host,
      port: this.port,
      path: this.path,
      method: this.method,
      headers,
      timeout: this.timeout,
      agent: this.agent,
    };

    // 添加TLS选项（如果需要）
    if (this.ssl && this.tlsOptions) {
      Object.assign(requestOptions, this.tlsOptions);
    }

    // 跟踪请求
    this._requestsTotal++;
    this._lastRequestTime = Date.now();

    // 返回HTTP请求的Promise
    return new Promise((resolve, reject) => {
      // 选择HTTP/HTTPS模块
      const httpModule = this.ssl ? https : http;

      // 创建请求
      const req = httpModule.request(requestOptions, res => {
        // 更新响应信息
        this._lastResponseTime = Date.now();
        this._lastStatusCode = res.statusCode;

        // 响应数据和大小跟踪
        let responseData = '';
        let responseSize = 0;
        let responseTooLarge = false;

        res.on('data', chunk => {
          // 检查响应大小是否超过限制
          responseSize += chunk.length;
          if (responseSize > this.maxResponseSize) {
            responseTooLarge = true;
            // 中止请求
            req.abort();
            return;
          }
          responseData += chunk;
        });

        // 响应结束
        res.on('end', () => {
          // 检查是否因响应过大而中止
          if (responseTooLarge) {
            this._requestsFailed++;
            const error = new TransportError(
              `HTTP响应数据过大，超过${this.maxResponseSize}字节限制`,
              new Error('Response too large'),
            );
            error.statusCode = res.statusCode;
            error.responseSize = responseSize;

            // 检查是否应该重试
            if (this._shouldRetry(null, retryCount)) {
              this._retryRequest(data, error, retryCount, resolve, reject);
            } else {
              reject(error);
            }
            return;
          }

          // 检查状态码
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // 成功
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: responseData,
              timings: {
                request: this._lastRequestTime,
                response: this._lastResponseTime,
                duration: this._lastResponseTime - this._lastRequestTime,
              },
            });
          } else {
            // 服务器错误
            this._requestsFailed++;
            const error = new TransportError(
              `HTTP请求失败，状态码: ${res.statusCode}`,
              new Error(responseData || '无响应数据'),
            );
            error.statusCode = res.statusCode;
            error.headers = res.headers;
            error.data = responseData;

            // 检查是否应该重试
            if (this._shouldRetry(res.statusCode, retryCount)) {
              this._retryRequest(data, error, retryCount, resolve, reject);
            } else {
              reject(error);
            }
          }
        });
      });

      // 错误处理
      req.on('error', err => {
        this._requestsFailed++;
        this._lastError = err;

        // 包装错误
        const error = new TransportError('HTTP请求错误', err);

        // 检查是否应该重试
        if (this._shouldRetry(null, retryCount)) {
          this._retryRequest(data, error, retryCount, resolve, reject);
        } else {
          reject(error);
        }
      });

      // 超时处理
      req.on('timeout', () => {
        this._requestsFailed++;
        req.abort();
        const error = new TransportError('HTTP请求超时');

        // 检查是否应该重试
        if (this._shouldRetry(null, retryCount)) {
          this._retryRequest(data, error, retryCount, resolve, reject);
        } else {
          reject(error);
        }
      });

      // 发送数据
      req.write(data);
      req.end();
    });
  }

  /**
   * 判断是否应该重试请求
   * @private
   * @param {number|null} statusCode - HTTP状态码
   * @param {number} retryCount - 当前重试次数
   * @returns {boolean} 是否应该重试
   */
  _shouldRetry(statusCode, retryCount) {
    // 达到最大重试次数
    if (retryCount >= this.maxRetries) {
      return false;
    }

    // 根据状态码判断是否应该重试
    if (statusCode) {
      // 5xx服务器错误、429请求过多或408请求超时可以重试
      return statusCode >= 500 || statusCode === 429 || statusCode === 408;
    }

    // 网络错误等情况可以重试
    return true;
  }

  /**
   * 重试HTTP请求
   * @private
   * @param {string|Object} data - 要发送的数据
   * @param {Error} error - 错误对象
   * @param {number} retryCount - 当前重试次数
   * @param {Function} [resolve] - Promise resolve函数 (仅Node.js环境使用)
   * @param {Function} [reject] - Promise reject函数 (仅Node.js环境使用)
   * @returns {Promise<Object>} 浏览器环境中返回Promise
   */
  _retryRequest(data, error, retryCount, resolve, reject) {
    // 计算重试延迟
    let delay = this.retryDelay;

    // 使用指数退避策略
    if (this.exponentialBackoff) {
      delay = Math.min(
        this.retryDelay * Math.pow(2, retryCount),
        60000, // 最大延迟60秒
      );
    }

    // 添加随机抖动，避免所有客户端同时重试
    const jitter = Math.random() * 0.3 * delay;
    delay += jitter;

    // 浏览器环境直接返回Promise
    if (this._isBrowser) {
      return new Promise((resolveRetry, rejectRetry) => {
        setTimeout(async () => {
          try {
            // 重试请求
            const result = await this._sendRequest(data, retryCount + 1);
            resolveRetry(result);
          } catch (retryError) {
            rejectRetry(retryError);
          }
        }, delay);
      });
    }

    // Node.js环境使用传入的resolve/reject
    setTimeout(async () => {
      try {
        // 重试请求
        const result = await this._sendRequest(data, retryCount + 1);
        resolve(result);
      } catch (retryError) {
        reject(retryError);
      }
    }, delay);
  }

  /**
   * 实际写入日志的方法（发送到HTTP服务器）
   * @protected
   * @param {Object} logEntry - 日志条目
   * @returns {Promise<boolean>} 是否写入成功
   */
  async _write(logEntry) {
    // 检查是否启用批处理
    if (this.batch) {
      return this._addToBatch(logEntry);
    }

    try {
      // 为日志条目添加额外信息
      const formattedEntry = this._formatLogEntry(logEntry);

      // 发送HTTP请求
      await this._sendRequest(formattedEntry);
      return true;
    } catch (err) {
      throw new TransportError('HTTP日志传输失败', err);
    }
  }

  /**
   * 格式化日志条目，添加额外信息
   * @private
   * @param {Object} logEntry - 原始日志条目
   * @returns {Object} 格式化后的日志条目
   */
  _formatLogEntry(logEntry) {
    return {
      ...logEntry,
      transportId: this.id,
      timestamp: new Date().toISOString(),
      transportName: this.name,
    };
  }

  /**
   * 将日志添加到批处理队列
   * @private
   * @param {Object} logEntry - 日志条目
   * @returns {Promise<boolean>} 操作是否成功
   */
  _addToBatch(logEntry) {
    // 格式化日志条目
    const formattedEntry = this._formatLogEntry(logEntry);

    // 添加到队列
    this._batchQueue.push(formattedEntry);
    this._batchQueueSize = this._batchQueue.length;

    // 检查内存使用情况，如果过高则立即发送批处理
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      // 如果堆内存使用超过可用内存的80%，立即发送批处理
      if (memUsage.heapUsed / memUsage.heapTotal > 0.8) {
        this._sendBatch();
        return Promise.resolve(true);
      }
    }

    // 如果达到批处理大小，立即发送
    if (this._batchQueue.length >= this.batchSize) {
      this._sendBatch();
      return Promise.resolve(true);
    }

    // 如果这是队列中的第一项，启动定时器
    if (this._batchQueue.length === 1 && !this._batchTimer) {
      this._batchTimer = setTimeout(() => {
        this._sendBatch();
      }, this.batchInterval);
    }

    return Promise.resolve(true);
  }

  /**
   * 发送批处理队列
   * @private
   */
  async _sendBatch() {
    // 清除定时器
    if (this._batchTimer) {
      clearTimeout(this._batchTimer);
      this._batchTimer = null;
    }

    // 如果队列为空，不执行任何操作
    if (this._batchQueue.length === 0) {
      return;
    }

    // 记录批处理开始时间，用于性能监控
    const batchStartTime = Date.now();

    // 获取并清空当前队列
    const batchItems = [...this._batchQueue];
    this._batchQueue = [];
    this._batchQueueSize = 0;

    // 批量发送
    try {
      await this.bulkLog(batchItems);

      // 计算批处理性能并动态调整批处理大小
      const batchDuration = Date.now() - batchStartTime;
      const itemsPerSecond = (batchItems.length / batchDuration) * 1000;

      // 如果处理速度很快，考虑增加批处理大小以提高效率
      if (batchDuration < 200 && this.batchSize < 10000 && itemsPerSecond > 5000) {
        this.batchSize = Math.min(10000, Math.floor(this.batchSize * 1.2));
      }
      // 如果处理时间过长，减小批处理大小以减少延迟
      else if (batchDuration > 2000 && this.batchSize > 1000) {
        this.batchSize = Math.max(1000, Math.floor(this.batchSize * 0.8));
      }
    } catch (err) {
      // 批量发送失败，错误已经在bulkLog中处理
      if (!this.silent) {
        console.error('HTTP批量日志发送失败:', err);
      }

      // 如果发生错误，减小批处理大小以提高可靠性
      if (this.batchSize > 1000) {
        this.batchSize = Math.max(1000, Math.floor(this.batchSize * 0.5));
      }
    }
  }

  /**
   * 批量发送日志
   * @public
   * @param {Array<Object>} logEntries - 日志条目数组
   * @returns {Promise<boolean>} 是否全部成功发送
   */
  async bulkLog(logEntries) {
    if (!logEntries || logEntries.length === 0) {
      return true;
    }

    // 更新队列大小统计
    this._batchQueueSize = logEntries.length;

    // 批量发送
    try {
      // 发送包含多条日志的单一请求
      await this._sendRequest({ logs: logEntries });
      return true;
    } catch (err) {
      // 如果批量发送失败，尝试单条发送
      let hasError = false;

      for (const entry of logEntries) {
        try {
          await this._sendRequest(entry);
        } catch (singleError) {
          hasError = true;
          // 记录错误但继续处理其他日志
          if (this.silent) {
            console.error('HTTP单条日志发送失败:', singleError);
          }
        }
      }

      if (hasError && !this.silent) {
        throw new TransportError('部分HTTP日志发送失败', err);
      }

      return !hasError;
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
      // 测试连接
      await this._sendRequest({
        type: 'init',
        timestamp: new Date().toISOString(),
        message: 'HTTPTransport initialization',
      });

      this._ready = true;
      return true;
    } catch (err) {
      this._ready = false;
      this._lastError = err;

      if (this.silent) {
        console.error('HTTP传输初始化失败:', err);
        return false;
      }
      throw err;
    }
  }

  /**
   * 销毁传输器
   * @public
   * @returns {Promise<boolean>} 销毁是否成功
   */
  async destroy() {
    try {
      // 发送剩余的批处理队列
      if (this.batch && this._batchQueue.length > 0) {
        await this._sendBatch();
      }

      // 清除定时器
      if (this._batchTimer) {
        clearTimeout(this._batchTimer);
        this._batchTimer = null;
      }

      // 发送关闭通知
      try {
        await this._sendRequest({
          type: 'shutdown',
          timestamp: new Date().toISOString(),
          message: 'HTTPTransport shutdown',
        });
      } catch (err) {
        // 忽略关闭通知的错误
      }

      this._ready = false;
      return true;
    } catch (err) {
      if (this.silent) {
        console.error('HTTP传输销毁失败:', err);
        return false;
      }
      throw new TransportError('HTTP传输销毁失败', err);
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
      url: this.url,
      requestsTotal: this._requestsTotal,
      requestsFailed: this._requestsFailed,
      lastStatusCode: this._lastStatusCode,
      lastRequestTime: this._lastRequestTime ? new Date(this._lastRequestTime).toISOString() : null,
      lastResponseTime: this._lastResponseTime
        ? new Date(this._lastResponseTime).toISOString()
        : null,
      batchQueueSize: this._batchQueueSize,
      compression: this.compression,
    };
  }

  /**
   * 清除批处理队列，取消所有待发送的日志
   * @public
   * @returns {boolean} 操作是否成功
   */
  clearBatch() {
    if (this._batchTimer) {
      clearTimeout(this._batchTimer);
      this._batchTimer = null;
    }

    this._batchQueue = [];
    this._batchQueueSize = 0;
    return true;
  }

  /**
   * 处理HTTP响应数据
   * @private
   * @param {Response} response - Fetch API响应对象
   * @returns {Promise<Object>} 解析后的响应数据
   */
  async _processResponse(response) {
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';

    // 流式响应处理
    if (response.body) {
      // 创建读取器
      const reader = response.body.getReader();
      const chunks = [];
      let totalLength = 0;

      // 处理数据块
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;

        if (!done) {
          const value = result.value;
          chunks.push(value);
          totalLength += value.length;

          // 检查响应大小是否超过限制
          if (totalLength > this.maxResponseSize) {
            reader.cancel();
            throw new Error(`HTTP响应数据过大，超过${this.maxResponseSize}字节限制`);
          }
        }
      }

      // 合并所有数据块
      const allChunks = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, offset);
        offset += chunk.length;
      }

      // 转换为文本
      const text = new TextDecoder().decode(allChunks);

      // 解析JSON (如果适用)
      if (contentType.includes('application/json')) {
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error(`无效的JSON响应: ${e.message}`);
        }
      }

      return text;
    } else {
      // 回退到标准方法
      if (contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    }
  }
}

export default HTTPTransport;
