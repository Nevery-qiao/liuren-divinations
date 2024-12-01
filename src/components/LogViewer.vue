<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';

const logs = ref<string[]>([]);
const isVisible = ref(false);
const maxLogs = 100;  // 最多保存100条日志

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

// 收集控制台日志
const collectLog = (...args: any[]) => {
  const timestamp = getTimestamp();
  const logMessage = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
  
  logs.value.unshift(`${timestamp} ${logMessage}`);
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
  info: console.info
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  
  // 重写控制台方法
  console.log = (...args) => {
    originalConsole.log(...args);
    collectLog(...args);
  };
  console.error = (...args) => {
    originalConsole.error(...args);
    collectLog('ERROR:', ...args);
  };
  console.warn = (...args) => {
    originalConsole.warn(...args);
    collectLog('WARN:', ...args);
  };
  console.info = (...args) => {
    originalConsole.info(...args);
    collectLog('INFO:', ...args);
  };
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  
  // 恢复原始控制台方法
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
});
</script>

<template>
  <div v-if="isVisible" class="log-viewer">
    <div class="log-header">
      <h3>日志查看器</h3>
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
      <pre v-for="(log, index) in logs" :key="index">{{ log }}</pre>
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
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  border-radius: 8px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.log-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  font-family: monospace;
  font-size: 12px;
  line-height: 1.4;
}

.log-content pre {
  margin: 0;
  padding: 4px 0;
  white-space: pre-wrap;
  word-wrap: break-word;
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
