import { LogLevel, Environment, ThemeOptions, Transport } from '../types/index';

declare class LogMaster {
  setEnvironment(env: Environment): LogMaster;
  setLogLevel(level: LogLevel): LogMaster;
  setTheme(theme: ThemeOptions): LogMaster;
  addTransport(transport: Transport): LogMaster;
  removeTransport(transport: Transport): LogMaster;
  setTransportErrorHandler(handler: (error: Error, transport: Transport) => void): LogMaster;
  debug(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  prodError(...args: any[]): void;
  group(label: string, callback: Function): void;
  table(data: any[], columns?: string[]): void;
  flush(): Promise<void>;
  isLevelVisible(level: LogLevel): boolean;

  static transports: any;
}

export default LogMaster;
