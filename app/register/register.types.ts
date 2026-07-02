export {};

export interface RegisterResponse {
  success: boolean;
  message: string | null;
  data: {
    tenantId: string;
    businessName: string;
    userId: string;
    userEmail: string;
    accessToken?: string | null;
    refreshToken?: string | null;
    tokenType?: string | null;
    expiresIn?: number | null;
  };
}
