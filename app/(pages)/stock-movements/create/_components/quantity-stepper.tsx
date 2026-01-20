"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
}

export const QuantityStepper = ({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
}: QuantityStepperProps) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      onChange(Math.min(Math.max(newValue, min), max));
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className="h-14 w-14 rounded-[4px] border-neutral-800 bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-30"
        >
          <Minus className="h-5 w-5" />
        </Button>

        <Input
          type="number"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className={cn(
            "h-14 w-24 rounded-[4px] border-neutral-800 bg-neutral-900 text-center text-2xl font-mono font-bold text-white",
            "focus:border-blue-600 focus:ring-0",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          )}
          min={min}
          max={max}
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className="h-14 w-14 rounded-[4px] border-neutral-800 bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-30"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <span className="text-xs text-neutral-500">
        Máx: {max}
      </span>
    </div>
  );
};
