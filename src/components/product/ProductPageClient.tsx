'use client';

import { useProductViewModel } from '@/viewmodels/useProductViewModel';
import ProductImageDisplay from './ProductImageDisplay';
import OptionGroupSelector from './OptionGroupSelector';
import QuantitySelector from './QuantitySelector';
import CheckoutControls from './CheckoutControls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangleIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function ProductPageClient() {
  const {
    product,
    selectedOptions,
    quantity,
    currentPrice,
    currentImage,
    isLoading,
    error,
    isSoldOut,
    handleSelectOption,
    setQuantity,
    getOptionState,
    effectiveMaxQuantity,
    effectiveMinQuantity,
    currentVariant,
  } = useProductViewModel();

  const { toast } = useToast();

  const handleAddToCart = () => {
    if (currentVariant && product) {
      toast({
        title: "Added to Cart!",
        description: `${quantity} x ${currentVariant.name_en} added. Total: $${(currentPrice || 0).toFixed(2)}`,
        variant: "default",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg font-semibold">Loading Product...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Alert variant="destructive" className="mt-8">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error Loading Product</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
         <Alert variant="destructive" className="mt-8">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Product Not Found</AlertTitle>
          <AlertDescription>The product could not be loaded. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const allOptionsSelected = product.option_groups.every(group => selectedOptions[group.id] !== null && selectedOptions[group.id] !== undefined);


  return (
    <div className="container mx-auto max-w-5xl p-4 md:p-8">
      <Card className="shadow-xl">
        <CardContent className="p-0 md:p-6 grid md:grid-cols-2 gap-6 md:gap-8">
          <div className="md:sticky md:top-8 self-start">
            <ProductImageDisplay imageUrl={currentImage} productName={product.name_en} />
          </div>
          
          <div className="p-6 md:p-0 flex flex-col space-y-6">
            <CardHeader className="p-0">
              <CardTitle className="text-3xl md:text-4xl font-headline tracking-tight">{product.name_en}</CardTitle>
              {product.description_en && (
                <CardDescription className="pt-2 text-base text-muted-foreground">{product.description_en}</CardDescription>
              )}
            </CardHeader>

            <form className="space-y-6">
              {product.option_groups.map((group) => (
                <OptionGroupSelector
                  key={group.id}
                  group={group}
                  selectedValue={selectedOptions[group.id] || null}
                  onSelectOption={handleSelectOption}
                  getOptionState={getOptionState}
                />
              ))}
              
              <QuantitySelector
                quantity={quantity}
                setQuantity={setQuantity}
                min={effectiveMinQuantity}
                max={effectiveMaxQuantity}
                disabled={!allOptionsSelected || (currentVariant?.stock === 0 && isSoldOut)}
              />
            </form>
            
            <CheckoutControls
              price={currentPrice}
              isSoldOut={isSoldOut && allOptionsSelected}
              disabled={!allOptionsSelected || (currentVariant?.stock === 0 && isSoldOut)}
              onAddToCart={handleAddToCart}
            />
             {!allOptionsSelected && (
                <p className="text-sm text-center text-muted-foreground pt-2">Please select all options to see availability and add to cart.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
