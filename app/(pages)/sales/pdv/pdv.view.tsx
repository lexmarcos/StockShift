"use client";

import Image from "next/image";
import {
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { PointerEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { type BarcodeScannerDetectedCode } from "@/components/product/barcode-scanner.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ArrowLeft,
  ArrowLeftRight,
  Banknote,
  Calendar,
  CheckCircle2,
  Copy,
  CreditCard,
  Image as ImageIcon,
  Loader2,
  LucideIcon,
  Minus,
  Package,
  Plus,
  QrCode,
  ScanBarcode,
  Search,
  Share2,
  ShoppingCart,
  Smartphone,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PAYMENT_METHOD_LABELS, formatCents } from "../sales.types";
import { PdvViewProps, ProductWithStock, CartItem, SaleDrawerStep } from "./pdv.types";
import { METHODS_WITH_INSTALLMENTS, paymentMethods } from "./pdv.schema";
import type { PdvSchema } from "./pdv.schema";
import type { PaymentMethod } from "./pdv.schema";
import { FixedBottomBar } from "@/components/ui/fixed-bottom-bar";
import { BarcodeScanner } from "@/components/product/barcode-scanner";

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, LucideIcon> = {
  CASH: Banknote,
  DEBIT_CARD: CreditCard,
  CREDIT_CARD: CreditCard,
  INSTALLMENT: Calendar,
  PIX: QrCode,
  BANK_TRANSFER: ArrowLeftRight,
  OTHER: Banknote,
};

const subscribeOnlineStatus = (onStoreChange: () => void): (() => void) => {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
};

const getOnlineSnapshot = (): boolean => navigator.onLine;

const getServerOnlineSnapshot = (): boolean => true;

export const PdvView = ({
  form,
  cart,
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
  onAddProduct,
  onRemoveItem,
  onUpdateQuantity,
  onChangeBatch,
  discountAmount,
  total,
  isSubmitting,
  onSubmit,
  batchPopoverOpen,
  onBatchPopoverChange,
  meetsMinimumForPaymentLink,
  saleDrawerOpen,
  saleDrawerStep,
  saleDrawerData,
  onOpenSaleDrawer,
  onCloseSaleDrawer,
  onCheckPaymentLater,
  onGoToLinkPayment,
  onGoToInPerson,
  barcodeDrawerOpen,
  onOpenBarcodeDrawer,
  onCloseBarcodeDrawer,
  onBarcodeScanned,
  favorites,
}: PdvViewProps) => {
  const formRef = useRef<HTMLFormElement>(null);

  const selectedPayment = form.watch("paymentMethod");
  const selectedMode = form.watch("paymentMode");
  const showInstallments =
    selectedPayment && METHODS_WITH_INSTALLMENTS.includes(selectedPayment) && selectedMode !== "LINK";

  const handleBarcodeScan = useCallback(
    (detectedCodes: BarcodeScannerDetectedCode[]) => {
      if (detectedCodes && detectedCodes.length > 0) {
        const code = detectedCodes[0].rawValue;
        if (code) onBarcodeScanned(code);
      }
    },
    [onBarcodeScanned],
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 font-sans text-neutral-200">
      <div className="mx-auto w-full max-w-7xl p-4 md:px-6 lg:px-8">
        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)}>

            {/* Header */}
            <PdvHeader />

            {/* Search + Barcode Row */}
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              onOpenBarcode={onOpenBarcodeDrawer}
              isSearching={isSearching}
              searchResults={searchResults}
              onAddProduct={onAddProduct}
            />

            {/* Favorites Grid */}
            {favorites.length > 0 && !searchQuery && (
              <FavoritesGrid favorites={favorites} onAddProduct={onAddProduct} />
            )}

            {/* Cart Items Display */}
            <CartDisplay
              cart={cart}
              onRemoveItem={onRemoveItem}
              onUpdateQuantity={onUpdateQuantity}
              onChangeBatch={onChangeBatch}
              batchPopoverOpen={batchPopoverOpen}
              onBatchPopoverChange={onBatchPopoverChange}
            />

            {/* Discount Row */}
            {cart.length > 0 && (
              <DiscountRow form={form} discountAmount={discountAmount} />
            )}
          </form>

          {/* Barcode Scanner Drawer */}
          <BarcodeDrawer
            open={barcodeDrawerOpen}
            onClose={onCloseBarcodeDrawer}
            onScan={handleBarcodeScan}
          />

          {/* Sale Drawer */}
          <SaleDrawer
            open={saleDrawerOpen}
            onClose={onCloseSaleDrawer}
            step={saleDrawerStep}
            form={form}
            total={total}
            isSubmitting={isSubmitting}
            onSubmit={() => formRef.current?.requestSubmit()}
            onGoToLinkPayment={onGoToLinkPayment}
            onGoToInPerson={onGoToInPerson}
            meetsMinimumForPaymentLink={meetsMinimumForPaymentLink}
            selectedPayment={selectedPayment}
            showInstallments={showInstallments}
            saleDrawerData={saleDrawerData}
            onCheckPaymentLater={onCheckPaymentLater}
          />
        </Form>
      </div>

      {/* Fixed Bottom Bar */}
      <FixedBottomBar>
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              {cart.length} {cart.length === 1 ? "item" : "itens"}
            </span>
            <span className="text-xl font-bold font-mono text-white">
              {formatCents(total)}
            </span>
          </div>
          <Button
            type="button"
            onClick={onOpenSaleDrawer}
            disabled={cart.length === 0}
            className="h-12 px-8 rounded-[4px] bg-blue-600 text-sm font-bold uppercase tracking-wide text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <ShoppingCart className="mr-2 size-4" />
            Finalizar Venda
          </Button>
        </div>
      </FixedBottomBar>
    </div>
  );
};

