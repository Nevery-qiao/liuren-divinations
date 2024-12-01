import axios from 'axios';
import { Lunar } from 'lunar-typescript';

// 使用本地代理 URL
const API_URL = '/api/proxy';

// axios 配置
const apiClient = axios.create({
    timeout: 5000,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

// 添加请求拦截器，处理 CORS
apiClient.interceptors.request.use((config) => {
    // 开发环境下添加特殊处理
    if (process.env.NODE_ENV === 'development') {
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
    }
    return config;
});

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
        zishen_info: {
            dizhi: string;    // 当前地支
            zishen: string;  // 自身所在宫的属性
        };
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

const response = await apiClient.get(API_URL, { params });
console.log('API Response:', response);

if (!response.data) {
    console.error('Empty response data');
    throw new Error('API 返回为空');
}

// Transform API response
const apiResponse = response.data;
const lunarInfo = getLunarInfo(dateTime, number);
        
// 基础信息
const baseInfo = apiResponse[0];
if (!baseInfo) {
    throw new Error('API 返回数据格式错误');
}

// 构建完整的宫位信息
const gongInfo = {
    gong1: transformGongInfo({
        god: baseInfo.liushen?.[0] || "",          // 六神
        relation: baseInfo.liuqin?.[0] || "",      // 六亲
        star: baseInfo.wuxing?.[0] || "",          // 五行
        branch: baseInfo.dizhis?.[0] || "",        // 地支
        divination_number: baseInfo.zhangshu || "" // 占数
    }, "大安", "1"),
    gong2: transformGongInfo({
        god: baseInfo.liushen?.[1] || "",
        relation: baseInfo.liuqin?.[1] || "",
        star: baseInfo.wuxing?.[1] || "",
        branch: baseInfo.dizhis?.[1] || "",
        divination_number: baseInfo.zhangshu || ""
    }, "留连", "2"),
    gong3: transformGongInfo({
        god: baseInfo.liushen?.[2] || "",
        relation: baseInfo.liuqin?.[2] || "",
        star: baseInfo.wuxing?.[2] || "",
        branch: baseInfo.dizhis?.[2] || "",
        divination_number: baseInfo.zhangshu || ""
    }, "速喜", "3"),
    gong4: transformGongInfo({
        god: baseInfo.liushen?.[3] || "",
        relation: baseInfo.liuqin?.[3] || "",
        star: baseInfo.wuxing?.[3] || "",
        branch: baseInfo.dizhis?.[3] || "",
        divination_number: baseInfo.zhangshu || ""
    }, "赤口", "4"),
    gong5: transformGongInfo({
        god: baseInfo.liushen?.[4] || "",
        relation: baseInfo.liuqin?.[4] || "",
        star: baseInfo.wuxing?.[4] || "",
        branch: baseInfo.dizhis?.[4] || "",
        divination_number: baseInfo.zhangshu || ""
    }, "小吉", "5"),
    gong6: transformGongInfo({
        god: baseInfo.liushen?.[5] || "",
        relation: baseInfo.liuqin?.[5] || "",
        star: baseInfo.wuxing?.[5] || "",
        branch: baseInfo.dizhis?.[5] || "",
        divination_number: baseInfo.zhangshu || ""
    }, "空亡", "6")
};

// 计算宫位
const timePalace = gongPositions[apiResponse.shigong - 1] || gongPositions[shichen % 6];
const dayPalace = gongPositions[apiResponse.rigong - 1] || gongPositions[Number(number) % 6];

// 添加自身信息
const zishenInfo = {
    dizhi: baseInfo.dizhi || "",    // 当前地支
    zishen: baseInfo.zishen || "",  // 自身所在宫的属性
};

return {
    code: 0,
    data: {
        divination_number: number,
        lunar_time: lunarInfo.lunarTime,
        yangli_time: formatDateTime(dateTime),
        time_palace: timePalace,
        day_palace: dayPalace,
        gong_info: gongInfo,
        zishen_info: zishenInfo,    // 添加自身信息
        debug_info: {
            api_response: apiResponse,
            shichen: shichen,
            input_hour: dateTime.hour,
            gongInfoArray: Object.values(gongInfo)
        }
    }
};
} catch (error: any) {
    console.error('Error in getDivinationInfo:', error);
    return {
        code: -1,
        data: null
    };
}

// Helper function to transform gong information
function transformGongInfo(apiGong: any, defaultPosition: string, number: string): GongInfo {
    return {
        position: defaultPosition,
        god: apiGong.god || "",
        relation: apiGong.relation || "",
        star: apiGong.star || "",
        branch: apiGong.branch || "",
        number: number,
        divination_number: apiGong.divination_number || ""
    };
}

// Update getLunarInfo function to provide lunar time information
function getLunarInfo(dateTime: { year: number; month: number; day: number; hour: number }, divination_number: string) {
    const date = new Date(dateTime.year, dateTime.month - 1, dateTime.day, dateTime.hour);
    const lunar = Lunar.fromDate(date);
    
    return {
        lunarTime: `${lunar.getYearInGanZhi()}年  ${lunar.getMonthInGanZhi()}月  ${lunar.getDayInGanZhi()}日  ${lunar.getTimeInGanZhi()}时 【数字：${divination_number}】`,
        shichen: getShichen(dateTime.hour)
    };
}

function parseDateTime(time: string | undefined): { year: number; month: number; day: number; hour: number; minute: number } {
    console.log('parseDateTime input:', time);

    if (!time) {
        console.log('No time provided, using current time');
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
            hour: now.getHours(),
            minute: now.getMinutes()
        };
    }

    time = time.replace(/：/g, ':').trim();
    console.log('Processed time string:', time);

    try {
        if (time.includes(' ')) {
            console.log('Processing time with space');
            const [dateStr, timeStr] = time.split(' ');
            console.log('Date part:', dateStr, 'Time part:', timeStr);
            
            let year: number, month: number, day: number;

            if (dateStr.split('-').length === 3) {
                console.log('Full date format (YYYY-MM-DD)');
                [year, month, day] = dateStr.split('-').map(Number);
            } else if (dateStr.split('-').length === 2) {
                console.log('Short date format (MM-DD)');
                [month, day] = dateStr.split('-').map(Number);
                year = new Date().getFullYear();
                console.log('Using current year:', year);
            } else {
                console.log('Invalid date format:', dateStr);
                throw new Error('Invalid date format');
            }

            const [hour, minute] = timeStr.split(':').map(Number);
            console.log('Parsed components:', { year, month, day, hour, minute });
            
            if ([year, month, day, hour, minute].some(isNaN)) {
                console.log('Some components are NaN:', { year, month, day, hour, minute });
                throw new Error('Invalid date/time components');
            }
            
            if (month < 1 || month > 12 || day < 1 || day > 31 || 
                hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                console.log('Components out of range:', { year, month, day, hour, minute });
                throw new Error('Date/time values out of range');
            }
            
            return {
                year,
                month,
                day,
                hour,
                minute
            };
        } else if (time.includes('-')) {
            console.log('Processing time with hyphens only');
            const [year, month, day, timeStr] = time.split('-');
            const [hour, minute] = timeStr ? timeStr.split(':').map(Number) : [0, 0];
            
            const parsedYear = parseInt(year);
            const parsedMonth = parseInt(month);
            const parsedDay = parseInt(day);
            
            if ([parsedYear, parsedMonth, parsedDay, hour, minute].some(isNaN)) {
                throw new Error('Invalid date/time components');
            }
            
            if (parsedMonth < 1 || parsedMonth > 12 || parsedDay < 1 || parsedDay > 31 || 
                hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                throw new Error('Date/time values out of range');
            }
            
            return {
                year: parsedYear,
                month: parsedMonth,
                day: parsedDay,
                hour,
                minute
            };
        } else {
            console.log('Processing time only format');
            const now = new Date();
            const [hour, minute] = time.split(':').map(Number);
            
            if ([hour, minute].some(isNaN) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                throw new Error('Invalid time format');
            }
            
            return {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate(),
                hour,
                minute
            };
        }
    } catch (error) {
        console.error('Error parsing datetime:', error);
        throw new Error('时间格式不正确');
    }
}

function formatDateTime(date: { year: number; month: number; day: number; hour: number; minute: number }): string {
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    const hour = date.hour.toString().padStart(2, '0');
    const minute = date.minute.toString().padStart(2, '0');
    return `${date.year}年${month}月${day}日 ${hour}:${minute}`;
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
    if (!params || !params.number || !params.time) {
      console.error('Missing required parameters:', params);
      throw new Error('缺少必要参数');
    }

    // 验证数字格式
    const number = Number(params.number);
    if (!Number.isInteger(number) || number < 1 || number > 100) {
      throw new Error('占数必须是 1-100 之间的整数');
    }

    const { dateTime, shichen } = parseDateTime(params.time);
    console.log('Parsed date time:', dateTime, 'shichen:', shichen);
    
    // 构建请求参数
    const requestParams = {
      ri: number.toString(),
      shi: shichen.toString()
    };
    
    console.log('Request params:', requestParams);

    // 使用代理服务器请求
    const response = await apiClient.get(API_URL, {
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
        yangli_time: formatDateTime(dateTime),
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
