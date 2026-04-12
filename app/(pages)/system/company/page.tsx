"use client";

import { useState } from "react";
import { useCompanyModel } from "./company.model";
import { CompanyView } from "./company.view";
import type { UpdateCompanyData, UpdateInfinitePayData } from "./company.types";

export default function CompanyConfigPage() {
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    companyConfig,
    infinitePayConfig,
    isLoadingCompany,
    isLoadingInfinitePay,
    error,
    updateCompany,
    updateInfinitePay,
  } = useCompanyModel();

  const handleUpdateCompany = async (data: UpdateCompanyData) => {
    try {
      setIsUpdating(true);
      await updateCompany(data);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateInfinitePay = async (data: UpdateInfinitePayData) => {
    try {
      setIsUpdating(true);
      await updateInfinitePay(data);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <CompanyView
      companyConfig={companyConfig}
      infinitePayConfig={infinitePayConfig}
      isLoadingCompany={isLoadingCompany}
      isLoadingInfinitePay={isLoadingInfinitePay}
      isUpdating={isUpdating}
      error={error}
      onUpdateCompany={handleUpdateCompany}
      onUpdateInfinitePay={handleUpdateInfinitePay}
    />
  );
}
