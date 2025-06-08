
import type { ProductOptionGroup, ProductOption } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface OptionGroupSelectorProps {
  group: ProductOptionGroup;
  selectedValue: number | null;
  onSelectOption: (groupId: number, optionId: number) => void;
  getOptionState: (groupId: number, optionId: number) => 'selected' | 'available' | 'disabled';
}

export default function OptionGroupSelector({ group, selectedValue, onSelectOption, getOptionState }: OptionGroupSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`option-group-${group.id}`} className="text-sm font-medium text-foreground/80">
        {group.name_en}
      </Label>
      <div id={`option-group-${group.id}`} className="flex flex-wrap gap-2">
        {group.options.map((option) => {
          const state = getOptionState(group.id, option.id);
          return (
            <Button
              key={option.id}
              type="button"
              variant={state === 'selected' ? 'default' : state === 'available' ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => onSelectOption(group.id, option.id)}
              disabled={state === 'disabled'}
              className={`
                ${state === 'selected' ? 'ring-2 ring-primary ring-offset-2' : ''}
                ${state === 'disabled' ? 'opacity-50 cursor-not-allowed bg-muted hover:bg-muted text-muted-foreground' : ''}
              `}
              aria-pressed={state === 'selected'}
            >
              {option.name_en}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
