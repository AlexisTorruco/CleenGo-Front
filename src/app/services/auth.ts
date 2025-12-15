// src/app/services/auth.ts

import { http } from "./http";

// --------- Tipos base ---------
export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  birthDate: string;
  role: string;
}

export interface Provider extends User {
  days?: string[];
  hours?: string[];
  about?: string;
}

// --------- Tipos para registro normal ---------
export interface RegisterClientRequest {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;

}

export interface RegisterClientResponse {
  message: string;
  user: User;
  token?: string; // por si el backend devuelve token al registrar
}

export interface RegisterProviderRequest {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
}

export interface RegisterProviderResponse {
  message: string;
  provider: Provider;
  token?: string;
}


// --------- Tipos para login normal ---------
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  user: User;
}

// --------- Tipos para login por terceros (OAuth) ---------
export interface ThirdPartyLoginRequest {
  accessToken: string;
  name: string | null;
  surname: string | null;
  phone: string | null;
  profileImgUrl: string | null;
}

export interface ThirdPartyLoginResponse {
  message: string;
  accessToken: string;
  user: User;
}

// --------- Servicios ---------
export async function registerClient(data: RegisterClientRequest) {
  const response = await http.post<RegisterClientResponse>(
    "/auth/register/client",
    data
  );
  return response.data;
}

export async function login(data: LoginRequest) {
  const response = await http.post<LoginResponse>("/auth/login", data);
  return response.data;
}

export async function registerProvider(data: RegisterProviderRequest) {
  const response = await http.post<RegisterProviderResponse>(
    "/auth/register/provider",
    data
  );
  return response.data;
}


// Login / registro con Google (Supabase OAuth)
export async function thirdPartyLogin(
  role: "client" | "provider",
  data: ThirdPartyLoginRequest
) {
  const response = await http.post<ThirdPartyLoginResponse>(
    `/auth/third-party/${role}`,
    data
  );
  return response.data;
}

