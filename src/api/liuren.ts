import axios from 'axios';
import { Lunar } from 'lunar-typescript';

// 使用 HTTPS API URL
const API_URL = import.meta.env.PROD 
  ? '/api/proxy'  // 生产环境使用相对路径
  : 'http://localhost:3000/api/proxy';  // 开发环境使用本地地址

const gongPositions = ["大安", "留连", "速喜", "赤口", "小吉", "空亡"];

export interface GongInfo {
    position: string;    // 宫位名称
    god: string;        // 六神
    relation: string;   // 六亲
    star: string;      // 星星
    branch: string;    // 地支
    number: string;    // 宫位序号
    divination_number?: string;  // 只在日宫显示占数
}

export interface GongCollection {
    gong1: GongInfo; // 宫位1-大安
    gong2: GongInfo; // 宫位2-留连
    gong3: GongInfo; // 宫位3-速喜
    gong4: GongInfo; // 宫位4-赤口
    gong5: GongInfo; // 宫位5-小吉
    gong6: GongInfo; // 宫位6-空亡
}

export interface DivinationParams {
    number: string;
    time?: string;
}

export interface DivinationResult {
    code: number;
    data: {
        divination_number: string;
        lunar_time: string;
        yangli_time: string;
        time_palace: string;    // 时宫名称
        day_palace: string;     // 日宫名称
        gong_info: GongCollection;
        debug_info: {           // 调试信息
            api_response: any;   // API原始返回数据
            shichen: number;     // 计算的时辰
            input_hour: number;  // 输入的小时
            gongInfoArray: GongInfo[];  // 映射前的宫位数组
        };
    } | null;
    msg?: string;
}

// JSONP 实现
function jsonp(url: string, timeout = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_' + Math.random().toString(36).substr(2, 9);
    let timer: number;

    // 创建 script 标签
    const script = document.createElement('script');
    const originalUrl = new URL(url);
    originalUrl.searchParams.append('callback', callbackName);
    script.src = originalUrl.toString();

    // 超时处理
    timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('请求超时'));
    }, timeout);

    // 清理函数
    const cleanup = () => {
      document.body.removeChild(script);
      delete (window as any)[callbackName];
      if (timer) clearTimeout(timer);
    };

    // 设置回调
    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve(data);
    };

    // 错误处理
    script.onerror = () => {
      cleanup();
      reject(new Error('网络错误，请检查网络连接'));
    };

    // 添加到页面
    document.body.appendChild(script);
  });
}

// 计算时辰
function getShichen(hour: number): number {
  // 子时 23:00-1:00 = 1
  // 丑时 1:00-3:00 = 2
  // 寅时 3:00-5:00 = 3
  // 卯时 5:00-7:00 = 4
  // 辰时 7:00-9:00 = 5
  // 巳时 9:00-11:00 = 6
  // 午时 11:00-13:00 = 7
  // 未时 13:00-15:00 = 8
  // 申时 15:00-17:00 = 9
  // 酉时 17:00-19:00 = 10
  // 戌时 19:00-21:00 = 11
  // 亥时 21:00-23:00 = 12
  
  if (hour >= 23 || hour < 1) return 1;  // 子时
  if (hour >= 1 && hour < 3) return 2;   // 丑时
  if (hour >= 3 && hour < 5) return 3;   // 寅时
  if (hour >= 5 && hour < 7) return 4;   // 卯时
  if (hour >= 7 && hour < 9) return 5;   // 辰时
  if (hour >= 9 && hour < 11) return 6;  // 巳时
  if (hour >= 11 && hour < 13) return 7; // 午时
  if (hour >= 13 && hour < 15) return 8; // 未时
  if (hour >= 15 && hour < 17) return 9; // 申时
  if (hour >= 17 && hour < 19) return 10;// 酉时
  if (hour >= 19 && hour < 21) return 11;// 戌时
  return 12; // 亥时 (21:00-23:00)
}

// 解析日期时间
export function parseDateTime(timeStr: string | undefined): { dateTime: { year: number; month: number; day: number; hour: number; minute: number }; shichen: number } {
  if (!timeStr) {
    throw new Error('时间不能为空');
  }

  console.log('parseDateTime input:', timeStr);
  
  // 处理时间字符串
  const processedTimeStr = timeStr.trim();
  console.log('Processed time string:', processedTimeStr);
  
  // 处理带空格的时间
  console.log('Processing time with space');
  const [datePart, timePart] = processedTimeStr.split(' ');
  console.log('Date part:', datePart, 'Time part:', timePart);
  
  // 完整日期格式 (YYYY-MM-DD)
  console.log('Full date format (YYYY-MM-DD)');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  
  const dateTime = {
    year,
    month,
    day,
    hour,
    minute
  };
  
  console.log('Parsed components:', dateTime);
  
  const shichen = getShichen(hour);
  console.log('Calculated shichen:', shichen);
  
  return {
    dateTime,
    shichen
  };
}

// 获取占卜信息
export async function getDivinationInfo(params: DivinationParams): Promise<DivinationResult> {
  console.log('Starting getDivinationInfo with:', params);
  
  try {
    // 验证参数
    if (!params.number || !params.time) {
      throw new Error('缺少必要参数');
    }

    // 验证数字格式
    const number = Number(params.number);
    if (!Number.isInteger(number) || number < 1 || number > 100) {
      throw new Error('占数必须是 1-100 之间的整数');
    }

    const { dateTime, shichen } = parseDateTime(params.time);
    
    // 构建请求参数
    const requestParams = {
      ri: number.toString(),
      shi: shichen.toString()
    };
    
    console.log('Request params:', requestParams);

    // 使用代理服务器请求
    const response = await axios.get(API_URL, {
      params: requestParams,
      timeout: 5000,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.data) {
      throw new Error('获取数据失败');
    }

    if (response.data.code === -1) {
      throw new Error(response.data.msg || '获取数据失败');
    }

    const apiResponse = response.data;
    console.log('API Response:', apiResponse);

    return {
      code: 0,
      data: {
        divination_number: params.number,
        lunar_time: apiResponse.lunar_time || '',
        yangli_time: `${dateTime.year}-${dateTime.month.toString().padStart(2, '0')}-${dateTime.day.toString().padStart(2, '0')} ${dateTime.hour.toString().padStart(2, '0')}:${dateTime.minute.toString().padStart(2, '0')}`,
        time_palace: apiResponse.time_palace || '',
        day_palace: apiResponse.day_palace || '',
        gong_info: apiResponse.gong_info || {
          gong1: { position: "大安", god: "", relation: "", star: "", branch: "", number: "1" },
          gong2: { position: "留连", god: "", relation: "", star: "", branch: "", number: "2" },
          gong3: { position: "速喜", god: "", relation: "", star: "", branch: "", number: "3" },
          gong4: { position: "赤口", god: "", relation: "", star: "", branch: "", number: "4" },
          gong5: { position: "小吉", god: "", relation: "", star: "", branch: "", number: "5" },
          gong6: { position: "空亡", god: "", relation: "", star: "", branch: "", number: "6" }
        },
        debug_info: {
          api_response: apiResponse,
          shichen,
          input_hour: dateTime.hour,
          gongInfoArray: []
        }
      }
    };
  } catch (error: any) {
    console.error('Error in getDivinationInfo:', error);
    return {
      code: -1,
      data: null,
      msg: error.response?.data?.msg || error.message || '网络错误，请检查网络连接'
    };
  }
}

// 格式化日期时间
function formatDateTime(dateTime: { year: number; month: number; day: number; hour: number; minute: number }): string {
  const { year, month, day, hour, minute } = dateTime;
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}
