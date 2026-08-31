import { NavArrowDown } from "iconoir-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";

export type DropdownSelectOption<Value extends string> = {
  value: Value;
  label: string;
  disabled?: boolean;
};

/**
 * Native `<select>` yerine kullanılan, klavye ve ekran okuyucu desteğini
 * Radix'ten alan tek-seçimli açılır liste. Seçim anında kapandığı için form
 * alanı gibi davranır; seçenekler ise ürünün kendi görsel diliyle çizilir.
 */
export function DropdownSelect<Value extends string>({
  id,
  label,
  value,
  options,
  onValueChange,
  className,
}: {
  id?: string;
  label: string;
  value: Value;
  options: readonly DropdownSelectOption<Value>[];
  onValueChange: (value: Value) => void;
  className?: string;
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id={id}
          type="button"
          aria-label={label}
          className={cn("dropdown-select-trigger", className)}
        >
          <span>{selected?.label}</span>
          <NavArrowDown width={17} height={17} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="dropdown-select-content">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onValueChange(next as Value)}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
