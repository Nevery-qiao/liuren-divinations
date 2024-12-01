import type { DivinationResponse } from '../api/liuren'

export interface DivinationHistory {
  id: string;           // 唯一标识
  time: string;         // ISO格式的时间字符串
  timestamp: number;    // 时间戳（毫秒）
  question: string;     // 占卜问题
  result: DivinationResponse; // 占卜结果
  notes?: string;       // 笔记（可选）
  number: number;       // 占卜数字
  emoji?: string;       // 添加 emoji 字段
}

export interface GroupedHistory {
  title: string;        // 分组标题（今天、昨天、X天前等）
  items: DivinationHistory[];
}
