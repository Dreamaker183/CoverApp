
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
        if (productResponse.data) {
          setProduct(productResponse.data);
          // Initialize selectedOptions with the first available option for each group
          const initialSelectedOptions: SelectedOptions = {};
          if (productResponse.data.option_groups) {
            productResponse.data.option_groups.forEach(group => {
              if (group.options && group.options.length > 0) {
                 // Try to find a default selection that forms a valid variant
                let foundInitialOption = false;
                for (const opt of group.options) {
                  const tempSelection = { ...initialSelectedOptions, [group.id]: opt.id };
                  if (productResponse.data.variants.some(v => 
                      v.option_value_ids.includes(opt.id) &&
                      Object.values(tempSelection).every(val => val === null || v.option_value_ids.includes(val))
                  )) {
                    initialSelectedOptions[group.id] = opt.id;
                    foundInitialOption = true;
                    break;
                  }
                }
                if (!foundInitialOption) {
                    initialSelectedOptions[group.id] = null; // Or group.options[0].id if forcing a selection
                }

              } else {
                initialSelectedOptions[group.id] = null;
              }
            });
          }
          setSelectedOptions(initialSelectedOptions);
          setQuantity(productResponse.data.min_quantity_per_order || 1);
        } else {
          setError(productResponse.msg || 'No product data found.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching product data.');
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
    if (selectedIds.length !== product.option_groups.length) return null; // All groups must have a selection

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
        setQuantity(prevQuantity => Math.max(product.min_quantity_per_order, Math.min(prevQuantity, variant.stock, product.max_quantity_per_order)));
      } else {
         setQuantity(product.min_quantity_per_order);
      }
    }
  }, [product, selectedOptions, findVariant]);

  const handleSelectOption = useCallback((optionGroupId: number, optionId: number) => {
    setSelectedOptions(prev => {
      const newSelectedOptions = { ...prev, [optionGroupId]: optionId };
      // Potentially reset dependent options if this logic is desired, or smart-select next available
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
    if (!product) return true; // No product data
    if (Object.values(selectedOptions).some(val => val === null)) return false; // Not all options selected, so not "sold out" yet
    return currentVariant ? currentVariant.stock === 0 : true; // True if variant resolved and stock is 0, or if no variant for selection
  }, [product, selectedOptions, currentVariant]);
  
  const totalStockForSelectedOptions = useMemo(() => {
    return currentVariant?.stock ?? 0;
  }, [currentVariant]);

  const getOptionState = useCallback((optionGroupId: number, optionId: number): 'selected' | 'available' | 'disabled' => {
    if (!product) return 'disabled';

    if (selectedOptions[optionGroupId] === optionId) {
      return 'selected';
    }

    // Check if selecting this option (along with other *currently selected* options) would form any valid variant with stock
    const tempSelectedOptions = { ...selectedOptions, [optionGroupId]: optionId };
    
    // Create a list of option IDs that must be present, based on current selections and this test option
    const requiredOptionIds = product.option_groups
      .map(group => tempSelectedOptions[group.id])
      .filter(id => id !== null) as number[];
      
    const isPotentiallyAvailable = product.variants.some(variant => {
        // Does this variant contain the option we are testing?
        if (!variant.option_value_ids.includes(optionId)) return false;

        // For other groups, does this variant match what's already selected?
        for (const groupId in tempSelectedOptions) {
            if (Number(groupId) === optionGroupId) continue; // Skip the group we are testing
            const selectedOptionInOtherGroup = tempSelectedOptions[groupId];
            if (selectedOptionInOtherGroup !== null && !variant.option_value_ids.includes(selectedOptionInOtherGroup)) {
                return false; // This variant doesn't match selection in another group
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
