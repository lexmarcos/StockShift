export type HomeRedirectPath = "/sales" | "/warehouses";

export interface HomeRouteSession {
  accessToken?: string;
  refreshToken?: string;
}

export interface HomeViewProps {
  redirectMessage: string;
}
