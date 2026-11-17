import { Role } from './auth.models';

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  createdAt?: string | null;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
}
