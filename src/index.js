/**
 * LogMaster - 美观实用的日志管理工具
 * 主入口文件，导出LogMaster单例
 */

import LogMaster from './LogMaster';
import * as transports from './transports/index.js';

// 添加传输系统到LogMaster
LogMaster.transports = transports;

// 导出单例实例
export default LogMaster;
