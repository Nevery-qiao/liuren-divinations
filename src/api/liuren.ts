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
function transformGongInfo(info: any, position: string, number: string): GongInfo {
    return {
        position,
        god: info.god || "",
        relation: info.relation || "",
        star: info.star || "",
        branch: info.branch || "",
        number,
        divination_number: info.divination_number
    };
}

function getLunarInfo(dateTime: { year: number; month: number; day: number; hour: number }, divination_number: string) {
    const date = new Date(dateTime.year, dateTime.month - 1, dateTime.day, dateTime.hour);
    const lunar = Lunar.fromDate(date);
    
    return {
        lunarTime: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}日 ${lunar.getTimeZhi()}时`,
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

    if (timeStr.includes(' ')) {
        console.log('Processing time with space');
        const [dateStr, timeStr] = timeStr.split(' ');
        const [y, m, d] = dateStr.split('-').map(Number);
        const [h, min] = timeStr.split(':').map(Number);
        
        year = y;
        month = m;
        day = d;
        hour = h;
        minute = min;
    } else {
        console.log('Processing time with hyphens only');
        const [y, m, d, timeStr] = timeStr.split('-');
        const [h, min] = timeStr ? timeStr.split(':').map(Number) : [0, 0];
        
        year = parseInt(y);
        month = parseInt(m);
        day = parseInt(d);
        hour = h || 0;
        minute = min || 0;
    }

    return {
        dateTime: { year, month, day, hour, minute },
        shichen: getShichen(hour)
    };
}

export interface DivinationParams {
    time?: string;
    number: string;
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
}

export async function getDivinationInfo(params: DivinationParams): Promise<DivinationResult> {
    console.log('Starting getDivinationInfo with:', {
        params,
        numberType: typeof params.number,
        numberValue: params.number,
        timeType: typeof params.time,
        timeValue: params.time
    });
    
    try {
        // 验证参数
        if (!params.number) {
            console.error('Validation failed: number is empty or invalid', {
                number: params.number,
                type: typeof params.number,
                truthyCheck: !!params.number
            });
            throw new Error('占数不能为空');
        }

        const { dateTime, shichen } = parseDateTime(params.time);
        console.log('Parsed date time:', {
            input: params.time,
            parsed: dateTime,
            shichen,
        });

        const { number } = params;
        console.log('Extracted number:', {
            original: params.number,
            extracted: number,
            type: typeof number
        });

        // 构建请求参数
        const requestParams = {
            ri: number,
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
        const lunarInfo = getLunarInfo(dateTime, number);

        // 基础信息
        const baseInfo = apiResponse[0];
        if (!baseInfo) {
            throw new Error('API 返回数据格式错误');
        }

        // 构建完整的宫位信息
        const gongInfo = {
            gong1: transformGongInfo({
                god: baseInfo.liushen?.[0] || "",
                relation: baseInfo.liuqin?.[0] || "",
                star: baseInfo.wuxing?.[0] || "",
                branch: baseInfo.dizhis?.[0] || "",
                divination_number: baseInfo.zhangshu || ""
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
            dizhi: baseInfo.dizhi || "",
            zishen: baseInfo.zishen || "",
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
                zishen_info: zishenInfo,
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
