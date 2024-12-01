import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const API_URL = 'http://demo1.w258.cn/2024/xlr/pan.php';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // 允许跨域请求
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 请求
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    console.log('API request received:', request.body);

    if (request.method !== 'POST') {
      console.log('Invalid method:', request.method);
      return response.status(405).json({ error: 'Method not allowed' });
    }

    const { ri, shi } = request.body;
    if (!ri || !shi) {
      console.log('Missing parameters:', request.body);
      return response.status(400).json({ error: 'Missing required parameters' });
    }

    console.log('Sending request to API:', { ri, shi });

    const apiResponse = await axios.post(API_URL, 
      new URLSearchParams({ ri, shi }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('API response:', apiResponse.data);

    return response.status(200).json(apiResponse.data);
  } catch (error) {
    console.error('API proxy error:', error);
    return response.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
