"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { formatCentsToBRL } from "@/lib/currency";
import type { SellingPriceUpdateModel } from "./product-batches.types";

const FORM_ID = "update-selling-price-form";

const DifferentPricesWarning = () => (
  <div className="flex items-start gap-2 rounded-[4px] border border-amber-500/30 bg-amber-500/10 p-3">
    <AlertTriangle
      className="mt-0.5 size-4 shrink-0 text-amber-400"
      strokeWidth={2.5}
    />
    <p className="text-xs text-amber-300">
      Os lotes possuem preços de venda diferentes. Aplicar irá definir o mesmo
      preço para <span className="font-bold">TODOS</span> os lotes.
    </p>
  </div>
);

const PriceField = ({ model }: { model: SellingPriceUpdateModel }) => (
  <FormField
    control={model.form.control}
    name="sellingPrice"
    render={({ field }) => {
      const { onChange, value, ...rest } = field;
      return (
        <FormItem>
          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Novo preço de venda
          </FormLabel>
          <FormControl>
            <CurrencyInput
              {...rest}
              value={value}
              onValueChange={onChange}
              placeholder="0,00"
              className="h-11 rounded-[4px] border-neutral-800 bg-neutral-900 text-sm font-bold text-emerald-500 focus:border-emerald-600 focus:ring-0 md:h-10"
            />
          </FormControl>
          <FormMessage className="text-[10px] font-bold uppercase text-rose-500" />
        </FormItem>
      );
    }}
  />
);

const PriceModalFooter = ({ model }: { model: SellingPriceUpdateModel }) => (
  <>
    <Button
      type="button"
      variant="ghost"
      onClick={model.closeModal}
      className="rounded-[4px] text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
    >
      Cancelar
    </Button>
    <Button
      type="submit"
      form={FORM_ID}
      className="rounded-[4px] bg-blue-600 px-6 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-blue-700"
    >
      Aplicar Alteração de Preço
    </Button>
  </>
);

const PriceModal = ({ model }: { model: SellingPriceUpdateModel }) => (
  <ResponsiveModal
    open={model.isOpen}
    onOpenChange={model.closeModal}
    title="Alterar Preço de Venda"
    description="Define o mesmo preço de venda para todos os lotes deste produto no armazém atual."
    maxWidth="sm:max-w-[440px]"
    footer={<PriceModalFooter model={model} />}
  >
    <Form {...model.form}>
      <form
        id={FORM_ID}
        onSubmit={model.form.handleSubmit(model.requestConfirmation)}
        className="space-y-4 py-2"
      >
        <PriceField model={model} />
        {model.hasDifferentPrices && <DifferentPricesWarning />}
      </form>
    </Form>
  </ResponsiveModal>
);

const ConfirmDialog = ({ model }: { model: SellingPriceUpdateModel }) => {
  const newPrice = model.form.watch("sellingPrice");

  const onConfirm = (event: React.MouseEvent) => {
    event.preventDefault();
    void model.confirmUpdate();
  };

  return (
    <AlertDialog open={model.isConfirmOpen} onOpenChange={model.closeConfirm}>
      <AlertDialogContent className="rounded-[4px] border-neutral-800 bg-[#171717]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Alterar preço de TODOS os lotes?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-400">
            Isto definirá {formatCentsToBRL(newPrice)} como preço de venda de
            todos os lotes deste produto no armazém atual. Esta ação não pode ser
            desfeita em massa.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-[4px] border-neutral-800 bg-transparent text-white hover:bg-neutral-800">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={model.isSubmitting}
            onClick={onConfirm}
            className="rounded-[4px] border border-blue-500 bg-blue-600 text-white hover:bg-blue-700"
          >
            {model.isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-3 animate-spin" /> Aplicando…
              </>
            ) : (
              "Confirmar Alteração"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const UpdateSellingPriceModal = ({
  model,
}: {
  model: SellingPriceUpdateModel;
}) => (
  <>
    <PriceModal model={model} />
    <ConfirmDialog model={model} />
  </>
);
