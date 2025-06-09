import type { ProductApiResponse } from '@/types/product';

export async function fetchProduct(): Promise<ProductApiResponse> {
  const response = await fetch('/api/product', {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ msg: 'Failed to parse error response' }));
    throw new Error(errorData.msg || `Failed to fetch product data. Status: ${response.status}`);
  }
  
  const data = await response.json();
  if (data.code !== 0 || !data.data) {
    throw new Error(data.msg || 'Product data not found or API returned an error code.');
  }
  return data;
}
