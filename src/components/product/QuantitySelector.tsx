
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MinusIcon, PlusIcon } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  setQuantity: (quantity: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
}

export default function QuantitySelector({ quantity, setQuantity, min, max, disabled = false }: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (quantity > min) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      setQuantity(quantity + 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) {
      value = min;
    }
    setQuantity(Math.max(min, Math.min(value, max)));
  };


  return (
    <div className="space-y-2">
      <Label htmlFor="quantity" className="text-sm font-medium text-foreground/80">Quantity</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={disabled || quantity <= min}
          aria-label="Decrease quantity"
        >
          <MinusIcon className="h-4 w-4" />
        </Button>
        <Input
          id="quantity"
          type="number"
          value={quantity}
          onChange={handleChange}
          onBlur={(e) => { // Ensure value is capped on blur if manually typed
             let value = parseInt(e.target.value, 10);
             if (isNaN(value) || value < min) value = min;
             if (value > max) value = max;
             setQuantity(value);
          }}
          min={min}
          max={max}
          className="w-16 text-center"
          disabled={disabled}
          aria-live="polite"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={disabled || quantity >= max}
          aria-label="Increase quantity"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
       {max === 0 && !disabled && <p className="text-sm text-destructive">Out of stock for selected options.</p>}
       {max > 0 && <p className="text-xs text-muted-foreground">Available: {max}</p>}
    </div>
  );
}
