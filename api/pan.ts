import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const API_URL = 'http://demo1.w258.cn/2024/xlr/pan.php';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Method not allowed' });
    }

    const { ri, shi } = request.body;
    if (!ri || !shi) {
      return response.status(400).json({ error: 'Missing required parameters' });
    }

    const apiResponse = await axios.post(API_URL, 
      new URLSearchParams({ ri, shi }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.status(200).json(apiResponse.data);
  } catch (error) {
    console.error('API proxy error:', error);
    return response.status(500).json({ error: 'Internal server error' });
  }
}
