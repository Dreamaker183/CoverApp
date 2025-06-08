export interface ProductOption {
  id: number;
  name_tc: string;
  name_en: string;
  name_sc: string;
}

export interface ProductOptionGroup {
  id: number;
  name_tc: string;
  name_en: string;
  name_sc: string;
  options: ProductOption[];
}

export interface ProductVariant {
  id: number;
  sku: string;
  name_tc: string;
  name_en: string;
  name_sc: string;
  option_value_ids: number[];
  stock: number;
  price: string;
  image: string | null;
}

export interface ProductData {
  id: number;
  name_tc: string;
  name_en: string;
  name_sc: string;
  goods_images: string[];
  option_groups: ProductOptionGroup[];
  variants: ProductVariant[];
  max_quantity_per_order: number;
  min_quantity_per_order: number;
  description_tc?: string;
  description_en?: string;
  description_sc?: string;
}

export interface ProductApiResponse {
  code: number;
  msg: string;
  data: ProductData | null;
}

export type SelectedOptions = { [key: number]: number | null };
