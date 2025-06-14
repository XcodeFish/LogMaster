/**
 * @file 传输系统模块索引
 * @module transports
 * @author LogMaster
 * @license MIT
 */

import { BaseTransport, TransportError, TransportConfigError } from './base.js';
import FileTransport from './file.js';
import HTTPTransport from './http.js';
import { LOG_LEVELS, TRANSPORT } from '../core/constants.js';

// 传输类型映射
const TRANSPORT_TYPES = {
  FILE: 'file',
  HTTP: 'http',
  CONSOLE: 'console',
  MEMORY: 'memory',
  CUSTOM: 'custom',
};

// 版本信息
const VERSION = '1.0.0';

/**
 * 传输系统API
 * @namespace TransportAPI
 */
const TransportAPI = {
  /**
   * 创建传输器实例
   * @function create
   * @memberof TransportAPI
   * @param {string} type - 传输器类型
   * @param {Object} [options={}] - 传输器配置
   * @returns {BaseTransport} 传输器实例
   * @throws {TransportConfigError} 如果传输器类型不支持则抛出错误
   */
  create: (type, options = {}) => createTransport(type, options),

  /**
   * 创建文件传输器
   * @function createFileTransport
   * @memberof TransportAPI
   * @param {Object} [options={}] - 文件传输器配置
   * @returns {FileTransport} 文件传输器实例
   */
  createFileTransport: (options = {}) => new FileTransport(options),

  /**
   * 创建HTTP传输器
   * @function createHTTPTransport
   * @memberof TransportAPI
   * @param {Object} [options={}] - HTTP传输器配置
   * @returns {HTTPTransport} HTTP传输器实例
   */
  createHTTPTransport: (options = {}) => new HTTPTransport(options),

  /**
   * 批量创建多个传输器
   * @function createMultiple
   * @memberof TransportAPI
   * @param {Array<Object>} configs - 传输器配置数组
   * @returns {Array<BaseTransport>} 传输器实例数组
   */
  createMultiple: (configs = []) => {
    if (!Array.isArray(configs)) {
      throw new TransportConfigError('createMultiple需要一个配置数组');
    }

    return configs.map(config => {
      if (!config || !config.type) {
        throw new TransportConfigError('每个传输器配置必须包含type字段');
      }
      return createTransport(config.type, config.options || {});
    });
  },

  /**
   * 验证传输器实例
   * @function validateTransport
   * @memberof TransportAPI
   * @param {Object} transport - 要验证的传输器
   * @returns {boolean} 是否为有效的传输器
   */
  validateTransport: transport =>
    transport !== null &&
    typeof transport === 'object' &&
    typeof transport.log === 'function' &&
    (transport instanceof BaseTransport || typeof transport.id === 'string'),

  /**
   * 获取版本信息
   * @function getVersion
   * @memberof TransportAPI
   * @returns {string} 版本号
   */
  getVersion: () => VERSION,

  /**
   * 获取支持的传输类型
   * @function getSupportedTypes
   * @memberof TransportAPI
   * @returns {Object} 支持的传输类型
   */
  getSupportedTypes: () => ({ ...TRANSPORT_TYPES }),

  /**
   * 获取默认配置
   * @function getDefaultConfig
   * @memberof TransportAPI
   * @param {string} type - 传输器类型
   * @returns {Object} 默认配置
   */
  getDefaultConfig: type => {
    switch (type.toLowerCase()) {
      case TRANSPORT_TYPES.FILE:
        return {
          level: LOG_LEVELS.INFO,
          filename: 'logs/app.log',
          maxSize: TRANSPORT.DEFAULT_FILE_MAX_SIZE,
          maxFiles: TRANSPORT.DEFAULT_FILE_MAX_FILES,
          format: 'json',
        };
      case TRANSPORT_TYPES.HTTP:
        return {
          level: LOG_LEVELS.INFO,
          method: 'POST',
          path: TRANSPORT.HTTP_DEFAULT_PATH,
          timeout: TRANSPORT.HTTP_DEFAULT_TIMEOUT,
          maxPayloadSize: TRANSPORT.HTTP_DEFAULT_MAX_PAYLOAD_SIZE,
          contentType: TRANSPORT.HTTP_DEFAULT_CONTENT_TYPE,
          batch: true,
          batchInterval: TRANSPORT.HTTP_DEFAULT_BATCH_INTERVAL,
          maxRetries: TRANSPORT.DEFAULT_RETRY_COUNT,
        };
      default:
        return { level: LOG_LEVELS.INFO };
    }
  },
};

// 导出所有传输相关类和错误
export {
  BaseTransport,
  FileTransport,
  HTTPTransport,
  TransportError,
  TransportConfigError,
  TRANSPORT_TYPES,
};

/**
 * 创建传输器工厂函数
 * @param {string} type - 传输器类型
 * @param {Object} [options={}] - 传输器配置
 * @returns {BaseTransport} 传输器实例
 * @throws {TransportConfigError} 如果传输器类型不支持则抛出错误
 */
export function createTransport(type, options = {}) {
  if (!type || typeof type !== 'string') {
    throw new TransportConfigError('传输器类型必须是字符串');
  }

  // 合并默认配置
  const config = options || {};

  switch (type.toLowerCase()) {
    case TRANSPORT_TYPES.FILE:
      return new FileTransport(config);
    case TRANSPORT_TYPES.HTTP:
      return new HTTPTransport(config);
    case TRANSPORT_TYPES.CUSTOM:
      if (!config.implementation || typeof config.implementation !== 'function') {
        throw new TransportConfigError('自定义传输器需要提供implementation工厂函数');
      }
      return config.implementation(config);
    // 在后续版本中添加其他传输器类型
    default:
      throw new TransportConfigError(
        `不支持的传输器类型: ${type}。支持的类型: ${Object.values(TRANSPORT_TYPES).join(', ')}`,
      );
  }
}

/**
 * 兼容性别名 - 为了向后兼容旧版API
 * @deprecated 使用 createTransport 替代
 */
export const createLogger = createTransport;

// 默认导出 - 包含所有API和类
export default {
  ...TransportAPI,
  BaseTransport,
  FileTransport,
  HTTPTransport,
  TransportError,
  TransportConfigError,
  TRANSPORT_TYPES,
  VERSION,
};
