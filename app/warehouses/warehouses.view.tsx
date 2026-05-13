"use client";

import {
  AlertTriangle,
  Building,
  Building2,
  CheckCircle2,
  Edit,
  Loader2,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { WarehouseFormData } from "./warehouses.schema";
import type {
  SortConfig,
  StatusFilter,
  Warehouse,
  WarehouseStockSummary,
} from "./warehouses.types";
import { WarehouseStockInfo } from "./warehouse-stock-info";

interface WarehousesViewProps {
  warehouses: Warehouse[];
  isLoading: boolean;
  error: Error | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
  sortConfig: SortConfig;
  handleSort: (key: SortConfig["key"]) => void;
  isModalOpen: boolean;
  selectedWarehouse: Warehouse | null;
  openCreateModal: () => void;
  openEditModal: (warehouse: Warehouse) => void;
  closeModal: () => void;
  form: UseFormReturn<WarehouseFormData>;
  onSubmit: (data: WarehouseFormData) => void;
  warehouseToDelete: Warehouse | null;
  openDeleteDialog: (warehouse: Warehouse) => void;
  closeDeleteDialog: () => void;
  confirmDelete: () => void;
  isDeleting: boolean;
  onSelectWarehouse: (id: string) => void;
  selectedWarehouseId: string | null;
  stockSummariesByWarehouseId: Record<string, WarehouseStockSummary>;
  isStockSummaryLoading: boolean;
}

interface WarehousesViewState extends WarehousesViewProps {
  isSubmitting: boolean;
}

const WAREHOUSE_STATUS_FILTERS: StatusFilter[] = ["all", "active", "inactive"];

export const WarehousesView = (props: WarehousesViewProps) => {
  const viewState: WarehousesViewState = {
    ...props,
    isSubmitting: props.form.formState.isSubmitting,
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <WarehousesHeader viewState={viewState} />
      <WarehousesMain viewState={viewState} />
      <WarehouseMobileCreateAction openCreateModal={props.openCreateModal} />
      <WarehouseFormModal viewState={viewState} />
      <WarehouseDeleteDialog viewState={viewState} />
    </div>
  );
};

function WarehousesHeader({
  viewState,
}: {
  viewState: WarehousesViewState;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0A0A0A]/60">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          <WarehouseHeaderTitle openCreateModal={viewState.openCreateModal} />
          <WarehouseHeaderFilters viewState={viewState} />
        </div>
      </div>
    </header>
  );
}

function WarehouseHeaderTitle({
  openCreateModal,
}: {
  openCreateModal: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-[4px] bg-blue-600">
          <Building2 className="size-4 text-white" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight text-white uppercase">
            Armazéns
          </h1>
          <p className="text-[10px] tracking-wide text-neutral-500 uppercase">
            Gerencie seus centros de distribuição
          </p>
        </div>
      </div>
      <PermissionGate permission="warehouses:create">
        <Button
          onClick={openCreateModal}
          className="hidden h-9 rounded-[4px] bg-blue-600 text-xs font-bold tracking-wide text-white uppercase hover:bg-blue-700 md:flex"
        >
          <Plus className="mr-2 size-4" />
          Novo Armazém
        </Button>
      </PermissionGate>
    </div>
  );
}

function WarehouseHeaderFilters({
  viewState,
}: {
  viewState: WarehousesViewState;
}) {
  return (
    <div className="flex flex-col items-center gap-3 md:flex-row">
      <div className="relative w-full flex-1 md:max-w-md">
        <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-neutral-500" />
        <Input
          placeholder="Buscar por nome, código ou cidade…"
          value={viewState.searchQuery}
          onChange={(event) => viewState.setSearchQuery(event.target.value)}
          className="h-9 w-full rounded-[4px] border-neutral-800 bg-[#171717] pl-9 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-blue-600 focus:ring-0"
        />
      </div>
      <div className="flex w-full gap-2 overflow-x-auto pb-1 md:w-auto md:pb-0">
        {WAREHOUSE_STATUS_FILTERS.map((status) => (
          <WarehouseStatusButton
            key={status}
            activeStatus={viewState.statusFilter}
            setStatusFilter={viewState.setStatusFilter}
            status={status}
          />
        ))}
      </div>
    </div>
  );
}

function WarehouseStatusButton({
  activeStatus,
  setStatusFilter,
  status,
}: {
  activeStatus: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
  status: StatusFilter;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setStatusFilter(status)}
      className={cn(
        "h-8 rounded-[4px] border px-3 text-xs font-bold tracking-wide uppercase",
        activeStatus === status
          ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
          : "border-neutral-800 bg-[#171717] text-neutral-400 hover:border-neutral-600 hover:text-white",
      )}
    >
      {status === "all" ? "Todos" : status === "active" ? "Ativos" : "Inativos"}
    </Button>
  );
}

