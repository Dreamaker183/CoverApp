
import { NextResponse } from 'next/server';
import type { ProductApiResponse, ProductData } from '@/types/product';

const PRODUCT_API_URL = 'https://orderhkuat.pokeguide.com/api/v1/goods/2';

const mockProductData: ProductData = {
  id: 2,
  name_tc: "精靈口罩套TC (Mock)",
  name_en: "CoverCraft POKÉMON MASK COVER (Mock)",
  name_sc: "精灵口罩套SC (Mock)",
  goods_images: ["https://placehold.co/600x400.png?text=Mock+Product+Image+1"],
  option_groups: [
    {
      id: 1,
      name_tc: "角色TC",
      name_en: "Character",
      name_sc: "角色SC",
      options: [
        { id: 101, name_tc: "皮卡丘TC", name_en: "Pikachu", name_sc: "皮卡丘SC" },
        { id: 102, name_tc: "伊布TC", name_en: "Eevee", name_sc: "伊布SC" },
        { id: 103, name_tc: "小火龍TC", name_en: "Charmander", name_sc: "小火龙SC" },
      ],
    },
    {
      id: 2,
      name_tc: "尺寸TC",
      name_en: "Size",
      name_sc: "尺寸SC",
      options: [
        { id: 201, name_tc: "成人TC", name_en: "Adult", name_sc: "成人SC" },
        { id: 202, name_tc: "兒童TC", name_en: "Child", name_sc: "儿童SC" },
      ],
    },
  ],
  variants: [
    {
      id: 1001, sku: "MOCK-PIKA-ADULT", name_tc: "皮卡丘-成人", name_en: "Pikachu - Adult", name_sc: "皮卡丘-成人",
      option_value_ids: [101, 201], stock: 10, price: "19.99", image: "https://placehold.co/600x400.png?text=Pikachu+Adult"
    },
    {
      id: 1002, sku: "MOCK-PIKA-CHILD", name_tc: "皮卡丘-兒童", name_en: "Pikachu - Child", name_sc: "皮卡丘-儿童",
      option_value_ids: [101, 202], stock: 5, price: "17.99", image: "https://placehold.co/600x400.png?text=Pikachu+Child"
    },
    {
      id: 1003, sku: "MOCK-EEVEE-ADULT", name_tc: "伊布-成人", name_en: "Eevee - Adult", name_sc: "伊布-成人",
      option_value_ids: [102, 201], stock: 0, price: "19.99", image: "https://placehold.co/600x400.png?text=Eevee+Adult" // Sold out
    },
    {
      id: 1004, sku: "MOCK-EEVEE-CHILD", name_tc: "伊布-兒童", name_en: "Eevee - Child", name_sc: "伊布-儿童",
      option_value_ids: [102, 202], stock: 8, price: "17.99", image: "https://placehold.co/600x400.png?text=Eevee+Child"
    },
    {
      id: 1005, sku: "MOCK-CHAR-ADULT", name_tc: "小火龍-成人", name_en: "Charmander - Adult", name_sc: "小火龙-成人",
      option_value_ids: [103, 201], stock: 12, price: "20.99", image: "https://placehold.co/600x400.png?text=Charmander+Adult"
    },
    {
      id: 1006, sku: "MOCK-CHAR-CHILD", name_tc: "小火龍-兒童", name_en: "Charmander - Child", name_sc: "小火龙-儿童",
      option_value_ids: [103, 202], stock: 3, price: "18.99", image: "https://placehold.co/600x400.png?text=Charmander+Child"
    },
  ],
  max_quantity_per_order: 5,
  min_quantity_per_order: 1,
  description_en: "Select your favorite Pokémon character and size for your exclusive mask cover. Made with high-quality, breathable materials for comfort and style. (Mock Data)",
  description_tc: "為您的專屬口罩套選擇您最喜歡的寵物小精靈角色和尺寸。採用優質透氣材料製成，兼顧舒適與時尚。(模擬數據)",
  description_sc: "为您的专属口罩套选择您最喜欢的宝可梦角色和尺寸。采用优质透气材料制成，兼顾舒适与时尚。(模拟数据)",
};

const mockApiResponse: ProductApiResponse = {
  code: 0,
  msg: "Success (Mock Data Fallback)",
  data: mockProductData,
};

export async function GET() {
  try {
    const response = await fetch(PRODUCT_API_URL, {
      cache: 'no-store', // Ensure fresh data on every request
      headers: {
        // It's good practice to send an Accept header
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Could not retrieve error text");
      console.error(`API HTTP Error (${response.status}): ${errorText}. Falling back to mock data.`);
      return NextResponse.json(mockApiResponse);
    }

    const data: ProductApiResponse = await response.json();

    // Check if the external API call was successful but the response body indicates an error
    if (data.code !== 0 || !data.data) {
        console.warn(`External API returned success status but error in body: Code ${data.code}, Msg: ${data.msg}. Falling back to mock data.`);
        return NextResponse.json(mockApiResponse);
    }
    
    // If everything is fine, return the live API data
    return NextResponse.json(data);

  } catch (error) {
    console.error('Network or other error fetching product data:', error);
    // const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Falling back to mock data due to error.');
    return NextResponse.json(mockApiResponse);
  }
}
