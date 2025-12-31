"use client";

import { useProductCreateModel } from "./products-create.model";
import { ProductCreateView } from "./products-create.view";

export default function ProductCreatePage() {
  const {
    form,
    onSubmit,
    isSubmitting,
    categories,
    isLoadingCategories,
    brands,
    isLoadingBrands,
    customAttributes,
    addCustomAttribute,
    removeCustomAttribute,
    updateCustomAttribute,
    nameInputRef,
    isScannerOpen,
    openScanner,
    closeScanner,
    handleBarcodeScanned,
  } = useProductCreateModel();

  return (
    <ProductCreateView
      form={form}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      categories={categories}
      isLoadingCategories={isLoadingCategories}
      brands={brands}
      isLoadingBrands={isLoadingBrands}
      customAttributes={customAttributes}
      addCustomAttribute={addCustomAttribute}
      removeCustomAttribute={removeCustomAttribute}
      updateCustomAttribute={updateCustomAttribute}
      nameInputRef={nameInputRef}
      isScannerOpen={isScannerOpen}
      openScanner={openScanner}
      closeScanner={closeScanner}
      handleBarcodeScanned={handleBarcodeScanned}
    />
  );
}
