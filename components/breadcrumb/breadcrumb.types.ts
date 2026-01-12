export interface BreadcrumbData {
  title: string;
  backUrl: string;
  section?: string;
  subsection?: string;
}

export interface BreadcrumbContextValue {
  breadcrumb: BreadcrumbData | null;
  setBreadcrumb: (data: BreadcrumbData) => void;
  clearBreadcrumb: () => void;
}

export interface UseBreadcrumbParams {
  title: string;
  backUrl: string;
  section?: string;
  subsection?: string;
}
