/**
 * @file LogMaster 单文件打包入口
 * @module index-bundle
 * @author LogMaster
 * @license MIT
 */

import LogMaster from './LogMaster.js';
import transportSystem from './transports/index.js';

// 提前加载传输系统
LogMaster._preloadedTransportSystem = transportSystem;

export default LogMaster;
