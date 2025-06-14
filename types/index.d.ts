declare module 'logmaster' {
  export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SILENT';
  export type Environment = 'development' | 'testing' | 'production';

  export interface ThemeOptions {
    badge?: string;
    timestamp?: string;
    debug?: string;
    info?: string;
    warn?: string;
    error?: string;
  }

  export interface TransportOptions {
    minLevel?: LogLevel;
    [key: string]: any;
  }

  export interface Transport {
    log(level: LogLevel, messages: any[], meta: any): void;
    options?: TransportOptions;
  }

  export default class LogMaster {
    /**
     * 设置运行环境
     * @param env 环境名称
     */
    setEnvironment(env: Environment): LogMaster;
    
    /**
     * 设置日志级别
     * @param level 日志级别
     */
    setLogLevel(level: LogLevel): LogMaster;
    
    /**
     * 设置日志主题
     * @param theme 主题选项
     */
    setTheme(theme: ThemeOptions): LogMaster;
    
    /**
     * 添加日志传输方式
     * @param transport 传输实例
     */
    addTransport(transport: Transport): LogMaster;
    
    /**
     * 移除日志传输方式
     * @param transport 传输实例
     */
    removeTransport(transport: Transport): LogMaster;
    
    /**
     * 设置传输错误处理器
     * @param handler 错误处理函数
     */
    setTransportErrorHandler(handler: (error: Error, transport: Transport) => void): LogMaster;
    
    /**
     * 输出调试级别日志
     * @param args 日志内容
     */
    debug(...args: any[]): void;
    
    /**
     * 输出信息级别日志
     * @param args 日志内容
     */
    info(...args: any[]): void;
    
    /**
     * 输出警告级别日志
     * @param args 日志内容
     */
    warn(...args: any[]): void;
    
    /**
     * 输出错误级别日志
     * @param args 日志内容
     */
    error(...args: any[]): void;
    
    /**
     * 强制输出错误日志（即使在SILENT级别）
     * @param args 日志内容
     */
    prodError(...args: any[]): void;
    
    /**
     * 创建日志分组
     * @param label 分组标签
     * @param callback 分组内容回调函数
     */
    group(label: string, callback: Function): void;
    
    /**
     * 输出表格数据
     * @param data 表格数据
     * @param columns 列名数组
     */
    table(data: any[], columns?: string[]): void;
    
    /**
     * 刷新所有传输缓冲区
     */
    flush(): Promise<void>;
    
    /**
     * 检查日志级别是否可见
     * @param level 日志级别
     */
    isLevelVisible(level: LogLevel): boolean;
  }
}
