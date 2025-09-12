/**
 * 统一日志工具
 * 在生产环境中，前端不显示调试信息，但服务器日志保留
 */

// 检查是否为服务器端
const isServer = typeof window === 'undefined';

// 检查环境
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// 从环境变量读取日志配置
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');
const enableConsoleLogs = process.env.ENABLE_CONSOLE_LOGS !== 'false';
const enableServerLogs = process.env.ENABLE_SERVER_LOGS !== 'false';

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * 日志配置
 */
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableServerLog: boolean;
}

/**
 * 解析日志级别
 */
function parseLogLevel(level: string): LogLevel {
  switch (level.toLowerCase()) {
    case 'debug': return LogLevel.DEBUG;
    case 'info': return LogLevel.INFO;
    case 'warn': return LogLevel.WARN;
    case 'error': return LogLevel.ERROR;
    default: return LogLevel.INFO;
  }
}

/**
 * 默认配置
 */
const defaultConfig: LoggerConfig = {
  level: parseLogLevel(logLevel),
  enableConsole: enableConsoleLogs && (isDevelopment || !isServer), // 根据环境变量和开发环境决定
  enableServerLog: enableServerLogs && isServer, // 根据环境变量和服务器端决定
};

/**
 * 日志类
 */
class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    if (args.length > 0) {
      return `${prefix} ${message} ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')}`;
    }
    
    return `${prefix} ${message}`;
  }

  /**
   * 输出日志
   */
  private log(level: LogLevel, levelName: string, message: string, ...args: any[]): void {
    if (level < this.config.level) {
      return;
    }

    const formattedMessage = this.formatMessage(levelName, message, ...args);

    // 服务器端日志（始终输出到服务器日志）
    if (isServer) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
      }
    }
    // 客户端日志（只在开发环境显示）
    else if (this.config.enableConsole && isDevelopment) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
      }
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, ...args);
  }

  /**
   * 信息日志
   */
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, 'INFO', message, ...args);
  }

  /**
   * 警告日志
   */
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, 'WARN', message, ...args);
  }

  /**
   * 错误日志
   */
  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, 'ERROR', message, ...args);
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * 默认日志实例
 */
export const logger = new Logger();

/**
 * 创建自定义日志实例
 */
export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  return new Logger(config);
}

/**
 * 便捷的日志函数（用于快速替换现有的 console.log）
 */
export const log = {
  debug: (message: string, ...args: any[]) => logger.debug(message, ...args),
  info: (message: string, ...args: any[]) => logger.info(message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
  error: (message: string, ...args: any[]) => logger.error(message, ...args),
};

/**
 * 条件日志（只在满足条件时输出）
 */
export const conditionalLog = {
  debug: (condition: boolean, message: string, ...args: any[]) => {
    if (condition) logger.debug(message, ...args);
  },
  info: (condition: boolean, message: string, ...args: any[]) => {
    if (condition) logger.info(message, ...args);
  },
  warn: (condition: boolean, message: string, ...args: any[]) => {
    if (condition) logger.warn(message, ...args);
  },
  error: (condition: boolean, message: string, ...args: any[]) => {
    if (condition) logger.error(message, ...args);
  },
};

export default logger;
