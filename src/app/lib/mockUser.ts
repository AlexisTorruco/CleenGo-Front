// lib/mockUser.ts
export interface MockUser {
  id: string;
  name: string;
  hasSubscription: boolean;
  subscriptionExpiry?: string; // ISO date
}

const STORAGE_KEY = 'cleengo_mock_user_v1';

export function loadMockUser(): MockUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveMockUser(user: MockUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearMockUser() {
  localStorage.removeItem(STORAGE_KEY);
}
