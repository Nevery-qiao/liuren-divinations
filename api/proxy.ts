import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

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

  try {
    const { ri, shi } = req.query;
    
    if (!ri || !shi) {
      return res.status(400).json({ 
        code: -1, 
        msg: '缺少必要参数' 
      });
    }

    const response = await axios.get('https://demo1.w258.cn/2024/xlr/pan.php', {
      params: { ri, shi },
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      code: -1,
      msg: error.message || '服务器错误'
    });
  }
}
