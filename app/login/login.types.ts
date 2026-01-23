import { LoginFormData } from "./login.schema";

export type { LoginFormData };

export interface LoginResponse {
  success: boolean;
  message: string | null;
  data: {
    tokenType: string;
    expiresIn: number;
    userId: string;
    email: string;
    fullName: string;
    requiresCaptcha: boolean;
  };
}

export interface LoginErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  requiresCaptcha: boolean;
}

export type DebugMessage = {
  timestamp: string;
  type: "info" | "success" | "error";
  message: string;
  details?: unknown;
};
