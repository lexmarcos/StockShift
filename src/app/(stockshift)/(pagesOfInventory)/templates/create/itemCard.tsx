import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

interface IItemCardsProps {
  checkIsSelected: (value: string) => boolean;
  selectItem: (value: string) => void;
  value: string;
  title: string;
  description: string;
  icon: ReactNode;
}

export default function ItemCards({
  checkIsSelected,
  selectItem,
  icon,
  title,
  description,
  value,
}: IItemCardsProps) {
  return (
    <Card
      className={cn([
        "p-4 relative cursor-pointer select-none",
        checkIsSelected(value) && "outline outline-blue-400",
      ])}
      onClick={() => selectItem(value)}
    >
      {checkIsSelected(value) && (
        <div className="absolute -top-3 -right-3 border border-2 border-blue-400 bg-blue-400 rounded-full">
          <CheckCircle2 size={27} strokeWidth={2.5} />
        </div>
      )}
      <div className="flex items-start">
        {icon} <h2 className="text-xl font-bold mb-2 ml-2">{title}</h2>
      </div>
      <p className="text-sm text-gray-400">{description}</p>
    </Card>
  );
}