function WarehousesMain({ viewState }: { viewState: WarehousesViewState }) {
  const { error, isLoading, warehouses } = viewState;

  return (
    <main className="mx-auto mt-4 w-full max-w-7xl p-4 md:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <div className="min-h-[400px]">
          {isLoading && <WarehousesLoadingState />}
          {error && <WarehousesErrorState />}
          {!isLoading && !error && warehouses.length === 0 && (
            <WarehousesEmptyState viewState={viewState} />
          )}
          {!isLoading && !error && warehouses.length > 0 && (
            <WarehouseCardsGrid viewState={viewState} />
          )}
        </div>
      </div>
    </main>
  );
}

function WarehousesLoadingState() {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-neutral-800 bg-[#171717]/50">
      <Loader2 className="size-8 animate-spin text-blue-600" />
      <span className="text-xs tracking-wide text-neutral-500 uppercase">
        Carregando armazéns…
      </span>
    </div>
  );
}

function WarehousesErrorState() {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[4px] border border-rose-900/30 bg-rose-950/10">
      <AlertTriangle className="size-8 text-rose-500" />
      <div className="text-center">
        <h3 className="text-sm font-semibold text-rose-500 uppercase">
          Erro de Carregamento
        </h3>
        <p className="text-xs text-rose-500/70">
          Não foi possível acessar a lista de armazéns
        </p>
      </div>
    </div>
  );
}

function WarehousesEmptyState({
  viewState,
}: {
  viewState: WarehousesViewState;
}) {
  const isFiltered = Boolean(viewState.searchQuery) || viewState.statusFilter !== "all";

  return (
    <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-dashed border-neutral-800 bg-[#171717]/30">
      <div className="flex size-20 items-center justify-center rounded-[4px] border border-neutral-800 bg-neutral-900">
        <Building className="size-8 text-neutral-600" />
      </div>
      <div className="text-center">
        <h3 className="text-sm font-semibold tracking-wide text-neutral-300 uppercase">
          {isFiltered ? "Nenhum resultado" : "Nenhum armazém"}
        </h3>
        <p className="mt-1 max-w-xs text-xs text-neutral-500">
          {isFiltered
            ? "Tente ajustar seus termos de busca."
            : "Comece cadastrando seu primeiro armazém."}
        </p>
      </div>
      {!isFiltered && (
        <PermissionGate permission="warehouses:create">
          <Button
            onClick={viewState.openCreateModal}
            className="rounded-[4px] bg-blue-600 text-xs font-bold tracking-wide text-white uppercase hover:bg-blue-700"
          >
            <Plus className="mr-2 size-3.5" />
            Criar Primeiro Armazém
          </Button>
        </PermissionGate>
      )}
    </div>
  );
}

function WarehouseCardsGrid({
  viewState,
}: {
  viewState: WarehousesViewState;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {viewState.warehouses.map((warehouse) => (
        <WarehouseCard
          key={warehouse.id}
          warehouse={warehouse}
          viewState={viewState}
        />
      ))}
    </div>
  );
}

function WarehouseCard({
  warehouse,
  viewState,
}: {
  warehouse: Warehouse;
  viewState: WarehousesViewState;
}) {
  const isSelected = viewState.selectedWarehouseId === warehouse.id;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => viewState.onSelectWarehouse(warehouse.id)}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        viewState.onSelectWarehouse(warehouse.id);
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-[4px] border bg-[#171717]",
        isSelected
          ? "border-blue-600 ring-1 ring-blue-600"
          : warehouse.isActive
            ? "border-neutral-800 hover:border-neutral-700"
            : "border-neutral-800/50 opacity-75 hover:opacity-100",
      )}
    >
      <WarehouseCardHeader
        isSelected={isSelected}
        warehouse={warehouse}
        viewState={viewState}
      />
      <WarehouseStatusBadge warehouse={warehouse} />
      <div className="mt-auto border-t border-neutral-800 bg-[#0f0f0f]">
        <WarehouseStockInfo
          summary={viewState.stockSummariesByWarehouseId[warehouse.id]}
          isLoading={viewState.isStockSummaryLoading}
        />
      </div>
    </div>
  );
}

