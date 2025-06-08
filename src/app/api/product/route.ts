import { NextResponse } from 'next/server';
import type { ProductApiResponse } from '@/types/product';

const PRODUCT_API_URL = 'https://orderhkuat.pokeguide.com/api/v1/goods/2';

export async function GET() {
  try {
    const response = await fetch(PRODUCT_API_URL, {
      cache: 'no-store', // Ensure fresh data on every request
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      return NextResponse.json({ code: response.status, msg: `Failed to fetch product data: ${errorText}`, data: null }, { status: response.status });
    }

    const data: ProductApiResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Network or other error fetching product data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ code: 500, msg: `Internal server error: ${errorMessage}`, data: null }, { status: 500 });
  }
}
