
import { NextResponse } from 'next/server';
import type { ProductApiResponse, ProductData } from '@/types/product';

const PRODUCT_API_URL = 'https://orderhkuat.pokeguide.com/api/v1/goods/2';

// const mockProductData: ProductData = {
//   id: 2,
//   name_tc: "精靈口罩套TC",
//   name_en: "CoverCraft POKÉMON MASK COVER",
//   name_sc: "精灵口罩套SC",
//   goods_images: ["https://placehold.co/600x400.png"],
//   option_groups: [
//     {
//       id: 1,
//       name_tc: "角色TC",
//       name_en: "Character",
//       name_sc: "角色SC",
//       options: [
//         { id: 101, name_tc: "皮卡丘TC", name_en: "Pikachu", name_sc: "皮卡丘SC" },
//         { id: 102, name_tc: "伊布TC", name_en: "Eevee", name_sc: "伊布SC" },
//         { id: 103, name_tc: "小火龍TC", name_en: "Charmander", name_sc: "小火龙SC" },
//       ],
//     },
//     {
//       id: 2,
//       name_tc: "尺寸TC",
//       name_en: "Size",
//       name_sc: "尺寸SC",
//       options: [
//         { id: 201, name_tc: "成人TC", name_en: "Adult", name_sc: "成人SC" },
//         { id: 202, name_tc: "兒童TC", name_en: "Child", name_sc: "儿童SC" },
//       ],
//     },
//   ],
//   variants: [
//     {
//       id: 1001, sku: "MOCK-PIKA-ADULT", name_tc: "皮卡丘-成人", name_en: "Pikachu - Adult", name_sc: "皮卡丘-成人",
//       option_value_ids: [101, 201], stock: 10, price: "19.99", image: "https://placehold.co/600x400.png"
//     },
//     {
//       id: 1002, sku: "MOCK-PIKA-CHILD", name_tc: "皮卡丘-兒童", name_en: "Pikachu - Child", name_sc: "皮卡丘-儿童",
//       option_value_ids: [101, 202], stock: 5, price: "17.99", image: "https://placehold.co/600x400.png"
//     },
//     {
//       id: 1003, sku: "MOCK-EEVEE-ADULT", name_tc: "伊布-成人", name_en: "Eevee - Adult", name_sc: "伊布-成人",
//       option_value_ids: [102, 201], stock: 0, price: "19.99", image: "https://placehold.co/600x400.png" // Sold out
//     },
//     {
//       id: 1004, sku: "MOCK-EEVEE-CHILD", name_tc: "伊布-兒童", name_en: "Eevee - Child", name_sc: "伊布-儿童",
//       option_value_ids: [102, 202], stock: 8, price: "17.99", image: "https://placehold.co/600x400.png"
//     },
//     {
//       id: 1005, sku: "MOCK-CHAR-ADULT", name_tc: "小火龍-成人", name_en: "Charmander - Adult", name_sc: "小火龙-成人",
//       option_value_ids: [103, 201], stock: 12, price: "20.99", image: "https://placehold.co/600x400.png"
//     },
//     {
//       id: 1006, sku: "MOCK-CHAR-CHILD", name_tc: "小火龍-兒童", name_en: "Charmander - Child", name_sc: "小火龙-儿童",
//       option_value_ids: [103, 202], stock: 3, price: "18.99", image: "https://placehold.co/600x400.png"
//     },
//   ],
//   max_quantity_per_order: 5,
//   min_quantity_per_order: 1,
//   description_en: "Select your favorite Pokémon character and size for your exclusive mask cover. Made with high-quality, breathable materials for comfort and style.",
//   description_tc: "為您的專屬口罩套選擇您最喜歡的寵物小精靈角色和尺寸。採用優質透氣材料製成，兼顧舒適與時尚。",
//   description_sc: "为您的专属口罩套选择您最喜欢的宝可梦角色和尺寸。采用优质透气材料制成，兼顾舒适与时尚。",
// };

// const mockApiResponse: ProductApiResponse = {
//   code: 0,
//   msg: "Success (Mock Data)",
//   data: mockProductData,
// };

export async function GET() {
  // For prototyping, always return mock data.
  // The original code that fetches from PRODUCT_API_URL can be restored later if needed.
  // return NextResponse.json(mockApiResponse);

  // Original fetching logic:
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

    // If the external API call was successful but the response body indicates an error
    if (data.code !== 0 || !data.data) {
        console.warn(`External API returned success status but error in body: Code ${data.code}, Msg: ${data.msg}.`);
        // If you want to fall back to mock data on API logical errors, you can re-enable it here:
        // const mockApiResponseOnError: ProductApiResponse = { code: 0, msg: "Success (Mock Data Fallback)", data: mockProductData };
        // return NextResponse.json(mockApiResponseOnError);
    }
    return NextResponse.json(data);

  } catch (error) {
    console.error('Network or other error fetching product data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // If you want to fall back to mock data on any catch, you can re-enable it here:
    // const mockApiResponseOnError: ProductApiResponse = { code: 0, msg: "Success (Mock Data Fallback)", data: mockProductData };
    // return NextResponse.json(mockApiResponseOnError);
    return NextResponse.json({ code: 500, msg: `Internal server error: ${errorMessage}`, data: null }, { status: 500 });
  }
}
