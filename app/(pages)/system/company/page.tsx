"use client";

import { useState } from "react";
import { useCompanyModel } from "./company.model";
import { CompanyView } from "./company.view";
import type { UpdateCompanyData, UpdateInfinitePayData } from "./company.types";

export default function CompanyConfigPage() {
  const [isUpdatingCompany, setIsUpdatingCompany] = useState(false);
  const [isUpdatingInfinitePay, setIsUpdatingInfinitePay] = useState(false);
  const [isEditingInfinitePay, setIsEditingInfinitePay] = useState(false);

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
      setIsUpdatingCompany(true);
      await updateCompany(data);
    } finally {
      setIsUpdatingCompany(false);
    }
  };

  const handleUpdateInfinitePay = async (data: UpdateInfinitePayData) => {
    try {
      setIsUpdatingInfinitePay(true);
      await updateInfinitePay(data);
      setIsEditingInfinitePay(false);
    } finally {
      setIsUpdatingInfinitePay(false);
    }
  };

  return (
    <CompanyView
      companyConfig={companyConfig}
      infinitePayConfig={infinitePayConfig}
      isLoadingCompany={isLoadingCompany}
      isLoadingInfinitePay={isLoadingInfinitePay}
      isUpdatingCompany={isUpdatingCompany}
      isUpdatingInfinitePay={isUpdatingInfinitePay}
      isEditingInfinitePay={isEditingInfinitePay}
      error={error}
      onUpdateCompany={handleUpdateCompany}
      onUpdateInfinitePay={handleUpdateInfinitePay}
      onEditInfinitePay={() => setIsEditingInfinitePay(true)}
    />
  );
}
