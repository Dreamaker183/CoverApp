import { NextResponse } from 'next/server';
import type { ProductApiResponse, ProductData, ProductOptionGroup, ProductVariant, ProductOption } from '@/types/product';

// Define interfaces for the external API structure
interface ExternalApiImage {
  image_id: number;
  url: string;
  lang: string | null;
  weighting: number;
}

interface ExternalApiOptionValue {
  option_value_id: number;
  weight: number;
  option_value_name: string;
}

interface ExternalApiOption {
  option_id: number;
  option_name: string;
  can_change_after_payment: boolean;
  option_values: ExternalApiOptionValue[];
}

interface ExternalApiSkuOptionMapping {
  option_id: number;
  option_value_id: number;
}

interface ExternalApiGoodsSku {
  price: number;
  discounted_price: number;
  inventory: number;
  max_inventory: number;
  sold_out_after: number | null;
  is_donation: boolean;
  fixed_shipment_price: number;
  sku_id: number;
  unit_id: number | null;
  remaining_inventory: number;
  description: string;
  sku_images: ExternalApiImage[];
  images: ExternalApiImage[];
  is_enabled: boolean;
  sku_option_mappings: ExternalApiSkuOptionMapping[];
}

interface ExternalApiGoodData {
  goods_id: number;
  max_per_user: number;
  goods_name: string;
  is_enabled: boolean;
  description: string;
  goods_images: ExternalApiImage[];
  options: ExternalApiOption[];
  goods_sku: ExternalApiGoodsSku[];
}

interface ExternalApiResponse {
  status: string;
  good: ExternalApiGoodData | null;
}

const PRODUCT_API_URL = 'https://orderhkuat.pokeguide.com/api/v1/goods/2';
const FALLBACK_API_URL = 'https://orderhk.pokeguide.com/api/v1/goods/2';

// Translation map for Chinese to English
const translations: Record<string, string> = {
  "口罩套": "Mask Cover",
  "我是口罩套": "I am a Mask Cover",
  "大小": "Size",
  "大": "Large",
  "小": "Small",
  "顏色": "Color",
  "颜色": "Color",
  "黑": "Black",
  "黃": "Yellow",
  "黄": "Yellow",
  "白": "White",
  "產地": "Origin",
  "产地": "Origin",
  "香港": "Hong Kong",
  "越南": "Vietnam",
  "台灣": "Taiwan",
  "台湾": "Taiwan",
};

function translate(text: string): string {
  return translations[text] || text;
}

function transformExternalGoodToProductData(externalGood: ExternalApiGoodData): ProductData {
  const optionGroups: ProductOptionGroup[] = externalGood.options.map(opt => ({
    id: opt.option_id,
    name_en: translate(opt.option_name),
    name_tc: opt.option_name,
    name_sc: opt.option_name,
    options: opt.option_values.map(val => ({
      id: val.option_value_id,
      name_en: translate(val.option_value_name),
      name_tc: val.option_value_name,
      name_sc: val.option_value_name,
    })),
  }));

  const variants: ProductVariant[] = externalGood.goods_sku
    .filter(sku => sku.is_enabled)
    .map(sku => {
      const optionValueIds = sku.sku_option_mappings.map(m => m.option_value_id);
      
      const variantOptionNamesEn: string[] = [];
      const variantOptionNamesTc: string[] = [];

      sku.sku_option_mappings.forEach(mapping => {
        const group = externalGood.options.find(g => g.option_id === mapping.option_id);
        if (group) {
          const value = group.option_values.find(v => v.option_value_id === mapping.option_value_id);
          if (value) {
            variantOptionNamesEn.push(translate(value.option_value_name));
            variantOptionNamesTc.push(value.option_value_name);
          }
        }
      });
      const derivedVariantNameEn = variantOptionNamesEn.join(' - ') || `Variant ${sku.sku_id}`;
      const derivedVariantNameTc = variantOptionNamesTc.join(' - ') || `變體 ${sku.sku_id}`;

      return {
        id: sku.sku_id,
        sku: `SKU-${sku.sku_id}`,
        name_en: derivedVariantNameEn,
        name_tc: derivedVariantNameTc,
        name_sc: derivedVariantNameTc,
        option_value_ids: optionValueIds,
        stock: sku.remaining_inventory,
        price: sku.price.toFixed(2),
        image: sku.images?.[0]?.url || sku.sku_images?.[0]?.url || externalGood.goods_images?.[0]?.url || null,
      };
    });

  return {
    id: externalGood.goods_id,
    name_en: translate(externalGood.goods_name),
    name_tc: externalGood.goods_name,
    name_sc: externalGood.goods_name,
    goods_images: externalGood.goods_images.map(img => img.url),
    option_groups: optionGroups,
    variants: variants,
    max_quantity_per_order: externalGood.max_per_user,
    min_quantity_per_order: 1,
    description_en: translate(externalGood.description),
    description_tc: externalGood.description,
    description_sc: externalGood.description,
  };
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1} to fetch from:`, url);
      
      const response = await fetch(url, {
        cache: 'no-store',
        headers: { 
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (response.ok) {
        console.log(`Success on attempt ${i + 1}`);
        return response;
      }
      
      console.error(`Attempt ${i + 1} failed with status:`, response.status);
      lastError = new Error(`HTTP Error: ${response.status}`);
      
      if (i === retries - 1) {
        return response;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    } catch (error) {
      console.error(`Attempt ${i + 1} failed with error:`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      
      if (i === retries - 1) {
        throw lastError;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

export async function GET() {
  try {
    console.log('Starting product data fetch...');
    
    // Try primary URL first
    let response = await fetchWithRetry(PRODUCT_API_URL).catch(error => {
      console.error('Primary URL failed:', error);
      return null;
    });
    
    // If primary URL fails, try fallback URL
    if (!response || !response.ok) {
      console.log('Trying fallback URL...');
      response = await fetchWithRetry(FALLBACK_API_URL);
    }

    if (!response.ok) {
      console.error('Both URLs failed. Last error:', response.status, response.statusText);
      throw new Error(`API HTTP Error (${response.status}): ${response.statusText}`);
    }

    const externalApiResponse: ExternalApiResponse = await response.json();
    console.log('API response status:', externalApiResponse.status);

    if (externalApiResponse.status !== "OK" || !externalApiResponse.good) {
      console.error('Invalid API response:', externalApiResponse);
      throw new Error(`API returned status '${externalApiResponse.status}' or no 'good' data`);
    }
    
    const transformedData = transformExternalGoodToProductData(externalApiResponse.good);
    console.log('Data transformation successful');
    
    return NextResponse.json({
      code: 0,
      msg: "Success",
      data: transformedData,
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error in product API route:', error);
    return NextResponse.json({
      code: 1,
      msg: error instanceof Error ? error.message : 'Unknown error occurred',
      data: null
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  }
}