/* ─── Header ─── */

function PdvHeader() {
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );

  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-white">PDV</h1>
        <div className="flex items-center gap-1.5 mt-0.5">
          {isOnline ? (
            <Wifi className="size-3 text-emerald-500" />
          ) : (
            <WifiOff className="size-3 text-rose-500" />
          )}
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Search Bar ─── */

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onOpenBarcode: () => void;
  isSearching: boolean;
  searchResults: ProductWithStock[];
  onAddProduct: (p: ProductWithStock) => void;
}

function SearchBar({
  searchQuery,
  onSearchChange,
  onOpenBarcode,
  isSearching,
  searchResults,
  onAddProduct,
}: SearchBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar produto…"
            className="h-11 pl-10 pr-10 rounded-[4px] border-neutral-800 bg-[#171717] text-sm text-white placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onOpenBarcode}
          className="size-11 rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-400 hover:text-white hover:bg-neutral-800 shrink-0 p-0"
        >
          <ScanBarcode className="size-5" />
        </Button>
      </div>

      {/* Predictive Results */}
      {searchQuery && (
        <div className="rounded-[4px] border border-neutral-800 bg-[#171717] overflow-hidden">
          {isSearching ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-blue-500" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-neutral-600 uppercase tracking-widest">
                Nenhum produto encontrado
              </p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto divide-y divide-neutral-800">
              {searchResults.map((product) => (
                <ProductSearchRow
                  key={product.id}
                  product={product}
                  onAdd={onAddProduct}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Product Search Row ─── */

interface ProductSearchRowProps {
  product: ProductWithStock;
  onAdd: (p: ProductWithStock) => void;
}

function ProductSearchRow({ product, onAdd }: ProductSearchRowProps) {
  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-800/50 transition-colors"
    >
      <div className="relative size-9 shrink-0 overflow-hidden rounded-[4px] border border-neutral-800 bg-neutral-900 flex items-center justify-center">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="36px"
            unoptimized
            className="object-cover"
          />
        ) : (
          <Package className="size-4 text-neutral-700" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{product.name}</p>
        {product.sku && (
          <p className="text-[10px] text-neutral-600">{product.sku}</p>
        )}
      </div>
      <span className="text-[10px] text-neutral-500 shrink-0">
        Estoque: {product.totalQuantity}
      </span>
    </button>
  );
}

/* ─── Favorites Grid ─── */

interface FavoritesGridProps {
  favorites: ProductWithStock[];
  onAddProduct: (p: ProductWithStock) => void;
}

function FavoritesGrid({ favorites, onAddProduct }: FavoritesGridProps) {
  return (
    <div className="mt-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mb-2">
        Produtos frequentes
      </p>
      <div className="grid grid-cols-4 gap-2">
        {favorites.slice(0, 8).map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onAddProduct(product)}
            className="flex flex-col items-center gap-1.5 rounded-[4px] border border-neutral-800 bg-[#171717] p-2 hover:border-blue-600 transition-colors"
          >
            <div className="relative size-10 overflow-hidden rounded-[4px] border border-neutral-800 bg-neutral-900 flex items-center justify-center">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="40px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <Package className="size-4 text-neutral-700" />
              )}
            </div>
            <span className="text-[10px] font-bold text-neutral-400 text-center leading-tight truncate w-full">
              {product.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Cart Display ─── */

interface CartDisplayProps {
  cart: CartItem[];
  onRemoveItem: (i: number) => void;
  onUpdateQuantity: (i: number, q: number) => void;
  onChangeBatch: (i: number, b: string) => void;
  batchPopoverOpen: number | null;
  onBatchPopoverChange: (i: number | null) => void;
}

function CartDisplay({
  cart,
  onRemoveItem,
  onUpdateQuantity,
  onChangeBatch,
  batchPopoverOpen,
  onBatchPopoverChange,
}: CartDisplayProps) {
  if (cart.length === 0) {
    return (
      <div className="mt-8 py-12 text-center">
        <ShoppingCart className="size-8 text-neutral-800 mx-auto mb-3" />
        <p className="text-xs text-neutral-600 uppercase tracking-widest">
          Carrinho vazio
        </p>
        <p className="text-[10px] text-neutral-700 mt-1">
          Busque ou escaneie um produto
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {cart.map((item, index) => (
        <CartItemCard
          key={item.id}
          item={item}
          index={index}
          onRemove={onRemoveItem}
          onUpdateQuantity={onUpdateQuantity}
          onChangeBatch={onChangeBatch}
          isBatchPopoverOpen={batchPopoverOpen === index}
          onBatchPopoverChange={onBatchPopoverChange}
        />
      ))}
    </div>
  );
}

/* ─── Cart Item Card ─── */

interface CartItemCardProps {
  item: CartItem;
  index: number;
  onRemove: (i: number) => void;
  onUpdateQuantity: (i: number, q: number) => void;
  onChangeBatch: (i: number, b: string) => void;
  isBatchPopoverOpen: boolean;
  onBatchPopoverChange: (i: number | null) => void;
}

function CartItemCard({
  item,
  index,
  onRemove,
  onUpdateQuantity,
  onChangeBatch,
  isBatchPopoverOpen,
  onBatchPopoverChange,
}: CartItemCardProps) {
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const isSwipeReady = dragOffsetX <= -72;

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    setDragStartX(event.clientX);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartX === null) return;
    const nextOffset = Math.min(event.clientX - dragStartX, 0);
    setDragOffsetX(Math.max(nextOffset, -96));
  };

  const resetSwipe = () => {
    setDragStartX(null);
    setDragOffsetX(0);
  };

  const handlePointerUp = () => {
    if (isSwipeReady) {
      onRemove(index);
      return;
    }
    resetSwipe();
  };

  return (
    <div className="relative overflow-hidden rounded-[4px] border border-neutral-800 bg-[#171717]">
      <div className="absolute bottom-px right-px top-px flex w-24 items-center justify-center rounded-r-[3px] bg-rose-600">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white">
          Excluir
        </span>
      </div>
      <div
        className="relative flex touch-pan-y items-center gap-3 rounded-[4px] bg-[#171717] p-3"
        style={{ transform: `translateX(${dragOffsetX}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={resetSwipe}
      >
        {/* Thumbnail */}
        <div className="relative size-11 shrink-0 overflow-hidden rounded-[4px] border border-neutral-800 bg-neutral-900 flex items-center justify-center">
          {item.productImageUrl ? (
            <Image
              src={item.productImageUrl}
              alt={item.productName}
              fill
              sizes="44px"
              unoptimized
              className="object-cover"
            />
          ) : (
            <ImageIcon className="size-4 text-neutral-700" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{item.productName}</p>
          <p className="text-[10px] text-neutral-600 mt-0.5">
            {formatCents(item.unitPrice)} un
            <Popover
              open={isBatchPopoverOpen}
              onOpenChange={(open) => onBatchPopoverChange(open ? index : null)}
            >
              <PopoverTrigger asChild>
                <button type="button" className="ml-2 text-neutral-500 hover:text-blue-400 inline-flex items-center gap-0.5">
                  <ArrowLeftRight className="size-3" />
                  {item.batchCode}
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-56 rounded-[4px] border-neutral-800 bg-[#171717] p-2"
                align="start"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 px-2 pb-2">
                  Lotes
                </p>
                {item.availableBatches.map((batch) => (
                  <button
                    key={batch.batchId}
                    type="button"
                    onClick={() => {
                      onChangeBatch(index, batch.batchId);
                      onBatchPopoverChange(null);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs hover:bg-neutral-800 ${
                      batch.batchId === item.batchId
                        ? "bg-blue-600/10 text-blue-400"
                        : "text-neutral-300"
                    }`}
                  >
                    <span className="font-bold">{batch.batchCode}</span>
                    <span className="text-neutral-500 ml-2">
                      {batch.quantity} | {batch.sellingPrice ? formatCents(batch.sellingPrice) : "S/ preço"}
                    </span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </p>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onUpdateQuantity(index, item.quantity - 1)}
            className="size-7 rounded-[4px] border border-neutral-800 bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700"
          >
            <Minus className="size-3" />
          </button>
          <span className="w-8 text-center text-sm font-bold font-mono text-white">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(index, item.quantity + 1)}
            className="size-7 rounded-[4px] border border-neutral-800 bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700"
          >
            <Plus className="size-3" />
          </button>
        </div>

        {/* Price */}
        <div className="flex flex-col items-end shrink-0">
          <span className="text-sm font-bold font-mono text-white">
            {formatCents(item.totalPrice)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Discount Row ─── */

interface DiscountRowProps {
  form: UseFormReturn<PdvSchema>;
  discountAmount: number;
}

function DiscountRow({ form, discountAmount }: DiscountRowProps) {
  return (
    <div className="mt-3 flex items-center justify-between rounded-[4px] border border-neutral-800 bg-[#171717] px-3 py-2">
      <span className="text-xs text-neutral-500">Desconto</span>
      <div className="flex items-center gap-2">
        <FormField
          control={form.control}
          name="discountPercentage"
          render={({ field }) => (
            <NumberInput
              value={field.value || undefined}
              onValueChange={(val) => field.onChange(val || null)}
              className="h-6 w-14 rounded-[4px] border-neutral-800 bg-neutral-900 text-xs font-mono text-white text-center"
              min={0}
              max={100}
            />
          )}
        />
        <span className="text-xs text-neutral-600">%</span>
        {discountAmount > 0 && (
          <span className="text-xs font-mono text-rose-400">-{formatCents(discountAmount)}</span>
        )}
      </div>
    </div>
  );
}

/* ─── Barcode Drawer ─── */

interface BarcodeDrawerProps {
  open: boolean;
  onClose: () => void;
  onScan: (codes: BarcodeScannerDetectedCode[]) => void;
}

function BarcodeDrawer({ open, onClose, onScan }: BarcodeDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} direction="bottom">
      <DrawerContent className="bg-[#171717] border-neutral-800 max-h-[70vh]">
        <DrawerHeader className="border-b border-neutral-800 pb-3">
          <DrawerTitle className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
            <ScanBarcode className="size-4 text-blue-500" />
            Scanner de Código
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 pt-4">
          <div className="relative overflow-hidden rounded-[4px] border border-neutral-800 bg-[#0A0A0A]">
            <BarcodeScanner
              onScan={onScan}
              onError={(err: unknown) => console.error("Camera error:", err)}
              styles={{ container: { width: "100%", height: "280px" }, video: { objectFit: "cover" } }}
              components={{ finder: true }}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full mt-3 rounded-[4px] border-neutral-800 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            Fechar Scanner
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* ─── Sale Drawer ─── */

interface SaleDrawerProps {
  open: boolean;
  onClose: () => void;
  step: SaleDrawerStep;
  form: UseFormReturn<PdvSchema>;
  total: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  onGoToLinkPayment: () => void;
  onGoToInPerson: () => void;
  meetsMinimumForPaymentLink: boolean;
  selectedPayment: PaymentMethod;
  showInstallments: boolean;
  saleDrawerData: { saleCode: string; total: number; paymentLink: string } | null;
  onCheckPaymentLater: () => void;
}

function SaleDrawer({
  open,
  onClose,
  step,
  form,
  total,
  isSubmitting,
  onSubmit,
  onGoToLinkPayment,
  onGoToInPerson,
  meetsMinimumForPaymentLink,
  selectedPayment,
  showInstallments,
  saleDrawerData,
  onCheckPaymentLater,
}: SaleDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} direction="bottom">
      <DrawerContent className="bg-[#171717] border-neutral-800 max-h-[85vh]">
        <DrawerHeader className="border-b border-neutral-800 pb-3">
          <DrawerTitle className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
            {step !== "sale-type" && (
              <button
                type="button"
                onClick={step === "link-payment" || step === "in-person" ? () => {
                  form.setValue("paymentMode", "DIRECT");
                  form.setValue("paymentMethod", "CASH");
                  onClose();
                  setTimeout(() => {
                    const ev = new CustomEvent("reopen-sale-type");
                    window.dispatchEvent(ev);
                  }, 100);
                } : undefined}
                className="size-6 rounded-[4px] text-neutral-400 hover:text-white"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}
            {step === "sale-type" && "Tipo de Venda"}
            {step === "link-payment" && "Link de Pagamento"}
            {step === "in-person" && "Venda Presencial"}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 pt-4 overflow-y-auto">
          {step === "sale-type" && (
            <SaleTypeStep
              onGoToLinkPayment={onGoToLinkPayment}
              onGoToInPerson={onGoToInPerson}
              meetsMinimumForPaymentLink={meetsMinimumForPaymentLink}
              total={total}
            />
          )}
          {step === "link-payment" && (
            <LinkPaymentStep
              saleDrawerData={saleDrawerData}
              onCheckPaymentLater={onCheckPaymentLater}
            />
          )}
          {step === "in-person" && (
            <InPersonStep
              form={form}
              total={total}
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
              selectedPayment={selectedPayment}
              showInstallments={showInstallments}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* ─── Sale Type Step ─── */

function SaleTypeStep({
  onGoToLinkPayment,
  onGoToInPerson,
  meetsMinimumForPaymentLink,
  total,
}: {
  onGoToLinkPayment: () => void;
  onGoToInPerson: () => void;
  meetsMinimumForPaymentLink: boolean;
  total: number;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 p-3 flex items-center justify-between">
        <span className="text-xs text-neutral-500">Total</span>
        <span className="text-lg font-bold font-mono text-white">{formatCents(total)}</span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
        Como será a venda?
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onGoToInPerson}
          className="flex flex-col items-center gap-2 rounded-[4px] border border-neutral-800 bg-neutral-900 p-5 hover:border-blue-600 transition-colors"
        >
          <Smartphone className="size-6 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wide">Presencial</span>
          <span className="text-[10px] text-neutral-500 text-center">Cliente presente</span>
        </button>
        <button
          type="button"
          disabled={!meetsMinimumForPaymentLink}
          onClick={onGoToLinkPayment}
          className="flex flex-col items-center gap-2 rounded-[4px] border border-neutral-800 bg-neutral-900 p-5 hover:border-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <QrCode className="size-6 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wide">Link</span>
          <span className="text-[10px] text-neutral-500 text-center">Enviar ao cliente</span>
        </button>
      </div>
      {!meetsMinimumForPaymentLink && (
        <p className="text-[10px] text-amber-500">
          Mínimo R$ 1,00 para pagamento via link
        </p>
      )}
    </div>
  );
}

/* ─── Link Payment Step ─── */

function LinkPaymentStep({
  saleDrawerData,
  onCheckPaymentLater,
}: {
  saleDrawerData: { saleCode: string; total: number; paymentLink: string } | null;
  onCheckPaymentLater: () => void;
}) {
  const handleCopy = () => {
    if (!saleDrawerData) return;
    navigator.clipboard.writeText(saleDrawerData.paymentLink);
    toast.success("Link copiado!");
  };

  const handleWhatsApp = () => {
    if (!saleDrawerData) return;
    const msg = encodeURIComponent(
      `Pagamento StockShift\n${saleDrawerData.saleCode} — ${formatCents(saleDrawerData.total)}\n${saleDrawerData.paymentLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const handleShare = () => {
    if (!saleDrawerData || !navigator.share) return;
    navigator.share({
      title: `Pagamento StockShift - ${saleDrawerData.saleCode}`,
      text: `Pagamento ${formatCents(saleDrawerData.total)}`,
      url: saleDrawerData.paymentLink,
    });
  };

  if (!saleDrawerData) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="size-6 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-xs text-neutral-500">Gerando link de pagamento…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">{saleDrawerData.saleCode}</p>
            <p className="text-lg font-bold font-mono text-blue-400">{formatCents(saleDrawerData.total)}</p>
          </div>
          <CheckCircle2 className="size-5 text-emerald-500" />
        </div>
      </div>

      <div className="rounded-[4px] border border-blue-600/40 bg-blue-600/10 p-4">
        <div className="mb-3 flex items-center justify-center gap-2 border-b border-blue-500/20 pb-3">
          <Loader2 className="size-4 animate-spin text-blue-400" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">
            Aguardando pagamento
          </p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-white">Link gerado!</p>
          <p className="mt-1 text-xs text-neutral-400">
            Escolha abaixo como mandar o link ao cliente.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          onClick={handleCopy}
          className="h-10 rounded-[4px] bg-neutral-800 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-700"
        >
          <Copy className="mr-1.5 size-3.5" />
          Copiar
        </Button>
        <Button
          type="button"
          onClick={handleWhatsApp}
          className="h-10 rounded-[4px] bg-emerald-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700"
        >
          WhatsApp
        </Button>
        <Button
          type="button"
          onClick={handleShare}
          aria-label="Compartilhar link de pagamento"
          className="h-10 rounded-[4px] bg-neutral-800 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-700"
        >
          <Share2 className="size-3.5" />
        </Button>
      </div>

      <Button
        type="button"
        onClick={onCheckPaymentLater}
        className="h-11 w-full rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
      >
        Conferir pagamento depois
      </Button>
    </div>
  );
}

/* ─── In-Person Step ─── */

function InPersonStep({
  form,
  total,
  isSubmitting,
  onSubmit,
  selectedPayment,
  showInstallments,
}: {
  form: UseFormReturn<PdvSchema>;
  total: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  selectedPayment: PaymentMethod;
  showInstallments: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 p-3 flex items-center justify-between">
        <span className="text-xs text-neutral-500">Total</span>
        <span className="text-lg font-bold font-mono text-white">{formatCents(total)}</span>
      </div>

      {/* Payment Methods */}
      <FormField
        control={form.control}
        name="paymentMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3 block">
              Forma de Pagamento
            </FormLabel>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((method) => {
                const Icon = PAYMENT_METHOD_ICONS[method];
                const isSelected = field.value === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => field.onChange(method)}
                    className={`flex flex-col items-center gap-1.5 rounded-[4px] border p-3 transition-colors ${
                      isSelected
                        ? "border-blue-600 bg-blue-600/10 text-blue-400"
                        : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <Icon className="size-5" />
                    <span className="text-[9px] font-bold uppercase tracking-wide leading-tight text-center">
                      {PAYMENT_METHOD_LABELS[method]}
                    </span>
                  </button>
                );
              })}
            </div>
            <FormControl><input type="hidden" /></FormControl>
            <FormMessage className="text-xs text-rose-500" />
          </FormItem>
        )}
      />

      {/* Installments */}
      {showInstallments && (
        <FormField
          control={form.control}
          name="installments"
          render={({ field }) => {
            const installments = field.value || 0;
            const installmentValue = installments > 0 ? Math.ceil(total / installments) : 0;
            return (
              <FormItem>
                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Parcelas
                </FormLabel>
                <FormControl>
                  <NumberInput
                    value={field.value || undefined}
                    onValueChange={(val) => field.onChange(val || null)}
                    className="h-10 w-full rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
                    placeholder="0"
                    min={1}
                  />
                </FormControl>
                {installments > 0 && total > 0 && (
                  <div className="rounded-[4px] border border-neutral-800 bg-neutral-900/50 px-3 py-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      {installments}x de
                    </span>
                    <span className="text-sm font-bold font-mono text-blue-400">
                      {formatCents(installmentValue)}
                    </span>
                  </div>
                )}
                <FormMessage className="text-xs text-rose-500" />
              </FormItem>
            );
          }}
        />
      )}

      {/* Submit */}
      <Button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting || !selectedPayment}
        className="w-full h-12 rounded-[4px] bg-blue-600 text-sm font-bold uppercase tracking-wide text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Registrando…
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 size-4" />
            Realizar Venda
          </>
        )}
      </Button>
    </div>
  );
}
