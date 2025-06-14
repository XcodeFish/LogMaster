/**
 * @file 日志格式化模块
 * @module formatter
 * @author LogMaster
 * @license MIT
 */

import { COLORS, DEFAULT_CONFIG } from './constants';

/**
 * 格式化时间
 * @param {Date} date - 日期对象
 * @param {string} format - 输出格式，默认 'HH:mm:ss'
 * @returns {string} 格式化后的时间字符串
 */
export const formatTime = (date, format = DEFAULT_CONFIG.DATE_FORMAT) => {
  if (!date || !(date instanceof Date)) {
    date = new Date();
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  return format
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
    .replace('SSS', milliseconds);
};

/**
 * 应用样式到文本
 * @param {string} text - 要应用样式的文本
 * @param {string} color - 颜色代码
 * @param {boolean} isBrowser - 是否在浏览器环境中
 * @returns {Array|string} 浏览器环境返回数组 [文本, 样式]，Node环境返回带样式的字符串
 */
export const applyStyle = (text, color, isBrowser = true) => {
  // 浏览器环境
  if (isBrowser) {
    return [`%c${text}`, `color: ${color}; font-weight: bold;`];
  }

  // Node.js环境 - 简单实现终端颜色
  // 在实际项目中，应该使用专门的终端颜色库或更复杂的逻辑
  const colorMap = {
    [COLORS.DEBUG]: '\x1b[34m', // 蓝色
    [COLORS.INFO]: '\x1b[32m', // 绿色
    [COLORS.WARN]: '\x1b[33m', // 黄色
    [COLORS.ERROR]: '\x1b[31m', // 红色
    [COLORS.RESET]: '\x1b[0m', // 重置
  };

  const colorCode = colorMap[color] || '';
  const resetCode = colorMap[COLORS.RESET];
  return `${colorCode}${text}${resetCode}`;
};

/**
 * 序列化对象为字符串
 * @param {any} obj - 需要序列化的对象
 * @param {number} maxArrayLength - 数组最大长度
 * @param {number} maxStringLength - 字符串最大长度
 * @param {number} depth - 当前递归深度
 * @param {number} maxDepth - 最大递归深度
 * @returns {string} 序列化后的字符串
 */
export const serializeObject = (
  obj,
  maxArrayLength = DEFAULT_CONFIG.MAX_ARRAY_LENGTH,
  maxStringLength = DEFAULT_CONFIG.MAX_STRING_LENGTH,
  depth = 0,
  maxDepth = 3,
) => {
  // 处理null和undefined
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';

  // 处理基本类型
  if (typeof obj !== 'object' && typeof obj !== 'function') {
    if (typeof obj === 'string') {
      // 截断过长的字符串
      if (obj.length > maxStringLength) {
        return `"${obj.substring(0, maxStringLength)}...（已截断，完整长度：${obj.length}）"`;
      }
      return `"${obj}"`;
    }
    return String(obj);
  }

  // 防止循环引用和过深递归
  if (depth >= maxDepth) {
    return '[对象嵌套过深]';
  }

  // 处理日期对象
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // 处理错误对象
  if (obj instanceof Error) {
    return formatError(obj);
  }

  // 处理数组
  if (Array.isArray(obj)) {
    // 截断过长的数组
    if (obj.length > maxArrayLength) {
      const visibleItems = obj.slice(0, maxArrayLength);
      const serialized = visibleItems
        .map(item => serializeObject(item, maxArrayLength, maxStringLength, depth + 1, maxDepth))
        .join(', ');
      return `[${serialized}, ...（已截断，完整长度：${obj.length}）]`;
    }

    const serialized = obj
      .map(item => serializeObject(item, maxArrayLength, maxStringLength, depth + 1, maxDepth))
      .join(', ');
    return `[${serialized}]`;
  }

  // 处理函数
  if (typeof obj === 'function') {
    return `[Function: ${obj.name || 'anonymous'}]`;
  }

  // 处理特殊对象类型
  if (obj instanceof RegExp) return String(obj);
  if (obj instanceof Map) {
    return `Map(${obj.size}) { ${Array.from(obj)
      .map(
        ([k, v]) =>
          `${serializeObject(
            k,
            maxArrayLength,
            maxStringLength,
            depth + 1,
            maxDepth,
          )} => ${serializeObject(v, maxArrayLength, maxStringLength, depth + 1, maxDepth)}`,
      )
      .join(', ')} }`;
  }
  if (obj instanceof Set) {
    return `Set(${obj.size}) { ${Array.from(obj)
      .map(v => serializeObject(v, maxArrayLength, maxStringLength, depth + 1, maxDepth))
      .join(', ')} }`;
  }

  // 处理普通对象
  try {
    const keys = Object.keys(obj);
    // 如果对象有 toJSON 方法，使用它
    if (typeof obj.toJSON === 'function') {
      return JSON.stringify(obj);
    }

    // 普通对象序列化
    const pairs = keys.map(key => {
      const value = obj[key];
      return `${key}: ${serializeObject(
        value,
        maxArrayLength,
        maxStringLength,
        depth + 1,
        maxDepth,
      )}`;
    });

    if (pairs.length === 0) {
      // 处理空对象或原型链上有属性的对象
      return '{}';
    }

    return `{ ${pairs.join(', ')} }`;
  } catch (e) {
    // 无法序列化的对象
    return `[无法序列化的对象: ${e.message}]`;
  }
};

/**
 * 格式化错误对象
 * @param {Error} error - 错误对象
 * @param {boolean} includeStack - 是否包含堆栈信息
 * @returns {string} 格式化后的错误信息
 */
export const formatError = (error, includeStack = true) => {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const errorInfo = `${error.name}: ${error.message}`;

  if (!includeStack || !error.stack) {
    return errorInfo;
  }

  return `${errorInfo}\n${formatStack(error.stack)}`;
};

/**
 * 提取并格式化堆栈信息
 * @param {string} stack - 错误堆栈字符串
 * @param {number} limit - 堆栈信息行数限制
 * @returns {string} 格式化后的堆栈信息
 */
export const formatStack = (stack, limit = DEFAULT_CONFIG.STACK_TRACE_LIMIT) => {
  if (!stack) return '';

  // 移除第一行（通常是错误消息本身）
  const lines = stack.split('\n').slice(1);

  // 格式化堆栈行并限制行数
  const formattedLines = lines
    .map(line => line.trim())
    .filter(line => line && !line.includes('node_modules') && !line.includes('internal/'))
    .slice(0, limit);

  if (formattedLines.length === 0) {
    return '[无堆栈信息]';
  }

  if (lines.length > formattedLines.length) {
    formattedLines.push(`... 已省略${lines.length - formattedLines.length}行`);
  }

  return formattedLines.map(line => `  at ${line}`).join('\n');
};

/**
 * 格式化日志消息
 * @param {Array} messages - 日志消息数组
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的消息字符串
 */
export const formatMessage = (messages, options = {}) => {
  const {
    maxArrayLength = DEFAULT_CONFIG.MAX_ARRAY_LENGTH,
    maxStringLength = DEFAULT_CONFIG.MAX_STRING_LENGTH,
  } = options;

  if (!Array.isArray(messages) || messages.length === 0) {
    return '';
  }

  return messages
    .map(msg => {
      if (msg instanceof Error) {
        return formatError(msg);
      } else if (typeof msg === 'object' && msg !== null) {
        return serializeObject(msg, maxArrayLength, maxStringLength);
      } else {
        return String(msg);
      }
    })
    .join(' ');
};

/**
 * 截断长文本
 * @param {string} text - 要截断的文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 截断后添加的后缀
 * @returns {string} 截断后的文本
 */
export const truncateText = (
  text,
  maxLength = DEFAULT_CONFIG.MAX_STRING_LENGTH,
  suffix = '...',
) => {
  if (typeof text !== 'string' || text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + suffix;
};

/**
 * 生成带样式的日志条目
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {Object} options - 选项
 * @param {boolean} isBrowser - 是否在浏览器环境中
 * @returns {Array} 格式化后的日志条目及其样式
 */
export const createStyledLogEntry = (level, message, options = {}, isBrowser = true) => {
  const {
    showTimestamp = DEFAULT_CONFIG.SHOW_TIMESTAMP,
    showBadge = DEFAULT_CONFIG.SHOW_BADGE,
    colors = COLORS,
    icons = { DEBUG: '🔹', INFO: 'ℹ️', WARN: '⚠️', ERROR: '❌' },
  } = options;

  const icon = icons[level] || '';
  const timestamp = showTimestamp ? formatTime(new Date()) : '';
  const badge = showBadge ? level : '';

  const entries = [];
  const styles = [];

  // 时间戳部分
  if (timestamp) {
    if (isBrowser) {
      const [text, style] = applyStyle(timestamp, colors.TIMESTAMP, true);
      entries.push(text);
      styles.push(style);
    } else {
      entries.push(applyStyle(timestamp, colors.TIMESTAMP, false));
    }
  }

  // 徽章部分
  if (badge) {
    if (isBrowser) {
      const [text, style] = applyStyle(`[${badge}]`, colors[level], true);
      entries.push(text);
      styles.push(style);
    } else {
      entries.push(applyStyle(`[${badge}]`, colors[level], false));
    }
  }

  // 图标和消息部分
  if (isBrowser) {
    entries.push(`%c${icon} ${message}`);
    styles.push(`color: ${colors[level]}; font-weight: bold;`);
  } else {
    entries.push(applyStyle(`${icon} ${message}`, colors[level], false));
  }

  return isBrowser ? [entries.join(' '), ...styles] : entries.join(' ');
};

/**
 * 获取当前调用堆栈信息
 * @param {number} depth - 要跳过的堆栈帧数
 * @returns {string} 格式化后的调用位置
 */
export const getCallerInfo = (depth = 3) => {
  try {
    throw new Error();
  } catch (e) {
    const stackLines = e.stack.split('\n');
    if (stackLines.length <= depth) {
      return '未知位置';
    }

    const callerLine = stackLines[depth];
    // 提取文件名和行号
    const match = callerLine.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      // 解构但只使用我们需要的变量
      const [, , fileName, line] = match;
      // 提取文件基本名称
      const baseFileName = fileName.split('/').pop();
      return `${baseFileName}:${line}`;
    }

    return callerLine.trim();
  }
};
