import { http } from "./http";

export type AppointmentStatus =
  | "pending"
  | "confirmedProvider"
  | "completed"
  | "cancelled"
  | "rejected";

export interface AppointmentUserLite {
  id: string;
  name: string;
  surname?: string;
  email?: string;
  profileImgUrl?: string | null;
  rating?: number;
  role: "client" | "provider";
  days?: string[];
  hours?: string[];
  about?: string;
}

export interface AppointmentItem {
  id: string;
  clientId: AppointmentUserLite;
  providerId: AppointmentUserLite;
  notes: string | null;
  price: string | null;
  addressUrl: string | null;
  date: string; // "2025-12-12"
  startHour: string; // "10:00"
  endHour: string; // "11:00"
  status: AppointmentStatus;
  isActive: boolean;
}

export interface AppointmentsResponse {
  providerAppointments: AppointmentItem[];
  clientAppointments: AppointmentItem[];
}

export async function getMyAppointments(token: string) {
  const { data } = await http.get<AppointmentsResponse>("/appointments", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
}
