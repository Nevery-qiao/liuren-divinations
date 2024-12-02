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
    console.log('Request interceptor:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        params: config.params,
        data: config.data,
        baseURL: config.baseURL,
        env: process.env.NODE_ENV
    });

    // 开发环境下添加特殊处理
    if (process.env.NODE_ENV === 'development') {
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
    }
    return config;
});

// 添加响应拦截器
apiClient.interceptors.response.use(
    (response) => {
        console.log('Response interceptor success:', {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            config: {
                url: response.config.url,
                method: response.config.method,
                params: response.config.params
            }
        });
        return response;
    },
    (error) => {
        console.error('Response interceptor error:', {
            message: error.message,
            config: error.config,
            response: error.response ? {
                status: error.response.status,
                statusText: error.response.statusText,
                headers: error.response.headers,
                data: error.response.data
            } : null
        });
        return Promise.reject(error);
    }
);

// 使用宫位名称数组
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

// Transform API response
const transformGongInfo = (info: {
  god: string;
  relation: string;
  star: string;
  branch: string;
  divination_number: string;
}, position: string, index: string): GongInfo => {
  return {
    position: position || index,
    star: info.star || '',
    branch: info.branch || '',
    god: info.god || '',
    relation: info.relation || '',
    number: index,
    divination_number: info.divination_number || ''
  }
}

function getLunarInfo(dateTime: { year: number; month: number; day: number; hour: number }, divination_number: string) {
    const date = new Date(dateTime.year, dateTime.month - 1, dateTime.day, dateTime.hour);
    const lunar = Lunar.fromDate(date);
    
    return {
        lunarTime: `${lunar.getYearInGanZhi()}年  ${lunar.getMonthInGanZhi()}月  ${lunar.getDayInGanZhi()}日  ${lunar.getTimeInGanZhi()}时 【数字：${divination_number}】`,
        divination_number
    };
}

// 解析日期时间
export function parseDateTime(timeStr: string | undefined): { dateTime: { year: number; month: number; day: number; hour: number; minute: number }; shichen: number } {
    if (!timeStr) {
        const now = new Date();
        return {
            dateTime: {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate(),
                hour: now.getHours(),
                minute: now.getMinutes()
            },
            shichen: getShichen(now.getHours())
        };
    }

    let year: number, month: number, day: number, hour: number = 0, minute: number = 0;

    try {
        if (timeStr.includes(' ')) {
            console.log('Processing time with space');
            const [dateStr, timeComponent] = timeStr.split(' ');
            const [y, m, d] = dateStr.split('-').map(Number);
            const [h, min] = timeComponent.split(':').map(Number);
            
            year = y;
            month = m;
            day = d;
            hour = h;
            minute = min;
        } else {
            console.log('Processing time with hyphens only');
            const parts = timeStr.split('-');
            year = parseInt(parts[0]);
            month = parseInt(parts[1]);
            day = parseInt(parts[2]);
            if (parts[3]) {
                const [h, min] = parts[3].split(':').map(Number);
                hour = h || 0;
                minute = min || 0;
            }
        }

        if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
            throw new Error('Invalid date time format');
        }

        return {
            dateTime: { year, month, day, hour, minute },
            shichen: getShichen(hour)
        };
    } catch (error) {
        console.error('Error parsing date time:', error);
        const now = new Date();
        return {
            dateTime: {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate(),
                hour: now.getHours(),
                minute: now.getMinutes()
            },
            shichen: getShichen(now.getHours())
        };
    }
}

export interface DivinationParams {
    time?: string;
    number: number | string;  // 支持数字或字符串类型
}

export interface DivinationResult {
    code: number;
    data: {
        divination_number: string;
        lunar_time: string;
        yangli_time: string;
        time_palace: string;
        day_palace: string;
        gong_info: GongCollection;
        zishen_info: {
            dizhi: string;
            zishen: string;
        };
        debug_info?: any;
    } | null;
    msg?: string;
}

