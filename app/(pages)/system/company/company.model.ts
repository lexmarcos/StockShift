import useSWR, { mutate } from "swr";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/contexts/auth-context";
import type {
  CompanyConfigData,
  InfinitePayConfigData,
  UpdateCompanyData,
  UpdateInfinitePayData,
} from "./company.types";

interface CompanyResponse {
  success: boolean;
  data: CompanyConfigData;
}

interface InfinitePayResponse {
  success: boolean;
  data: InfinitePayConfigData;
}

interface ApiResponseData<T> {
  success: boolean;
  data: T;
}

export const useCompanyModel = () => {
  const { isAdmin, isLoading: isLoadingAdmin } = useAuth();

  // Fetch company config
  const { data: companyData, error: companyError, isLoading: isLoadingCompany } = useSWR<CompanyResponse>(
    isAdmin ? "tenants/me" : null,
    async () => {
      return await api.get("tenants/me").json<CompanyResponse>();
    }
  );

  // Fetch InfinitePay config
  const { data: infinitePayData, error: infinitePayError, isLoading: isLoadingInfinitePay } = useSWR<InfinitePayResponse>(
    isAdmin ? "tenants/me/infinitepay" : null,
    async () => {
      return await api.get("tenants/me/infinitepay").json<InfinitePayResponse>();
    }
  );

  const isLoading = isLoadingAdmin || isLoadingCompany || isLoadingInfinitePay;
  const error = companyError || infinitePayError || null;

  const updateCompany = async (data: UpdateCompanyData) => {
    const response = await api.put("tenants/me", { json: data }).json<ApiResponseData<CompanyConfigData>>();
    await mutate("tenants/me", response, false);
    return response;
  };

  const updateInfinitePay = async (data: UpdateInfinitePayData) => {
    const response = await api.put("tenants/me/infinitepay", { json: data }).json<ApiResponseData<InfinitePayConfigData>>();
    await mutate("tenants/me/infinitepay", response, false);
    return response;
  };

  return {
    companyConfig: companyData?.data || null,
    infinitePayConfig: infinitePayData?.data || null,
    isLoadingCompany,
    isLoadingInfinitePay,
    isLoading,
    error,
    updateCompany,
    updateInfinitePay,
  };
};
