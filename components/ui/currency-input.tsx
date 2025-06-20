'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { formatCurrencyInput, parseCurrency } from '@/lib/currency';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number;
  onChange?: (value: number) => void;
  onValueChange?: (value: number, formattedValue: string) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value = 0, onChange, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    // Update display value ketika value prop berubah
    React.useEffect(() => {
      if (value === 0) {
        setDisplayValue('');
      } else {
        setDisplayValue(formatCurrencyInput(value.toString()));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Jika input kosong
      if (inputValue === '') {
        setDisplayValue('');
        onChange?.(0);
        onValueChange?.(0, '');
        return;
      }

      // Format input dan ambil nilai numerik
      const formattedValue = formatCurrencyInput(inputValue);
      const numericValue = parseCurrency(inputValue);

      setDisplayValue(formattedValue);
      onChange?.(numericValue);
      onValueChange?.(numericValue, formattedValue);
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
          Rp
        </span>
        <input
          type="text"
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          value={displayValue}
          onChange={handleChange}
          placeholder="0"
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };