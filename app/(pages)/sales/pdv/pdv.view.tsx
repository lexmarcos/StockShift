"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  ArrowLeft,
  ArrowLeftRight,
  Banknote,
  Calendar,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Link2,
  Loader2,
  Package,
  QrCode,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PAYMENT_METHOD_LABELS, formatCents } from "../sales.types";
import { PdvViewProps } from "./pdv.types";
import { METHODS_WITH_INSTALLMENTS, paymentMethods } from "./pdv.schema";
import type { PaymentMethod } from "./pdv.schema";

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, React.ElementType> = {
  CASH: Banknote,
  DEBIT_CARD: CreditCard,
  CREDIT_CARD: CreditCard,
  INSTALLMENT: Calendar,
  PIX: QrCode,
  BANK_TRANSFER: ArrowLeftRight,
  OTHER: Wallet,
};


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
  subtotal,
  discountAmount,
  total,
  isSubmitting,
  onSubmit,
  warehouses,
  isLoadingWarehouses,
  batchPopoverOpen,
  onBatchPopoverChange,
  isMobile,
  meetsMinimumForPaymentLink,
  shareDialogOpen,
  shareDialogData,
  onShareDialogClose,
}: PdvViewProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartStep, setCartStep] = useState<"cart" | "sale-type" | "checkout">("cart");

  useEffect(() => {
    if (cart.length === 0) {
      setCartStep("cart");
      setDrawerOpen(false);
    }
  }, [cart.length]);

  const selectedPayment = form.watch("paymentMethod");
  const selectedWarehouseId = form.watch("warehouseId");
  const selectedMode = form.watch("paymentMode");
  const showInstallments =
    selectedPayment && METHODS_WITH_INSTALLMENTS.includes(selectedPayment) && selectedMode !== "LINK";

  const goSaleType = () => setCartStep("sale-type");
  const goCheckout = () => setCartStep("checkout");
  const goCart = () => setCartStep("cart");

  const cartItems = (
    <div className="space-y-2 max-h-[400px] overflow-y-auto">
      {cart.length === 0 ? (
        <div className="py-8 text-center">
          <ShoppingCart className="h-8 w-8 text-neutral-700 mx-auto mb-2" />
          <p className="text-xs text-neutral-600 uppercase tracking-widest">
            Carrinho vazio
          </p>
        </div>
      ) : (
        cart.map((item, index) => (
          <div
            key={item.id}
            className="rounded-[4px] border border-neutral-800 bg-neutral-900 p-3"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">
                  {item.productName}
                </p>
                <p className="text-[10px] text-neutral-600 mt-0.5">
                  Lote: {item.batchCode}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Popover
                  open={batchPopoverOpen === index}
                  onOpenChange={(open) =>
                    onBatchPopoverChange(open ? index : null)
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-[4px] text-neutral-500 hover:text-blue-400"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-64 rounded-[4px] border-neutral-800 bg-[#171717] p-2"
                    align="end"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 px-2 pb-2">
                      Selecionar Lote
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
                          Qtd: {batch.quantity} |{" "}
                          {batch.sellingPrice
                            ? formatCents(batch.sellingPrice)
                            : "S/ preço"}
                        </span>
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveItem(index)}
                  className="h-7 w-7 rounded-[4px] text-neutral-500 hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <NumberInput
                  value={item.quantity}
                  onValueChange={(val) => onUpdateQuantity(index, val || 0)}
                  className="h-7 w-16 rounded-[4px] border border-neutral-800 bg-neutral-900 text-xs font-mono text-white text-center"
                  min={0}
                />
                <span className="text-[10px] text-neutral-600">
                  x {formatCents(item.unitPrice)}
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-white">
                {formatCents(item.totalPrice)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const cartTotals = cart.length > 0 && (
    <div className="space-y-2 pt-3 border-t border-neutral-800">
      <div className="flex justify-between text-xs text-neutral-500">
        <span>Subtotal</span>
        <span className="font-mono">{formatCents(subtotal)}</span>
      </div>
      <FormField
        control={form.control}
        name="discountPercentage"
        render={({ field }) => (
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Desconto</span>
            <div className="flex items-center gap-2">
              <NumberInput
                value={field.value || undefined}
                onValueChange={(val) => field.onChange(val || null)}
                className="h-6 w-14 rounded-[4px] border border-neutral-800 bg-neutral-900 text-xs font-mono text-white text-center"
                min={0}
                max={100}
              />
              <span className="text-xs text-neutral-600">%</span>
            </div>
          </div>
        )}
      />
      {discountAmount > 0 && (
        <div className="flex justify-between text-xs text-rose-400">
          <span>Desconto</span>
          <span className="font-mono">-{formatCents(discountAmount)}</span>
        </div>
      )}
      <div className="flex justify-between pt-2 border-t border-neutral-800">
        <span className="text-sm font-bold text-white">Total</span>
        <span className="text-lg font-bold font-mono text-white">
          {formatCents(total)}
        </span>
      </div>
    </div>
  );

  const paymentCards = (
    <FormField
      control={form.control}
      name="paymentMethod"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3 block">
            Forma de Pagamento
          </FormLabel>
          <div className="grid grid-cols-3 gap-2">
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
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wide leading-tight text-center">
                    {PAYMENT_METHOD_LABELS[method]}
                  </span>
                </button>
              );
            })}
          </div>
          <FormControl>
            <input type="hidden" />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );

  const installmentsField = showInstallments && (
    <FormField
      control={form.control}
      name="installments"
      render={({ field }) => {
        const installments = field.value || 0;
        const installmentValue =
          installments > 0 ? Math.ceil(total / installments) : 0;
        return (
          <FormItem>
            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Número de Parcelas
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
  );

  const linkPaymentInfo = (
    <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 p-3">
      <p className="text-xs text-neutral-400">
        A forma de pagamento será escolhida pelo cliente no checkout.
      </p>
    </div>
  );

  const saleTypeStep = (
    <div className="space-y-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        Como será a venda?
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            form.setValue("paymentMode", "DIRECT");
            goCheckout();
          }}
          className="flex flex-col items-center gap-2 rounded-[4px] border border-neutral-800 bg-neutral-900 p-4 hover:border-blue-600 transition-colors"
        >
          <Smartphone className="h-5 w-5 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wide">Presencial</span>
          <span className="text-[10px] text-neutral-500 text-center">Cliente presente</span>
        </button>
        <button
          type="button"
          disabled={!meetsMinimumForPaymentLink}
          onClick={() => {
            form.setValue("paymentMode", "LINK");
            form.setValue("paymentMethod", "CREDIT_CARD");
            goCheckout();
          }}
          className="flex flex-col items-center gap-2 rounded-[4px] border border-neutral-800 bg-neutral-900 p-4 hover:border-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Link2 className="h-5 w-5 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wide">Link</span>
          <span className="text-[10px] text-neutral-500 text-center">Enviar ao cliente</span>
        </button>
      </div>
      {!meetsMinimumForPaymentLink && (
        <p className="text-[10px] text-amber-500">
          Mínimo R$ 1,00 para pagamento via link
        </p>
      )}
      <Button
        variant="outline"
        type="button"
        onClick={goCart}
        className="w-full h-10 rounded-[4px] border-neutral-700 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white"
      >
        <ArrowLeft className="mr-2 h-3.5 w-3.5" />
        Voltar ao Carrinho
      </Button>
    </div>
  );

  const shareDialog = shareDialogData && (
    <Dialog open={shareDialogOpen} onOpenChange={(open) => !open && onShareDialogClose()}>
      <DialogContent className="bg-[#171717] border-neutral-800 rounded-[4px] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Link de pagamento gerado!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 p-3">
            <p className="text-sm font-bold text-white">{shareDialogData.saleCode}</p>
            <p className="text-lg font-bold font-mono text-blue-400">{formatCents(shareDialogData.total)}</p>
          </div>
          <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Link</p>
            <p className="text-xs text-neutral-300 break-all">{shareDialogData.paymentLink}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(shareDialogData.paymentLink);
                toast.success("Link copiado!");
              }}
              className="h-10 rounded-[4px] bg-neutral-800 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-700"
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copiar
            </Button>
            <Button
              type="button"
              onClick={() => {
                const msg = encodeURIComponent(
                  `Pagamento StockShift\n${shareDialogData.saleCode} — ${formatCents(shareDialogData.total)}\n${shareDialogData.paymentLink}`
                );
                window.open(`https://wa.me/?text=${msg}`, "_blank");
              }}
              className="h-10 rounded-[4px] bg-emerald-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-700"
            >
              WhatsApp
            </Button>
            <Button
              type="button"
              onClick={() => {
                const subject = encodeURIComponent(`Pagamento StockShift - ${shareDialogData.saleCode}`);
                const body = encodeURIComponent(shareDialogData.paymentLink);
                window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
              }}
              className="h-10 rounded-[4px] bg-neutral-800 text-xs font-bold uppercase tracking-wide text-white hover:bg-neutral-700"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Email
            </Button>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
            <span className="text-xs text-neutral-400">Aguardando pagamento...</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const checkoutActions = (
    <div className="space-y-2 pt-3">
      <Button
        type="button"
        onClick={() => formRef.current?.requestSubmit()}
        disabled={isSubmitting || cart.length === 0 || !selectedPayment}
        className="w-full h-11 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            Registrando...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
            Realizar Venda
          </>
        )}
      </Button>
      <Button
        variant="outline"
        type="button"
        onClick={goSaleType}
        className="w-full h-10 rounded-[4px] border-neutral-700 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white"
      >
        <ArrowLeft className="mr-2 h-3.5 w-3.5" />
        Voltar
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-28 lg:pb-8 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl py-8 px-4 md:px-6 lg:px-8">
        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column - Product Catalog */}
              <div className="space-y-6 lg:col-span-2">
                <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                  <CardHeader className="border-b border-neutral-800 pb-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
                        Catálogo de Produtos
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-5">
                    {/* Warehouse + Search Row */}
                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                      <FormField
                        control={form.control}
                        name="warehouseId"
                        render={({ field }) => (
                          <FormItem className="w-full md:w-56">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              Armazém
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10 w-full rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0">
                                  <SelectValue
                                    placeholder={
                                      isLoadingWarehouses
                                        ? "Carregando..."
                                        : "Selecione..."
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-[4px] border-neutral-800 bg-[#171717]">
                                {warehouses.map((w) => (
                                  <SelectItem key={w.id} value={w.id}>
                                    {w.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />
                      <div className="w-full md:flex-1">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 block">
                          Buscar Produto
                        </FormLabel>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                          <Input
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Nome, SKU ou código de barras..."
                            disabled={!selectedWarehouseId}
                            className="h-10 pl-10 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm text-white placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0"
                            autoFocus
                          />
                        </div>
                      </div>
                    </div>

                    {/* Product Grid */}
                    <div className="min-h-[300px]">
                      {!selectedWarehouseId ? (
                        <EmptyState
                          icon={Package}
                          title="Selecione um armazém"
                          description="Escolha o armazém acima para buscar produtos"
                        />
                      ) : isSearching ? (
                        <div className="flex items-center justify-center py-20">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                      ) : searchQuery && searchResults.length === 0 ? (
                        <EmptyState
                          icon={Search}
                          title="Nenhum produto encontrado"
                          description="Tente buscar por outro nome ou código"
                        />
                      ) : searchQuery ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                          {searchResults.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => onAddProduct(product)}
                              className="flex flex-col items-start rounded-[4px] border border-neutral-800 bg-neutral-900 p-4 text-left hover:border-blue-600"
                            >
                              <p className="text-sm font-bold text-white truncate w-full">
                                {product.name}
                              </p>
                              {product.sku && (
                                <p className="text-[10px] text-neutral-600 mt-0.5">
                                  {product.sku}
                                </p>
                              )}
                              <p className="text-xs text-neutral-500 mt-2">
                                Estoque:{" "}
                                <span className="font-mono font-bold text-neutral-300">
                                  {product.totalQuantity}
                                </span>
                              </p>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={Search}
                          title="Busque um produto"
                          description="Use o campo acima para buscar por nome, SKU ou código de barras"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Cart (Desktop) */}
              {!isMobile && (
                <div className="space-y-6">
                  <div className="lg:sticky lg:top-4">
                    <Card className="rounded-[4px] border border-neutral-800 bg-[#171717]">
                      <CardHeader className="border-b border-neutral-800 pb-4">
                        <div className="flex items-center gap-2">
                          {cartStep !== "cart" ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={cartStep === "checkout" ? goSaleType : goCart}
                              className="h-6 w-6 mr-1 rounded-[4px] text-neutral-400 hover:text-white"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <ShoppingCart className="h-4 w-4 text-blue-500" />
                          )}
                          <CardTitle className="text-sm font-bold uppercase tracking-wide text-white">
                            {cartStep === "cart"
                              ? `Carrinho (${cart.length})`
                              : cartStep === "sale-type"
                                ? "Tipo de Venda"
                                : "Forma de Pagamento"}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        {cartStep === "cart" ? (
                          <>
                            {cartItems}
                            {cartTotals}
                            {cart.length > 0 && (
                              <Button
                                type="button"
                                onClick={goSaleType}
                                className="w-full h-11 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]"
                              >
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                                Finalizar Venda
                              </Button>
                            )}
                          </>
                        ) : cartStep === "sale-type" ? (
                          saleTypeStep
                        ) : selectedMode === "LINK" ? (
                          <>
                            {linkPaymentInfo}
                            {checkoutActions}
                          </>
                        ) : (
                          <>
                            {paymentCards}
                            {installmentsField}
                            {checkoutActions}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Drawer (Mobile) */}
            {isMobile && (
              <Drawer
                open={drawerOpen}
                onOpenChange={(open) => {
                  setDrawerOpen(open);
                  if (open) setCartStep("cart");
                }}
              >
                <DrawerContent className="bg-[#171717] border-neutral-800 max-h-[85vh]">
                  <DrawerHeader className="border-b border-neutral-800 pb-4">
                    <DrawerTitle className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
                      {cartStep !== "cart" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={cartStep === "checkout" ? goSaleType : goCart}
                          className="h-6 w-6 mr-1 rounded-[4px] text-neutral-400 hover:text-white"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {cartStep === "cart" ? (
                        <>
                          <ShoppingCart className="h-4 w-4 text-blue-500" />
                          Carrinho ({cart.length})
                        </>
                      ) : cartStep === "sale-type" ? (
                        "Tipo de Venda"
                      ) : (
                        "Forma de Pagamento"
                      )}
                    </DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-6 pt-4 space-y-4 overflow-y-auto">
                    {cartStep === "cart" ? (
                      <>
                        {cartItems}
                        {cartTotals}
                        {cart.length > 0 && (
                          <Button
                            type="button"
                            onClick={goSaleType}
                            className="w-full h-11 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]"
                          >
                            <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                            Finalizar Venda
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          type="button"
                          className="w-full h-10 rounded-[4px] border-neutral-700 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white"
                          asChild
                        >
                          <Link href="/sales">Cancelar</Link>
                        </Button>
                      </>
                    ) : cartStep === "sale-type" ? (
                      saleTypeStep
                    ) : selectedMode === "LINK" ? (
                      <>
                        {linkPaymentInfo}
                        {checkoutActions}
                      </>
                    ) : (
                      <>
                        {paymentCards}
                        {installmentsField}
                        {checkoutActions}
                      </>
                    )}
                  </div>
                </DrawerContent>
              </Drawer>
            )}

            {/* Fixed Bottom Bar — mobile/tablet only */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur-sm p-4 md:ml-[var(--sidebar-width)] lg:hidden">
              {isMobile ? (
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      {cart.length} {cart.length === 1 ? "item" : "itens"}
                    </span>
                    <span className="text-sm font-bold font-mono text-white">
                      {formatCents(total)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)]"
                  >
                    <ShoppingCart className="mr-2 h-3.5 w-3.5" />
                    Ver Carrinho
                  </Button>
                </div>
              ) : (
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      {cart.length} {cart.length === 1 ? "item" : "itens"}
                    </span>
                    <span className="text-sm font-bold font-mono text-white">
                      {formatCents(total)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      type="button"
                      className="h-10 rounded-[4px] border-neutral-700 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-300 hover:bg-neutral-800 hover:text-white"
                      asChild
                    >
                      <Link href="/sales">Cancelar</Link>
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || cart.length === 0}
                      className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Registrando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                          Finalizar Venda
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </Form>
      </main>
      {shareDialog}
    </div>
  );
};
