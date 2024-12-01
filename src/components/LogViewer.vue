<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';

const logs = ref<string[]>([]);
const isVisible = ref(false);
const maxLogs = 500;  // 增加日志数量限制

// 创建一个格式化的时间戳
const getTimestamp = () => {
  const now = new Date();
  return now.toLocaleTimeString('zh-CN', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3 
  });
};

// 统一的日志格式化函数
const formatLogMessage = (type: string, ...args: any[]): string => {
  const timestamp = getTimestamp();
  const messages = args.map(arg => {
    if (arg instanceof Error) {
      return `${arg.name}: ${arg.message}\n${arg.stack}`;
    }
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  });
  return `${timestamp} [${type}] ${messages.join(' ')}`;
};

// 收集控制台日志
const collectLog = (type: string, ...args: any[]) => {
  const logMessage = formatLogMessage(type, ...args);
  logs.value.unshift(logMessage);
  if (logs.value.length > maxLogs) {
    logs.value = logs.value.slice(0, maxLogs);
  }
};

// 复制所有日志到剪贴板
const copyLogs = async () => {
  const logText = logs.value.join('\n');
  try {
    await navigator.clipboard.writeText(logText);
    ElMessage.success('日志已复制到剪贴板');
  } catch (err) {
    ElMessage.error('复制失败，请手动复制');
  }
};

// 清空日志
const clearLogs = () => {
  logs.value = [];
  ElMessage.success('日志已清空');
};

// 监听快捷键
const handleKeyDown = (event: KeyboardEvent) => {
  // Command/Ctrl + Shift + L 显示/隐藏日志
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'L') {
    event.preventDefault();
    isVisible.value = !isVisible.value;
  }
};

// 拦截控制台日志
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
};

// 拦截全局错误
const handleGlobalError = (event: ErrorEvent) => {
  collectLog('ERROR', `Uncaught ${event.error}`);
  event.preventDefault();
};

// 拦截未处理的Promise拒绝
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  collectLog('PROMISE', `Unhandled Rejection: ${event.reason}`);
  event.preventDefault();
};

// 拦截网络请求
const setupXHRInterception = () => {
  const XHR = XMLHttpRequest.prototype;
  const originalOpen = XHR.open;
  const originalSend = XHR.send;

  XHR.open = function(this: XMLHttpRequest, method: string, url: string) {
    this._url = url;
    this._method = method;
    // @ts-ignore
    return originalOpen.apply(this, arguments);
  };

  XHR.send = function(this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
    const startTime = Date.now();
    
    this.addEventListener('load', () => {
      const duration = Date.now() - startTime;
      collectLog('XHR', `${this._method} ${this._url} - ${this.status} (${duration}ms)`);
    });

    this.addEventListener('error', () => {
      const duration = Date.now() - startTime;
      collectLog('XHR', `ERROR ${this._method} ${this._url} - Failed (${duration}ms)`);
    });

    // @ts-ignore
    return originalSend.apply(this, arguments);
  };
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('error', handleGlobalError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  
  setupXHRInterception();
  
  // 重写控制台方法
  console.log = (...args) => {
    originalConsole.log(...args);
    collectLog('LOG', ...args);
  };
  console.error = (...args) => {
    originalConsole.error(...args);
    collectLog('ERROR', ...args);
  };
  console.warn = (...args) => {
    originalConsole.warn(...args);
    collectLog('WARN', ...args);
  };
  console.info = (...args) => {
    originalConsole.info(...args);
    collectLog('INFO', ...args);
  };
  console.debug = (...args) => {
    originalConsole.debug(...args);
    collectLog('DEBUG', ...args);
  };
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('error', handleGlobalError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  
  // 恢复原始控制台方法
  Object.assign(console, originalConsole);
});
</script>

<template>
  <div v-if="isVisible" class="log-viewer">
    <div class="log-header">
      <h3>日志查看器 ({{ logs.length }} 条)</h3>
      <div class="log-actions">
        <el-button type="primary" size="small" @click="copyLogs">
          复制日志
        </el-button>
        <el-button type="warning" size="small" @click="clearLogs">
          清空
        </el-button>
        <el-button type="default" size="small" @click="isVisible = false">
          关闭
        </el-button>
      </div>
    </div>
    <div class="log-content">
      <div v-for="(log, index) in logs" 
           :key="index" 
           class="log-entry"
           :class="{
             'error-log': log.includes('[ERROR]'),
             'warn-log': log.includes('[WARN]'),
             'xhr-log': log.includes('[XHR]'),
             'promise-log': log.includes('[PROMISE]')
           }">
        <pre>{{ log }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.log-viewer {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 80%;
  max-width: 800px;
  height: 80vh;
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  border-radius: 8px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.log-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px 8px 0 0;
}

.log-header h3 {
  margin: 0;
  font-size: 16px;
}

.log-actions {
  display: flex;
  gap: 8px;
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.log-entry {
  margin: 4px 0;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
}

.log-entry pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.error-log {
  background: rgba(255, 0, 0, 0.1);
  border-left: 3px solid #ff4444;
}

.warn-log {
  background: rgba(255, 255, 0, 0.1);
  border-left: 3px solid #ffbb33;
}

.xhr-log {
  background: rgba(0, 255, 255, 0.1);
  border-left: 3px solid #33b5e5;
}

.promise-log {
  background: rgba(255, 0, 255, 0.1);
  border-left: 3px solid #ff33cc;
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