function WarehouseCardHeader({
  isSelected,
  warehouse,
  viewState,
}: {
  isSelected: boolean;
  warehouse: Warehouse;
  viewState: WarehousesViewState;
}) {
  return (
    <div className="flex items-start justify-between p-4 pb-3">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <WarehouseCardIcon warehouse={warehouse} />
        <WarehouseCardInfo isSelected={isSelected} warehouse={warehouse} />
      </div>
      <WarehouseActionsMenu warehouse={warehouse} viewState={viewState} />
    </div>
  );
}

function WarehouseCardIcon({ warehouse }: { warehouse: Warehouse }) {
  return (
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-[4px] border",
        warehouse.isActive
          ? "border-blue-600/30 bg-blue-600/10"
          : "border-neutral-700 bg-neutral-800/50",
      )}
    >
      <Building2
        className={cn(
          "size-5",
          warehouse.isActive ? "text-blue-500" : "text-neutral-500",
        )}
      />
    </div>
  );
}

function WarehouseCardInfo({
  isSelected,
  warehouse,
}: {
  isSelected: boolean;
  warehouse: Warehouse;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-center gap-2">
        <span
          className={cn(
            "rounded-[2px] border px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase",
            warehouse.isActive
              ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
              : "border-neutral-700 bg-neutral-800 text-neutral-500",
          )}
        >
          {warehouse.code}
        </span>
        {isSelected && <CheckCircle2 className="size-3.5 text-blue-500" />}
      </div>
      <h3 className="truncate text-sm leading-tight font-semibold text-white">
        {warehouse.name}
      </h3>
      <div className="mt-1.5 flex items-center gap-1.5">
        <MapPin className="size-3 shrink-0 text-neutral-600" />
        <span className="truncate text-[11px] text-neutral-400">
          {formatWarehouseAddress(warehouse)}
        </span>
      </div>
    </div>
  );
}

function formatWarehouseAddress(warehouse: Warehouse) {
  if (warehouse.address) {
    return `${warehouse.address}, ${warehouse.city} - ${warehouse.state}`;
  }

  return `${warehouse.city} - ${warehouse.state}`;
}

function WarehouseActionsMenu({
  warehouse,
  viewState,
}: {
  warehouse: Warehouse;
  viewState: WarehousesViewState;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 rounded-[4px] text-neutral-500 hover:bg-neutral-800 hover:text-white"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40 rounded-[4px] border-neutral-800 bg-[#171717] text-neutral-300"
      >
        <PermissionGate permission="warehouses:update">
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              viewState.openEditModal(warehouse);
            }}
            className="cursor-pointer text-xs focus:bg-neutral-800 focus:text-white"
          >
            <Edit className="mr-2 size-3.5" />
            Editar
          </DropdownMenuItem>
        </PermissionGate>
        <PermissionGate permission="warehouses:delete">
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              viewState.openDeleteDialog(warehouse);
            }}
            className="cursor-pointer text-xs text-rose-500 focus:bg-rose-950/20 focus:text-rose-400"
          >
            <Trash2 className="mr-2 size-3.5" />
            Excluir
          </DropdownMenuItem>
        </PermissionGate>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WarehouseStatusBadge({ warehouse }: { warehouse: Warehouse }) {
  return (
    <div className="px-4 pb-3">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-[2px] border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
          warehouse.isActive
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            : "border-neutral-700 bg-neutral-800 text-neutral-500",
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-[4px]",
            warehouse.isActive ? "bg-emerald-500" : "bg-neutral-600",
          )}
        />
        {warehouse.isActive ? "Operacional" : "Inativo"}
      </span>
    </div>
  );
}

function WarehouseMobileCreateAction({
  openCreateModal,
}: {
  openCreateModal: () => void;
}) {
  return (
    <PermissionGate permission="warehouses:create">
      <Button
        onClick={openCreateModal}
        className="fixed right-6 bottom-6 z-40 size-14 rounded-[4px] bg-blue-600 text-white shadow-lg hover:bg-blue-700 md:hidden"
        size="icon"
      >
        <Plus className="size-7" />
      </Button>
    </PermissionGate>
  );
}

function WarehouseFormModal({
  viewState,
}: {
  viewState: WarehousesViewState;
}) {
  const { closeModal, form, isModalOpen, onSubmit, selectedWarehouse } =
    viewState;

  return (
    <ResponsiveModal
      open={isModalOpen}
      onOpenChange={closeModal}
      title={selectedWarehouse ? "Editar Armazém" : "Novo Armazém"}
      description={
        selectedWarehouse
          ? "Atualize as informações do armazém"
          : "Preencha os dados para cadastrar um novo local"
      }
      footer={<WarehouseFormFooter viewState={viewState} />}
    >
      <Form {...form}>
        <form
          id="warehouse-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5 py-2"
        >
          <WarehouseNameField form={form} />
          <WarehouseLocationFields form={form} />
          <WarehouseStatusField form={form} />
        </form>
      </Form>
    </ResponsiveModal>
  );
}

