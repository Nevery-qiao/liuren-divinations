import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const TARGET_URL = 'https://demo1.w258.cn/2024/xlr/pan.php';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { ri, shi } = req.query;

  // 验证参数
  if (!ri || !shi) {
    return res.status(400).json({
      code: -1,
      msg: '缺少必要参数'
    });
  }

  // 验证数字格式
  if (!Number.isInteger(Number(ri)) || !Number.isInteger(Number(shi))) {
    return res.status(400).json({
      code: -1,
      msg: '参数必须是整数'
    });
  }

  try {
    const response = await axios.get(TARGET_URL, {
      params: { ri, shi },
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://demo1.w258.cn/'
      }
    });

    // 验证响应格式
    if (typeof response.data === 'string') {
      try {
        response.data = JSON.parse(response.data);
      } catch (e) {
        console.error('Failed to parse API response:', e);
        return res.status(500).json({
          code: -1,
          msg: 'API 返回格式错误'
        });
      }
    }

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      code: -1,
      msg: error.response?.data?.msg || error.message || '服务器错误'
    });
  }
}
