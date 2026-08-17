export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  roles: string[];
}

export interface LoginRequest {
  tenantId: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  success: true;
  data: {
    user: AuthUser;
    accessToken: string;
  };
}

export interface RefreshResponse {
  success: true;
  data: {
    accessToken: string;
  };
}

export interface LogoutResponse {
  success: true;
  message: string;
}

export interface MeResponse {
  userId: string;
  tenantId: string;
}
