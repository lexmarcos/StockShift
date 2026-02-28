import { ChangePasswordFormData } from "./change-password.schema";
import { UseFormReturn } from "react-hook-form";

export interface ChangePasswordViewProps {
  form: UseFormReturn<ChangePasswordFormData>;
  onSubmit: (data: ChangePasswordFormData) => void;
  isLoading: boolean;
}
