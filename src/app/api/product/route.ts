
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
  sku_images: ExternalApiImage[]; // Assuming sku_images or images can be used
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
  // Add other fields from the external API if needed for transformation
}

interface ExternalApiResponse {
  status: string;
  good: ExternalApiGoodData | null;
}


const PRODUCT_API_URL = 'https://orderhkuat.pokeguide.com/api/v1/goods/2';

// This mock data should conform to YOUR ProductData structure,
// as it's the fallback for your frontend.
const mockProductData: ProductData = {
  id: 2,
  name_tc: "精靈口罩套TC (Mock)",
  name_en: "CoverCraft POKÉMON MASK COVER (Mock)",
  name_sc: "精灵口罩套SC (Mock)",
  goods_images: ["https://placehold.co/600x400.png?text=Mock+Product+Image+1"],
  option_groups: [
    {
      id: 1,
      name_tc: "角色TC (Mock)",
      name_en: "Character (Mock)",
      name_sc: "角色SC (Mock)",
      options: [
        { id: 101, name_tc: "皮卡丘TC", name_en: "Pikachu", name_sc: "皮卡丘SC" },
        { id: 102, name_tc: "伊布TC", name_en: "Eevee", name_sc: "伊布SC" },
      ],
    },
    {
      id: 2,
      name_tc: "尺寸TC (Mock)",
      name_en: "Size (Mock)",
      name_sc: "尺寸SC (Mock)",
      options: [
        { id: 201, name_tc: "成人TC", name_en: "Adult", name_sc: "成人SC" },
        { id: 202, name_tc: "兒童TC", name_en: "Child", name_sc: "儿童SC" },
      ],
    },
  ],
  variants: [
    {
      id: 1001, sku: "MOCK-PIKA-ADULT", name_tc: "皮卡丘-成人 (Mock)", name_en: "Pikachu - Adult (Mock)", name_sc: "皮卡丘-成人 (Mock)",
      option_value_ids: [101, 201], stock: 10, price: "19.99", image: "https://placehold.co/600x400.png?text=Pikachu+Adult+Mock"
    },
    {
      id: 1002, sku: "MOCK-PIKA-CHILD", name_tc: "皮卡丘-兒童 (Mock)", name_en: "Pikachu - Child (Mock)", name_sc: "皮卡丘-儿童 (Mock)",
      option_value_ids: [101, 202], stock: 5, price: "17.99", image: "https://placehold.co/600x400.png?text=Pikachu+Child+Mock"
    },
    {
      id: 1003, sku: "MOCK-EEVEE-ADULT", name_tc: "伊布-成人 (Mock)", name_en: "Eevee - Adult (Mock)", name_sc: "伊布-成人 (Mock)",
      option_value_ids: [102, 201], stock: 0, price: "19.99", image: "https://placehold.co/600x400.png?text=Eevee+Adult+Mock"
    },
  ],
  max_quantity_per_order: 5,
  min_quantity_per_order: 1,
  description_en: "Select your favorite Pokémon character and size for your exclusive mask cover. (Mock Data)",
  description_tc: "為您的專屬口罩套選擇您最喜歡的寵物小精靈角色和尺寸。(模擬數據)",
  description_sc: "为您的专属口罩套选择您最喜欢的宝可梦角色和尺寸。(模拟数据)",
};

const mockApiResponse: ProductApiResponse = {
  code: 0,
  msg: "Success (Mock Data Fallback)",
  data: mockProductData,
};

function transformExternalGoodToProductData(externalGood: ExternalApiGoodData): ProductData {
  const optionNameLangFallback = (name: string) => ({ name_tc: name, name_en: name, name_sc: name });

  const optionGroups: ProductOptionGroup[] = externalGood.options.map(opt => ({
    id: opt.option_id,
    ...optionNameLangFallback(opt.option_name),
    options: opt.option_values.map(val => ({
      id: val.option_value_id,
      ...optionNameLangFallback(val.option_value_name),
    })),
  }));

  const variants: ProductVariant[] = externalGood.goods_sku
    .filter(sku => sku.is_enabled) // Only include enabled SKUs
    .map(sku => {
      const optionValueIds = sku.sku_option_mappings.map(m => m.option_value_id);
      
      // Derive variant name
      const variantOptionNames: string[] = [];
      sku.sku_option_mappings.forEach(mapping => {
        const group = externalGood.options.find(g => g.option_id === mapping.option_id);
        if (group) {
          const value = group.option_values.find(v => v.option_value_id === mapping.option_value_id);
          if (value) {
            variantOptionNames.push(value.option_value_name);
          }
        }
      });
      const derivedVariantName = variantOptionNames.join(' - ') || `Variant ${sku.sku_id}`;

      return {
        id: sku.sku_id,
        sku: `SKU-${sku.sku_id}`, // External API doesn't provide a string SKU like the mock
        ...optionNameLangFallback(derivedVariantName),
        option_value_ids: optionValueIds,
        stock: sku.inventory, // Use inventory, or remaining_inventory if more appropriate
        price: sku.price.toFixed(2), // External API price is number, internal type is string
        image: sku.images?.[0]?.url || sku.sku_images?.[0]?.url || externalGood.goods_images?.[0]?.url || null,
      };
    });

  return {
    id: externalGood.goods_id,
    ...optionNameLangFallback(externalGood.goods_name), // Using goods_name for all languages for now
    name_en: externalGood.goods_name, // Prioritize provided name for en, can be adjusted
    goods_images: externalGood.goods_images.map(img => img.url),
    option_groups: optionGroups,
    variants: variants,
    max_quantity_per_order: externalGood.max_per_user,
    min_quantity_per_order: 1, // Defaulting to 1 as it's not in the new API structure directly
    description_tc: externalGood.description,
    description_en: externalGood.description, // Using main description for all languages
    description_sc: externalGood.description,
  };
}

export async function GET() {
  try {
    const response = await fetch(PRODUCT_API_URL, {
      cache: 'no-store', 
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      // Non-2xx response from external API
      const errorText = await response.text().catch(() => "Could not retrieve error text from external API");
      console.error(`External API HTTP Error (${response.status}): ${errorText}. Falling back to mock data.`);
      return NextResponse.json(mockApiResponse);
    }

    const externalApiResponse: ExternalApiResponse = await response.json();

    if (externalApiResponse.status !== "OK" || !externalApiResponse.good) {
      console.warn(`External API returned status '${externalApiResponse.status}' or no 'good' data. Falling back to mock data.`);
      return NextResponse.json(mockApiResponse);
    }
    
    // Transform the external API data to our internal ProductData structure
    const transformedData = transformExternalGoodToProductData(externalApiResponse.good);
    
    return NextResponse.json({
      code: 0,
      msg: "Success (Live Data)",
      data: transformedData,
    });

  } catch (error) {
    console.error('Network or other error fetching or transforming product data:', error);
    // const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Falling back to mock data due to error.');
    return NextResponse.json(mockApiResponse);
  }
}
