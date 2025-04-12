'use client';

import * as React from 'react';
import { SliderProps } from '@radix-ui/react-slider';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface TemperatureSelectorProps {
  defaultValue: SliderProps['defaultValue'];
  onValueChange?: (value: number[]) => void;
}

export function TemperatureSelector({ defaultValue, onValueChange }: TemperatureSelectorProps) {
  const [value, setValue] = React.useState(defaultValue);

  const handleValueChange = (newValue: number[]) => {
    setValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <div className="grid gap-2 pt-2">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="text-muted-foreground hover:border-border w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm">
                {value}
              </span>
            </div>
            <Slider
              id="temperature"
              max={1}
              defaultValue={value}
              step={0.1}
              onValueChange={handleValueChange}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              aria-label="Temperature"
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-[260px] text-sm" side="left">
          Controls randomness: lowering results in less random completions. As the temperature
          approaches zero, the model will become deterministic and repetitive.
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
