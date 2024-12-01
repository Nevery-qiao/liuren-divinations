import axios from 'axios';
import { Lunar } from 'lunar-typescript';

const apiUrl = '/api/pan';

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

export interface DivinationResponse {
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
}

export async function getDivinationInfo(number: string, time?: string): Promise<DivinationResponse> {
    try {
        console.log('Starting getDivinationInfo with:', { number, time });
        
        if (!Number.isInteger(Number(number))) {
            throw new Error('占数必须是整数');
        }

        const dateTime = parseDateTime(time);
        const shichen = getShichen(dateTime.hour);
        console.log('Processed datetime:', { dateTime, shichen });

        const params = {
            ri: number,
            shi: shichen.toString()
        };
        
        console.log('Request params:', params);

        // 直接访问原始 API
        const response = await axios.get('http://demo1.w258.cn/2024/xlr/pan.php', { 
            params,
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('API Response:', response);

        if (!response.data) {
            console.error('Empty response data');
            throw new Error('API 返回为空');
        }

        const apiResponse = response.data;
        console.log('Raw API response:', apiResponse);

        if (typeof apiResponse === 'string') {
            try {
                const parsedResponse = JSON.parse(apiResponse);
                console.log('Parsed API response:', parsedResponse);
                apiResponse = parsedResponse;
            } catch (e) {
                console.error('Failed to parse API response:', e);
                throw new Error('API 返回格式错误');
            }
        }

        const formattedDateTime = formatDateTime(dateTime);
        
        const timePalacePosition = gongPositions[apiResponse.shigong - 1];
        const dayPalacePosition = gongPositions[apiResponse.rigong - 1];

        const lunarInfo = getLunarInfo({
            year: dateTime.year,
            month: dateTime.month,
            day: dateTime.day,
            hour: dateTime.hour
        }, number);

        return {
            code: 0,
            data: {
                divination_number: number,
                lunar_time: lunarInfo,
                yangli_time: formattedDateTime,
                time_palace: timePalacePosition,
                day_palace: dayPalacePosition,
                gong_info: {
                    gong1: { position: "大安", god: "", relation: "", star: "", branch: "", number: "1" },
                    gong2: { position: "留连", god: "", relation: "", star: "", branch: "", number: "2" },
                    gong3: { position: "速喜", god: "", relation: "", star: "", branch: "", number: "3" },
                    gong4: { position: "赤口", god: "", relation: "", star: "", branch: "", number: "4" },
                    gong5: { position: "小吉", god: "", relation: "", star: "", branch: "", number: "5" },
                    gong6: { position: "空亡", god: "", relation: "", star: "", branch: "", number: "6" }
                },
                debug_info: {
                    api_response: apiResponse,
                    shichen: shichen,
                    input_hour: dateTime.hour,
                    gongInfoArray: []
                }
            }
        };
    } catch (error) {
        console.error('Error in getDivinationInfo:', error);
        return {
            code: -1,
            data: null
        };
    }
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

function getShichen(hour: number): number {
    if (hour >= 23 || hour < 1) return 1;
    if (hour >= 1 && hour < 3) return 2;
    if (hour >= 3 && hour < 5) return 3;
    if (hour >= 5 && hour < 7) return 4;
    if (hour >= 7 && hour < 9) return 5;
    if (hour >= 9 && hour < 11) return 6;
    if (hour >= 11 && hour < 13) return 7;
    if (hour >= 13 && hour < 15) return 8;
    if (hour >= 15 && hour < 17) return 9;
    if (hour >= 17 && hour < 19) return 10;
    if (hour >= 19 && hour < 21) return 11;
    return 12;
}

function getLunarInfo(dateTime: { year: number; month: number; day: number; hour: number }, divination_number: string) {
    const date = new Date(dateTime.year, dateTime.month - 1, dateTime.day, dateTime.hour);
    const lunar = Lunar.fromDate(date);
    
    return `${lunar.getYearInGanZhi()}年  ${lunar.getMonthInGanZhi()}月  ${lunar.getDayInGanZhi()}日  ${lunar.getTimeInGanZhi()}时 【数字：${divination_number}】`;
}