// PC 端占卜信息获取
export async function getDivinationInfo(params: DivinationParams): Promise<DivinationResult> {
    // 规范化参数
    const normalizedParams = typeof params === 'object' ? params : {
        number: params,
        time: undefined
    };

    console.log('getDivinationInfo normalized params:', {
        original: params,
        normalized: normalizedParams,
        numberType: typeof normalizedParams.number,
        timeType: typeof normalizedParams.time
    });
    
    try {
        // 验证参数
        const numberValue = normalizedParams.number?.toString();
        if (!numberValue) {
            console.error('Validation failed: number is empty or invalid', {
                number: normalizedParams.number,
                type: typeof normalizedParams.number,
                truthyCheck: !!normalizedParams.number
            });
            throw new Error('占数不能为空');
        }

        // 解析时间
        const { dateTime, shichen } = parseDateTime(normalizedParams.time);
        console.log('Parsed date time:', {
            input: normalizedParams.time,
            parsed: dateTime,
            shichen,
        });

        // 构建请求参数
        const requestParams = {
            ri: numberValue,
            shi: shichen.toString()
        };

        console.log('Request configuration:', {
            url: API_URL,
            method: 'GET',
            params: requestParams,
            headers: apiClient.defaults.headers
        });

        const response = await apiClient.get(API_URL, {
            params: requestParams
        });

        console.log('API Response:', {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data
        });

        if (!response.data) {
            throw new Error('API 返回为空');
        }

        // Transform API response
        const apiResponse = response.data;
        const lunarInfo = getLunarInfo(dateTime, numberValue);

        // 基础信息
        const baseInfo = apiResponse[0];
        if (!baseInfo) {
            console.error('API response is empty or invalid:', apiResponse);
            throw new Error('API 返回数据格式错误');
        }

        // 确保所有必要的数组都存在
        const liushen = baseInfo.liushen || Array(6).fill("");
        const liuqin = baseInfo.liuqin || Array(6).fill("");
        const wuxing = baseInfo.wuxing || Array(6).fill("");
        const dizhis = baseInfo.dizhis || Array(6).fill("");

        // 构建完整的宫位信息
        const gongInfo = {
            gong1: transformGongInfo({
                god: liushen[0],
                relation: liuqin[0],
                star: wuxing[0],
                branch: dizhis[0],
                divination_number: baseInfo.zhangshu
            }, "大安", "1"),
            gong2: transformGongInfo({
                god: liushen[1],
                relation: liuqin[1],
                star: wuxing[1],
                branch: dizhis[1],
                divination_number: baseInfo.zhangshu
            }, "留连", "2"),
            gong3: transformGongInfo({
                god: liushen[2],
                relation: liuqin[2],
                star: wuxing[2],
                branch: dizhis[2],
                divination_number: baseInfo.zhangshu
            }, "速喜", "3"),
            gong4: transformGongInfo({
                god: liushen[3],
                relation: liuqin[3],
                star: wuxing[3],
                branch: dizhis[3],
                divination_number: baseInfo.zhangshu
            }, "赤口", "4"),
            gong5: transformGongInfo({
                god: liushen[4],
                relation: liuqin[4],
                star: wuxing[4],
                branch: dizhis[4],
                divination_number: baseInfo.zhangshu
            }, "小吉", "5"),
            gong6: transformGongInfo({
                god: liushen[5],
                relation: liuqin[5],
                star: wuxing[5],
                branch: dizhis[5],
                divination_number: baseInfo.zhangshu
            }, "空亡", "6")
        };

        // 计算宫位
        const timePalace = gongPositions[baseInfo.shigong - 1] || gongPositions[shichen % 6];
        const dayPalace = gongPositions[baseInfo.rigong - 1] || gongPositions[Number(numberValue) % 6];

        // 添加自身信息
        const zishenInfo = {
            dizhi: baseInfo.dizhi || "",
            zishen: baseInfo.zishen || "",
        };

        const result = {
            code: 0,
            data: {
                divination_number: numberValue,
                lunar_time: lunarInfo.lunarTime,
                yangli_time: formatDateTime(dateTime),
                time_palace: timePalace,
                day_palace: dayPalace,
                gong_info: gongInfo,
                zishen_info: zishenInfo,
                debug_info: {
                    api_response: apiResponse,
                    shichen: shichen,
                    input_hour: dateTime.hour,
                    gongInfoArray: Object.values(gongInfo)
                }
            }
        };

        console.log('Processed result:', result);
        return result;
    } catch (error: any) {
        console.error('Error in getDivinationInfo:', error);
        return {
            code: -1,
            data: null
        };
    }
}

