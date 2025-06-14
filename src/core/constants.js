/**
 * @file 常量定义模块
 * @module constants
 * @author LogMaster
 * @license MIT
 */

/**
 * 日志级别常量，数值越小等级越低
 * @enum {number}
 */
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4,
};

/**
 * 日志级别名称映射
 * @enum {string}
 */
export const LOG_LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR',
  4: 'SILENT',
};

/**
 * 颜色定义常量
 * @enum {string}
 */
export const COLORS = {
  DEBUG: '#0066cc',
  INFO: '#00aa00',
  WARN: '#ffaa00',
  ERROR: '#ff3300',
  TIMESTAMP: '#888888',
  BADGE: '#f0f0f0',
  STACK: '#666666',
  RESET: '',
};

/**
 * 图标定义常量
 * @enum {string}
 */
export const ICONS = {
  DEBUG: '🔹',
  INFO: 'ℹ️',
  WARN: '⚠️',
  ERROR: '❌',
  GROUP: '📂',
  GROUP_END: '📂',
  TABLE: '📊',
};

/**
 * 环境类型定义
 * @enum {string}
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  TESTING: 'testing',
  PRODUCTION: 'production',
};

/**
 * 默认配置常量
 * @enum {*}
 */
export const DEFAULT_CONFIG = {
  ENVIRONMENT: ENVIRONMENTS.DEVELOPMENT,
  LOG_LEVEL: LOG_LEVELS.DEBUG,
  USE_COLORS: true,
  SHOW_TIMESTAMP: true,
  SHOW_BADGE: true,
  STACK_TRACE_ENABLED: true,
  MAX_ARRAY_LENGTH: 100,
  MAX_STRING_LENGTH: 10000,
  STACK_TRACE_LIMIT: 10,
  DATE_FORMAT: 'HH:mm:ss',
};

/**
 * 主题相关常量
 * @enum {object}
 */
export const THEMES = {
  DEFAULT: {
    badge: COLORS.BADGE,
    timestamp: COLORS.TIMESTAMP,
    debug: COLORS.DEBUG,
    info: COLORS.INFO,
    warn: COLORS.WARN,
    error: COLORS.ERROR,
    stack: COLORS.STACK,
  },
  DARK: {
    badge: '#333333',
    timestamp: '#aaaaaa',
    debug: '#6699cc',
    info: '#66cc66',
    warn: '#ddaa00',
    error: '#ff6666',
    stack: '#999999',
  },
  MINIMAL: {
    badge: '#f8f8f8',
    timestamp: '#999999',
    debug: '#666666',
    info: '#444444',
    warn: '#cc8800',
    error: '#cc0000',
    stack: '#aaaaaa',
  },
};

/**
 * 传输相关常量
 */
export const TRANSPORT = {
  DEFAULT_BATCH_SIZE: 5000,
  DEFAULT_RETRY_COUNT: 3,
  DEFAULT_RETRY_DELAY: 1000,
  DEFAULT_BATCH_TIMEOUT: 1000,
  DEFAULT_BATCH_RETRY_COUNT: 2,
  DEFAULT_FILE_MAX_SIZE: '10m',
  DEFAULT_FILE_MAX_FILES: 5,
  HTTP_DEFAULT_TIMEOUT: 5000,
  HTTP_DEFAULT_MAX_PAYLOAD_SIZE: 1048576, // 1MB
  HTTP_DEFAULT_CONTENT_TYPE: 'application/json',
  HTTP_DEFAULT_PATH: '/log',
  HTTP_DEFAULT_BATCH_INTERVAL: 1000,
  HTTP_TIMEOUT_ERROR: 'timeout',
  HTTP_NETWORK_ERROR: 'network_error',
  HTTP_SERVER_ERROR: 'server_error',
  HTTP_AUTH_ERROR: 'auth_error',
};
