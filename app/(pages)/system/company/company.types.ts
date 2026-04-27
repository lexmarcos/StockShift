export interface CompanyConfigData {
  businessName: string;
  document: string | null;
  email: string;
  phone: string | null;
  logoUrl: string | null;
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
  isEditingInfinitePay: boolean;
  error: Error | null;
  onUpdateCompany: (data: UpdateCompanyData) => void;
  onUpdateInfinitePay: (data: UpdateInfinitePayData) => void;
  onEditInfinitePay: () => void;
}

export interface UpdateCompanyData {
  businessName: string;
  document?: string;
  email: string;
  phone?: string;
  logo?: File | null;
}

export interface UpdateInfinitePayData {
  handle?: string;
  docNumber: string;
}
