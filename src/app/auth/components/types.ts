export interface IAuthForm {
  email: string;
  name: string;
  password: string;
}

export type AuthType = "signin" | "signup";

export interface IAuthFormProps {
  authType: AuthType;
}
