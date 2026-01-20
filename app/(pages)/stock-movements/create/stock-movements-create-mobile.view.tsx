"use client";

import { Camera, ArrowRight, Check } from "lucide-react";
import { MobileWizardHeader } from "./_components/mobile-wizard-header";
import { WarehouseContextBar } from "./_components/warehouse-context-bar";
import { SetupPhase } from "./_components/setup-phase";
import { AdditionPhase } from "./_components/addition-phase";
import { AddItemSheet } from "./_components/add-item-sheet";
import { ReviewPhase } from "./_components/review-phase";
import { SuccessScreen } from "./_components/success-screen";
import { MobileFooterActions } from "./_components/mobile-footer-actions";
import { BarcodeScannerModal } from "@/components/product/barcode-scanner-modal";
import { useMobileWizardModel } from "./stock-movements-create-mobile.model";

export const StockMovementCreateMobileView = () => {
  const model = useMobileWizardModel();

  const getHeaderTitle = () => {
    switch (model.phase) {
      case "setup":
        return "Nova Transferência";
      case "addition":
        return "Transferência";
      case "review":
        return "Revisar Transferência";
      case "success":
        return "";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      {model.phase !== "success" && (
        <MobileWizardHeader
          title={getHeaderTitle()}
          onBack={model.handleBack}
          showBack={model.phase !== "setup"}
        />
      )}

      {/* Context Bar (only in addition and review phases) */}
      {(model.phase === "addition" || model.phase === "review") &&
        model.sourceWarehouse &&
        model.destinationWarehouse && (
          <WarehouseContextBar
            sourceWarehouse={model.sourceWarehouse.name}
            destinationWarehouse={model.destinationWarehouse.name}
          />
        )}

      {/* Content */}
      {model.phase === "setup" && (
        <SetupPhase
          warehouses={model.warehouses}
          sourceWarehouseId={model.sourceWarehouseId}
          destinationWarehouseId={model.destinationWarehouseId}
          onSourceChange={model.handleSourceChange}
          onDestinationChange={model.handleDestinationChange}
        />
      )}

      {model.phase === "addition" && (
        <AdditionPhase
          items={model.items}
          products={model.products}
          searchQuery={model.searchQuery}
          onSearchChange={model.setSearchQuery}
          onProductSelect={model.handleProductSelect}
          onEditItem={model.handleEditItem}
          onRemoveItem={model.handleRemoveItem}
        />
      )}

      {model.phase === "review" && model.sourceWarehouse && model.destinationWarehouse && (
        <ReviewPhase
          sourceWarehouseName={model.sourceWarehouse.name}
          destinationWarehouseName={model.destinationWarehouse.name}
          items={model.items}
          executeNow={model.executeNow}
          onExecuteNowChange={model.setExecuteNow}
          onEditRoute={model.goToSetup}
          onEditItems={model.goToAddition}
        />
      )}

      {model.phase === "success" && model.createdMovement && model.sourceWarehouse && model.destinationWarehouse && (
        <SuccessScreen
          movementId={model.createdMovement.id}
          movementCode={model.createdMovement.code}
          totalQuantity={model.items.reduce((sum, item) => sum + item.quantity, 0)}
          sourceWarehouse={model.sourceWarehouse.name}
          destinationWarehouse={model.destinationWarehouse.name}
          status={model.createdMovement.status}
          onNewMovement={model.handleNewMovement}
        />
      )}

      {/* Footer Actions */}
      {model.phase === "setup" && (
        <MobileFooterActions
          primaryAction={{
            label: "Continuar",
            onClick: model.goToAddition,
            disabled: !model.canContinueFromSetup,
            icon: ArrowRight,
          }}
        />
      )}

      {model.phase === "addition" && (
        <MobileFooterActions
          secondaryAction={{
            label: "Scan",
            onClick: () => model.setIsScannerOpen(true),
            icon: Camera,
          }}
          primaryAction={{
            label: "Finalizar",
            onClick: model.goToReview,
            disabled: !model.canContinueFromAddition,
            icon: ArrowRight,
          }}
          progress={{
            value: model.items.length,
            max: Math.max(model.items.length, 10),
            label: `${model.items.length} ${model.items.length === 1 ? "item" : "itens"}`,
          }}
        />
      )}

      {model.phase === "review" && (
        <MobileFooterActions
          primaryAction={{
            label: model.isSubmitting ? "Enviando..." : "Confirmar Transferência",
            onClick: model.handleSubmit,
            disabled: model.isSubmitting,
            variant: "emerald",
            icon: Check,
          }}
        />
      )}

      {/* Add Item Sheet */}
      <AddItemSheet
        open={model.isAddItemSheetOpen}
        onOpenChange={model.setIsAddItemSheetOpen}
        product={model.selectedProduct}
        batches={model.batches}
        isLoadingBatches={model.isLoadingBatches}
        onAddItem={model.handleAddItem}
        onAddAndFinish={model.handleAddAndFinish}
      />

      {/* Barcode Scanner */}
      <BarcodeScannerModal
        open={model.isScannerOpen}
        onClose={() => model.setIsScannerOpen(false)}
        onScan={model.handleBarcodeScan}
      />
    </div>
  );
};
