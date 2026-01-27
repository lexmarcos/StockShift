import { RegisterFormData } from "./register.schema";

export type { RegisterFormData };

export interface RegisterResponse {
  success: boolean;
  message: string | null;
  data: {
    tenantId: string;
    businessName: string;
    userId: string;
    userEmail: string;
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  };
}

export interface RegisterErrorResponse {
  success: false;
  message: string;
  data: null;
}