function WarehouseFormFooter({
  viewState,
}: {
  viewState: WarehousesViewState;
}) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={viewState.closeModal}
        className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="warehouse-form"
        disabled={viewState.isSubmitting}
        className="rounded-[4px] bg-blue-600 text-xs font-bold tracking-wide text-white uppercase hover:bg-blue-700"
      >
        {viewState.isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-3.5 animate-spin" />
            Salvando…
          </>
        ) : (
          "Salvar Dados"
        )}
      </Button>
    </>
  );
}

function WarehouseNameField({
  form,
}: {
  form: UseFormReturn<WarehouseFormData>;
}) {
  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
            Nome do Armazém <span className="text-rose-500">*</span>
          </FormLabel>
          <FormControl>
            <Input
              placeholder="EX: CENTRAL DE DISTRIBUIÇÃO"
              className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
              {...field}
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function WarehouseLocationFields({
  form,
}: {
  form: UseFormReturn<WarehouseFormData>;
}) {
  return (
    <div className="space-y-4 border-t border-neutral-800 pt-2">
      <h4 className="mb-2 text-xs font-semibold tracking-wide text-white uppercase">
        Localização
      </h4>
      <WarehouseAddressField form={form} />
      <div className="grid gap-4 sm:grid-cols-2">
        <WarehouseCityField form={form} />
        <WarehouseStateField form={form} />
      </div>
    </div>
  );
}

function WarehouseAddressField({
  form,
}: {
  form: UseFormReturn<WarehouseFormData>;
}) {
  return (
    <FormField
      control={form.control}
      name="address"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
            Endereço Completo
          </FormLabel>
          <FormControl>
            <Input
              placeholder="Rua, Número, Bairro"
              className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
              {...field}
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function WarehouseCityField({
  form,
}: {
  form: UseFormReturn<WarehouseFormData>;
}) {
  return (
    <FormField
      control={form.control}
      name="city"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
            Cidade <span className="text-rose-500">*</span>
          </FormLabel>
          <FormControl>
            <Input
              placeholder="Ex: São Paulo"
              className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm focus:border-blue-600 focus:ring-0"
              {...field}
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function WarehouseStateField({
  form,
}: {
  form: UseFormReturn<WarehouseFormData>;
}) {
  return (
    <FormField
      control={form.control}
      name="state"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
            Estado (UF) <span className="text-rose-500">*</span>
          </FormLabel>
          <FormControl>
            <Input
              placeholder="Ex: SP"
              maxLength={2}
              className="rounded-[4px] border-neutral-800 bg-neutral-900 text-sm uppercase focus:border-blue-600 focus:ring-0"
              {...field}
            />
          </FormControl>
          <FormMessage className="text-xs text-rose-500" />
        </FormItem>
      )}
    />
  );
}

function WarehouseStatusField({
  form,
}: {
  form: UseFormReturn<WarehouseFormData>;
}) {
  return (
    <div className="border-t border-neutral-800 pt-2">
      <FormField
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-[4px] border border-neutral-800 bg-neutral-900 p-3">
            <div className="space-y-0.5">
              <FormLabel className="text-sm font-bold text-white">
                Status Operacional
              </FormLabel>
              <FormDescription className="text-xs text-neutral-500">
                Armazéns inativos não permitem movimentações
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                className="data-[state=checked]:bg-blue-600"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}

function WarehouseDeleteDialog({
  viewState,
}: {
  viewState: WarehousesViewState;
}) {
  const {
    closeDeleteDialog,
    confirmDelete,
    isDeleting,
    warehouseToDelete,
  } = viewState;

  return (
    <ResponsiveModal
      open={!!warehouseToDelete}
      onOpenChange={closeDeleteDialog}
      title="Confirmar Exclusão"
      description={`Tem certeza que deseja deletar o armazém ${warehouseToDelete?.name}?`}
      maxWidth="sm:max-w-[400px]"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={closeDeleteDialog}
            className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmDelete}
            disabled={isDeleting}
            className="rounded-[4px] bg-rose-600 text-xs font-bold tracking-wide text-white uppercase hover:bg-rose-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 size-3.5 animate-spin" />
                Deletando…
              </>
            ) : (
              "Confirmar Exclusão"
            )}
          </Button>
        </>
      }
    >
      <div className="py-2">
        <p className="text-xs text-neutral-500">
          Esta ação é irreversível e pode afetar históricos de movimentação.
        </p>
      </div>
    </ResponsiveModal>
  );
}
