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
    customAttributes,
    addCustomAttribute,
    removeCustomAttribute,
    updateCustomAttribute,
    nameInputRef,
  } = useProductCreateModel();

  return (
    <ProductCreateView
      form={form}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      categories={categories}
      isLoadingCategories={isLoadingCategories}
      customAttributes={customAttributes}
      addCustomAttribute={addCustomAttribute}
      removeCustomAttribute={removeCustomAttribute}
      updateCustomAttribute={updateCustomAttribute}
      nameInputRef={nameInputRef}
    />
  );
}
