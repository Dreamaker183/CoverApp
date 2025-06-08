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

function transformExternalGoodToProductData(externalGood: ExternalApiGoodData): ProductData {
  const optionGroups: ProductOptionGroup[] = externalGood.options.map(opt => ({
    id: opt.option_id,
    name_en: opt.option_name,
    name_tc: opt.option_name,
    name_sc: opt.option_name,
    options: opt.option_values.map(val => ({
      id: val.option_value_id,
      name_en: val.option_value_name,
      name_tc: val.option_value_name,
      name_sc: val.option_value_name,
    })),
  }));

  const variants: ProductVariant[] = externalGood.goods_sku
    .filter(sku => sku.is_enabled)
    .map(sku => {
      const optionValueIds = sku.sku_option_mappings.map(m => m.option_value_id);
      
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
        sku: `SKU-${sku.sku_id}`,
        name_en: derivedVariantName,
        name_tc: derivedVariantName,
        name_sc: derivedVariantName,
        option_value_ids: optionValueIds,
        stock: sku.inventory,
        price: sku.price.toFixed(2),
        image: sku.images?.[0]?.url || sku.sku_images?.[0]?.url || externalGood.goods_images?.[0]?.url || null,
      };
    });

  return {
    id: externalGood.goods_id,
    name_en: externalGood.goods_name,
    name_tc: externalGood.goods_name,
    name_sc: externalGood.goods_name,
    goods_images: externalGood.goods_images.map(img => img.url),
    option_groups: optionGroups,
    variants: variants,
    max_quantity_per_order: externalGood.max_per_user,
    min_quantity_per_order: 1,
    description_en: externalGood.description,
    description_tc: externalGood.description,
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
      throw new Error(`External API HTTP Error (${response.status})`);
    }

    const externalApiResponse: ExternalApiResponse = await response.json();

    if (externalApiResponse.status !== "OK" || !externalApiResponse.good) {
      throw new Error(`External API returned status '${externalApiResponse.status}' or no 'good' data`);
    }
    
    const transformedData = transformExternalGoodToProductData(externalApiResponse.good);
    
    return NextResponse.json({
      code: 0,
      msg: "Success",
      data: transformedData,
    });

  } catch (error) {
    console.error('Error fetching or transforming product data:', error);
    return NextResponse.json({
      code: 1,
      msg: error instanceof Error ? error.message : 'Unknown error occurred',
      data: null
    }, { status: 500 });
  }
}
