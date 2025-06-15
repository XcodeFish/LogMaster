/**
 * @file LogMaster 浏览器版本入口
 * @module index-browser
 * @author LogMaster
 * @license MIT
 */

import LogMaster from './LogMaster.js';
import HTTPTransport from './transports/http.js';

// 浏览器环境下只支持HTTP传输
const browserTransportSystem = {
  FileTransport: null, // 浏览器不支持文件传输
  HTTPTransport,
};

// 提前加载传输系统
LogMaster._preloadedTransportSystem = browserTransportSystem;

// 设置为浏览器环境
LogMaster._isBrowser = true;

export default LogMaster;
