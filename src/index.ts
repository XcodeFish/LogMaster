/**
 * LogMaster - 美观实用的日志管理工具
 * TypeScript入口文件
 */

// @ts-ignore - 允许导入JS模块
import LogMaster from './LogMaster.js';
// @ts-ignore - 允许导入JS模块
import * as transports from './transports/index.js';

// 添加传输系统到LogMaster
LogMaster.transports = transports;

// 导出单例实例
export default LogMaster;

// 再导出类型定义
export type {
  LogLevel,
  Environment,
  ThemeOptions,
  TransportOptions,
  Transport
} from '../types/index';
