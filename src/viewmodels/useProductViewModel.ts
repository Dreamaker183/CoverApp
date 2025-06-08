'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ProductData, ProductVariant, SelectedOptions, ProductOptionGroup, ProductOption } from '@/types/product';
import { fetchProduct } from '@/models/productModel';

export interface UseProductViewModelReturn {
  product: ProductData | null;
  selectedOptions: SelectedOptions;
  quantity: number;
  currentVariant: ProductVariant | null;
  currentPrice: number | null;
  currentImage: string | null;
  isLoading: boolean;
  error: string | null;
  isSoldOut: boolean;
  totalStockForSelectedOptions: number;
  handleSelectOption: (optionGroupId: number, optionId: number) => void;
  setQuantity: (newQuantity: number) => void;
  getOptionState: (optionGroupId: number, optionId: number) => 'selected' | 'available' | 'disabled';
  effectiveMaxQuantity: number;
  effectiveMinQuantity: number;
}

export function useProductViewModel(): UseProductViewModelReturn {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const [quantity, setQuantity] = useState(1);
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setIsLoading(true);
        setError(null);
        const productResponse = await fetchProduct();
        
        if (!productResponse.data) {
          setError(productResponse.msg || 'No product data found.');
          setProduct(null);
          return;
        }

        const productData = productResponse.data;
        setProduct(productData);
        
        const initialSelectedOptions: SelectedOptions = {};
        if (productData.option_groups) {
          productData.option_groups.forEach(group => {
            if (group.options && group.options.length > 0) {
              let foundInitialOption = false;
              for (const opt of group.options) {
                const tempSelection = { ...initialSelectedOptions, [group.id]: opt.id };
                if (productData.variants.some((v: ProductVariant) => 
                    v.option_value_ids.includes(opt.id) &&
                    Object.values(tempSelection).every(val => val === null || v.option_value_ids.includes(val as number))
                )) {
                  initialSelectedOptions[group.id] = opt.id;
                  foundInitialOption = true;
                  break;
                }
              }
              if (!foundInitialOption) {
                initialSelectedOptions[group.id] = null;
              }
            } else {
              initialSelectedOptions[group.id] = null;
            }
          });
        }
        setSelectedOptions(initialSelectedOptions);
        setQuantity(productData.min_quantity_per_order || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching product data.');
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, []);

  const findVariant = useCallback((currentSelectedOptions: SelectedOptions): ProductVariant | null => {
    if (!product || Object.values(currentSelectedOptions).some(val => val === null)) {
      return null;
    }
    const selectedIds = Object.values(currentSelectedOptions).filter(id => id !== null) as number[];
    if (selectedIds.length !== product.option_groups.length) return null;

    return product.variants.find(variant =>
      selectedIds.every(id => variant.option_value_ids.includes(id)) &&
      variant.option_value_ids.length === selectedIds.length 
    ) || null;
  }, [product]);

  useEffect(() => {
    if (product) {
      const variant = findVariant(selectedOptions);
      setCurrentVariant(variant);
      if (variant) {
        setQuantity((prevQuantity: number) => Math.max(product.min_quantity_per_order, Math.min(prevQuantity, variant.stock, product.max_quantity_per_order)));
      } else {
         setQuantity(product.min_quantity_per_order);
      }
    }
  }, [product, selectedOptions, findVariant]);

  const handleSelectOption = useCallback((optionGroupId: number, optionId: number) => {
    setSelectedOptions((prev: SelectedOptions) => {
      const newSelectedOptions = { ...prev, [optionGroupId]: optionId };
      return newSelectedOptions;
    });
  }, []);

  const currentPrice = useMemo(() => {
    if (currentVariant) {
      return parseFloat(currentVariant.price) * quantity;
    }
    return null;
  }, [currentVariant, quantity]);

  const currentImage = useMemo(() => {
    return currentVariant?.image || product?.goods_images?.[0] || null;
  }, [currentVariant, product]);

  const isSoldOut = useMemo(() => {
    if (!product) return true;
    if (Object.values(selectedOptions).some(val => val === null)) return false;
    return currentVariant ? currentVariant.stock === 0 : true;
  }, [product, selectedOptions, currentVariant]);
  
  const totalStockForSelectedOptions = useMemo(() => {
    return currentVariant?.stock ?? 0;
  }, [currentVariant]);

  const getOptionState = useCallback((optionGroupId: number, optionId: number): 'selected' | 'available' | 'disabled' => {
    if (!product) return 'disabled';

    if (selectedOptions[optionGroupId] === optionId) {
      return 'selected';
    }

    const tempSelectedOptions: SelectedOptions = { ...selectedOptions, [optionGroupId]: optionId };
    
    const isPotentiallyAvailable = product.variants.some((variant: ProductVariant) => {
        if (!variant.option_value_ids.includes(optionId)) return false;

        for (const grpId in tempSelectedOptions) {
            const grpIdNum = Number(grpId);
            if (grpIdNum === optionGroupId) continue; 
            const selectedOptionInOtherGroup = tempSelectedOptions[grpIdNum];
            if (selectedOptionInOtherGroup !== null && !variant.option_value_ids.includes(selectedOptionInOtherGroup)) {
                return false;
            }
        }
        return variant.stock > 0;
    });

    return isPotentiallyAvailable ? 'available' : 'disabled';

  }, [product, selectedOptions]);

  const effectiveMaxQuantity = useMemo(() => {
    if (!product) return 1;
    return Math.min(
      currentVariant?.stock ?? 0,
      product.max_quantity_per_order
    );
  }, [product, currentVariant]);

  const effectiveMinQuantity = useMemo(() => {
    return product?.min_quantity_per_order ?? 1;
  }, [product]);

  return {
    product,
    selectedOptions,
    quantity,
    currentVariant,
    currentPrice,
    currentImage,
    isLoading,
    error,
    isSoldOut,
    totalStockForSelectedOptions,
    handleSelectOption,
    setQuantity: (newQuantity: number) => {
      if (!product) return;
      const cappedQuantity = Math.max(effectiveMinQuantity, Math.min(newQuantity, effectiveMaxQuantity));
      setQuantity(cappedQuantity);
    },
    getOptionState,
    effectiveMaxQuantity,
    effectiveMinQuantity,
  };
}
