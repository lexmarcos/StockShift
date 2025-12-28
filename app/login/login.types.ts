import { LoginFormData } from "./login.schema";

export type { LoginFormData };

export interface LoginResponse {
  success: boolean;
  message: string | null;
  data: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    userId: string;
    email: string;
    fullName: string;
  };
}
