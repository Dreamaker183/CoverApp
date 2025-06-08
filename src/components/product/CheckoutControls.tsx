import { Button } from '@/components/ui/button';
import { ShoppingCartIcon } from 'lucide-react';

interface CheckoutControlsProps {
  price: number | null;
  isSoldOut: boolean;
  disabled: boolean; // True if options not fully selected or other disabling conditions
  onAddToCart: () => void;
}

export default function CheckoutControls({ price, isSoldOut, disabled, onAddToCart }: CheckoutControlsProps) {
  const buttonText = isSoldOut ? "Sold Out" : "Add to Cart";
  const finalDisabled = disabled || isSoldOut;

  return (
    <div className="space-y-4 pt-4">
      <div className="text-3xl font-bold font-headline text-primary">
        {price !== null ? `$${price.toFixed(2)}` : 'Select options to see price'}
      </div>
      <Button
        size="lg"
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        disabled={finalDisabled}
        onClick={onAddToCart}
      >
        <ShoppingCartIcon className="mr-2 h-5 w-5" />
        {buttonText}
      </Button>
    </div>
  );
}
