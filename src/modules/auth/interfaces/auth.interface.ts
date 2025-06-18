// src/modules/auth/interfaces/auth.interface.ts
export interface UserPayload {
  _id: string;
  email: string;
  role: string;
  firstName: string;
  iat?: number;
  exp?: number;
  lastName?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user: {
    _id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
  expiresIn: number;
}


export interface AuthenticatedUser {
  _id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}