// 移动端占卜信息获取
export async function getMobileDivinationInfo(params: { number: number; time: string }): Promise<DivinationResult> {
  try {
    console.log('[getMobileDivinationInfo] Step 1 - Input params:', {
      number: params.number,
      numberType: typeof params.number,
      time: params.time,
      timeType: typeof params.time
    });

    // 处理时间中的空格
    const parsedDateTime = parseDateTime(params.time);
    const shichen = getShichen(parsedDateTime.dateTime.hour);
    console.log('[getMobileDivinationInfo] Step 2 - Parsed time:', {
      parsedDateTime,
      dateTimeFormat: parsedDateTime.dateTime,
      hour: parsedDateTime.dateTime.hour,
      shichen
    });

    const formattedTime = formatDateTime(parsedDateTime.dateTime);
    console.log('[getMobileDivinationInfo] Step 3 - Formatted time:', {
      formattedTime,
      originalDateTime: parsedDateTime.dateTime
    });

    // 构建请求参数
    const requestParams = {
      ri: params.number.toString(),
      shi: shichen.toString()
    };
    console.log('[getMobileDivinationInfo] Step 4 - Request params:', {
      params: requestParams,
      originalNumber: params.number,
      originalShichen: shichen
    });

    const response = await apiClient.get(`${API_URL}`, {
      params: requestParams
    });
    console.log('[getMobileDivinationInfo] Step 5 - Raw API response:', {
      status: response.status,
      headers: response.headers,
      data: response.data
    });

    const rawData = response.data;
    if (!rawData || typeof rawData !== 'object') {
      console.error('[getMobileDivinationInfo] Step 6 - Invalid API response format:', rawData);
      throw new Error('Invalid API response format');
    }

    // 获取基础数据
    const baseInfo = rawData['0'] || {};
    console.log('[getMobileDivinationInfo] Step 7 - Base info:', {
      baseInfo,
      hasLiushen: !!baseInfo.liushen,
      hasLiuqin: !!baseInfo.liuqin,
      hasWuxing: !!baseInfo.wuxing,
      hasDizhis: !!baseInfo.dizhis
    });

    const { liushen = [], liuqin = [], wuxing = [], dizhis = [], gongPositions = [] } = baseInfo;

    // 验证数组长度
    if (liushen.length !== 6 || liuqin.length !== 6 || wuxing.length !== 6 || dizhis.length !== 6) {
      console.error('[getMobileDivinationInfo] Step 8 - Invalid array lengths:', {
        liushen: liushen.length,
        liuqin: liuqin.length,
        wuxing: wuxing.length,
        dizhis: dizhis.length,
        arrays: { liushen, liuqin, wuxing, dizhis }
      });
    }

    // 默认宫位名称
    const defaultGongNames = ['大安', '留连', '速喜', '赤口', '小吉', '空亡'];
    
    // 记录每个宫位的转换过程
    const gongTransformations = [];

    // 构建完整的宫位信息
    const gongInfo: GongCollection = {};
    
    // 遍历构建宫位信息
    for (let i = 0; i < 6; i++) {
      const gongNumber = (i + 1).toString();
      const gongData = {
        god: liushen[i] || '',
        relation: liuqin[i] || '',
        star: wuxing[i] || '',
        branch: dizhis[i] || '',
        divination_number: params.number.toString()
      };
      
      console.log(`[getMobileDivinationInfo] Step 9.${i + 1} - Processing gong ${gongNumber}:`, {
        input: gongData,
        position: gongPositions[i] || defaultGongNames[i],
        number: gongNumber
      });

      gongInfo[`gong${gongNumber}`] = transformGongInfo(
        gongData,
        gongPositions[i] || defaultGongNames[i],
        gongNumber
      );

      console.log(`[getMobileDivinationInfo] Step 9.${i + 1} - Transformed gong ${gongNumber}:`, {
        result: gongInfo[`gong${gongNumber}`]
      });
    }

    console.log('[getMobileDivinationInfo] Step 9 - Complete gong info:', gongInfo);

    // 获取农历信息
    const lunarInfo = getLunarInfo(parsedDateTime.dateTime, params.number.toString());

    // 构建完整的结果数据
    const resultData = {
      divination_number: params.number.toString(),
      lunar_time: lunarInfo.lunarTime,
      yangli_time: formattedTime,
      time_palace: rawData.shigong?.toString() || '1',
      day_palace: rawData.rigong?.toString() || '1',
      gong_info: gongInfo,
      zishen_info: {
        dizhi: rawData.dizhi || '',
        zishen: rawData.rigong?.toString() || '1'
      }
    };

    console.log('[getMobileDivinationInfo] Step 10 - Processed result:', { code: 0, data: resultData });

    return {
      code: 0,
      data: resultData,
      msg: ''
    }
  } catch (error) {
    console.error('[getMobileDivinationInfo] Error:', error)
    return {
      code: -1,
      data: null,
      msg: error instanceof Error ? error.message : '获取占卜信息失败'
    }
  }
}

// 计算时辰
export function getShichen(hour: number): number {
  if (hour >= 23 || hour < 1) return 1;  // 子时 (23:00-1:00)
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

// 格式化日期时间
function formatDateTime(dateTime: { year: number; month: number; day: number; hour: number; minute: number }): string {
  const { year, month, day, hour, minute } = dateTime;
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}
