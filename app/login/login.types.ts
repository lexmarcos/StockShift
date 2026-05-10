export {};

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
    mustChangePassword: boolean;
  };
}

export type DebugMessage = {
  timestamp: string;
  type: "info" | "success" | "error";
  message: string;
  details?: unknown;
};
