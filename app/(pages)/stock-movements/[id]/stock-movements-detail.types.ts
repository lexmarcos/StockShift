import type { ProductThumbnails } from "@/lib/thumbnails";
import type { StockMovement, StockMovementItem } from "../stock-movements.types";

export type { StockMovement };

export interface StockMovementDetailResponse {
  success: boolean;
  message: string | null;
  data: StockMovement;
}

export interface ProductImageResponse {
  success: boolean;
  data: { id: string; imageUrl: string | null; thumbnails?: ProductThumbnails };
}

export type StockMovementItemWithImage = StockMovementItem & {
  productImageUrl: string | null;
};

export interface TypeBadgeView {
  label: string;
  icon: "in" | "out";
  borderClass: string;
  bgClass: string;
  textClass: string;
  accentClass: string;
  description: string;
}

export interface StockMovementDetailViewProps {
  movement: StockMovement | null;
  items: StockMovementItemWithImage[];
  isLoading: boolean;
  error: Error | null;
  typeBadge: TypeBadgeView | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  totalQuantity: string;
  itemCount: number;
  hasReference: boolean;
}
