export interface CompanyConfigData {
  businessName: string;
  document: string | null;
  email: string;
  phone: string | null;
  isActive: boolean;
}

export interface InfinitePayConfigData {
  handle: string | null;
  docNumber: string | null;
  configured: boolean;
}

export interface CompanyViewProps {
  companyConfig: CompanyConfigData | null;
  infinitePayConfig: InfinitePayConfigData | null;
  isLoadingCompany: boolean;
  isLoadingInfinitePay: boolean;
  isUpdating: boolean;
  error: Error | null;
  onUpdateCompany: (data: UpdateCompanyData) => void;
  onUpdateInfinitePay: (data: UpdateInfinitePayData) => void;
}

export interface UpdateCompanyData {
  businessName: string;
  document?: string;
  email: string;
  phone?: string;
}

export interface UpdateInfinitePayData {
  handle?: string;
  docNumber: string;
}
