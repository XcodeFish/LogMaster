/**
 * @file 环境适配器索引
 * @module environments/index
 * @author LogMaster Team
 * @license MIT
 */

import BrowserEnvironment from './browser.js';
import NodeEnvironment from './node.js';

// 环境适配器类型常量
export const ENVIRONMENT_TYPES = {
  BROWSER: 'browser',
  NODE: 'node',
  UNKNOWN: 'unknown',
};

/**
 * 检测当前运行环境类型
 * @returns {string} 环境类型常量
 */
export function detectEnvironmentType() {
  // 检测Node.js环境
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return ENVIRONMENT_TYPES.NODE;
  }

  // 检测浏览器环境
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return ENVIRONMENT_TYPES.BROWSER;
  }

  // 未知环境
  return ENVIRONMENT_TYPES.UNKNOWN;
}

/**
 * 创建适合当前环境的环境适配器实例
 * @param {Object} [options={}] - 配置选项
 * @param {string} [options.forceType] - 强制使用的环境类型
 * @param {Function} [options.onReady] - 环境初始化完成后的回调函数
 * @param {boolean} [options.asyncInit=false] - 是否异步初始化
 * @returns {Object} 环境适配器实例
 * @throws {TypeError} 当参数类型不正确时抛出
 */
export function createEnvironment(options = {}) {
  // 参数校验
  if (options !== null && typeof options !== 'object') {
    throw new TypeError('options参数必须是一个对象或undefined');
  }

  // 确保options是对象
  const safeOptions = options || {};

  // 验证和处理forceType选项
  let envType = detectEnvironmentType();
  if (safeOptions.forceType !== undefined) {
    if (typeof safeOptions.forceType !== 'string') {
      throw new TypeError('options.forceType必须是字符串类型');
    }

    // 检查是否为有效的环境类型
    const validTypes = Object.values(ENVIRONMENT_TYPES);
    if (!validTypes.includes(safeOptions.forceType)) {
      console.warn(
        `警告：未知的环境类型 '${safeOptions.forceType}'，将使用自动检测的环境类型 '${envType}'`,
      );
    } else {
      envType = safeOptions.forceType;
    }
  }

  // 验证和处理asyncInit选项
  const asyncInit = safeOptions.asyncInit === true;

  // 验证和处理onReady选项
  let onReady = null;
  if (safeOptions.onReady !== undefined && typeof safeOptions.onReady !== 'function') {
    throw new TypeError('options.onReady必须是函数类型');
  } else if (typeof safeOptions.onReady === 'function') {
    onReady = safeOptions.onReady;
  }

  // 创建环境实例
  let envInstance;
  switch (envType) {
    case ENVIRONMENT_TYPES.BROWSER:
      envInstance = new BrowserEnvironment(safeOptions);
      break;
    case ENVIRONMENT_TYPES.NODE:
      envInstance = new NodeEnvironment(safeOptions);
      break;
    default:
      // 默认使用浏览器环境
      envInstance = new BrowserEnvironment(safeOptions);
  }

  // 处理初始化完成回调
  if (onReady) {
    if (asyncInit) {
      // 异步调用，确保当前执行上下文完成后调用
      setTimeout(() => {
        onReady(envInstance, envType);
      }, 0);
    } else {
      // 同步直接调用
      onReady(envInstance, envType);
    }
  }

  return envInstance;
}

/**
 * 创建特定环境的适配器并等待初始化完成
 * @param {Object} [options={}] - 配置选项
 * @returns {Promise<Object>} 返回Promise，解析为环境适配器实例
 */
export function createEnvironmentAsync(options = {}) {
  return new Promise(resolve => {
    createEnvironment({
      ...options,
      asyncInit: true,
      onReady: instance => {
        // 先调用Promise回调
        resolve(instance);

        // 如果用户也提供了回调，再调用它
        if (typeof options.onReady === 'function') {
          options.onReady(instance);
        }
      },
    });
  });
}

export { BrowserEnvironment, NodeEnvironment };
