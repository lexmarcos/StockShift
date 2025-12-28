"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

export interface CustomAttribute {
  key: string;
  value: string;
}

interface CustomAttributesBuilderProps {
  attributes: CustomAttribute[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: "key" | "value", value: string) => void;
}

export const CustomAttributesBuilder = ({
  attributes,
  onAdd,
  onRemove,
  onUpdate,
}: CustomAttributesBuilderProps) => {
  return (
    <div className="space-y-3">
      {attributes.map((attr, index) => (
        <div
          key={index}
          className="flex gap-2 items-end animate-in slide-in-from-left duration-300"
        >
          <div className="flex-1 space-y-1.5">
            <Label htmlFor={`attr-key-${index}`} className="text-xs">
              Nome
            </Label>
            <Input
              id={`attr-key-${index}`}
              placeholder="Ex: cor, material"
              value={attr.key}
              onChange={(e) => onUpdate(index, "key", e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor={`attr-value-${index}`} className="text-xs">
              Valor
            </Label>
            <Input
              id={`attr-value-${index}`}
              placeholder="Ex: azul, plástico"
              value={attr.value}
              onChange={(e) => onUpdate(index, "value", e.target.value)}
              className="h-9"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors mb-0.5"
            aria-label="Remover atributo"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="w-full mt-2"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Atributo
      </Button>
    </div>
  );
};
