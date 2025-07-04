// Глобальная система отладки для Telegram Mini App

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private addLog(level: LogEntry['level'], message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Сохраняем в localStorage для отладки
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('debug_logs', JSON.stringify(this.logs));
      } catch (e) {
        // Ignore localStorage errors
      }
    }

    // Выводим в консоль
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[${entry.timestamp}] ${message}`, data || '');
  }

  info(message: string, data?: any) {
    this.addLog('info', message, data);
  }

  warn(message: string, data?: any) {
    this.addLog('warn', message, data);
  }

  error(message: string, data?: any) {
    this.addLog('error', message, data);
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  loadFromStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('debug_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      // Ignore errors
    }
  }

  clear() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('debug_logs');
      } catch (e) {
        // Ignore errors
      }
    }
  }
}

export const logger = new DebugLogger();

// Инициализация при загрузке
if (typeof window !== 'undefined') {
  logger.loadFromStorage();
  logger.info('Debug logger initialized');
}

// Перехват глобальных ошибок
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Global error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', {
      reason: event.reason
    });
  });
}