"use client";

import * as React from "react";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CommandList } from "cmdk";
import { Badge } from "../ui/badge";

export interface IComboboxItem {
  value: string;
  label: string;
}

interface IMultipleComboboxProps {
  items: IComboboxItem[];
  placeholder?: string;
  value: string[];
  onChange: (value: string[]) => void;
}

export function MultipleCombobox({ items, placeholder, value, onChange }: IMultipleComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectOrUnselectItem = (item: IComboboxItem) => {
    if (value.some((i) => i === item.value)) {
      onChange(value.filter((i) => i !== item.value));
    } else {
      onChange([...value, item.value]);
    }
  };

  const getItemLabel = (value: string) => {
    return items.find((item) => item.value === value)?.label;
  };

  const renderSelectedItems = () => {
    return (
      <div className="flex gap-x-2">
        {value.map((item) => (
          <Badge key={item}>{getItemLabel(item)}</Badge>
        ))}
      </div>
    );
  };

  const renderPlaceholderOrSelectedItems = () => {
    if (value.length === 0) {
      return <span className="text-muted-foreground text-sm">{placeholder}</span>;
    }

    return renderSelectedItems();
  };

  return (
    <div className="flex flex-col">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex items-center justify-between"
          >
            {renderPlaceholderOrSelectedItems()}
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Command>
            <CommandInput placeholder="Search item..." className="h-9" />
            <CommandList>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={() => {
                    selectOrUnselectItem(item);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.some((arrayItem) => arrayItem === item.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
