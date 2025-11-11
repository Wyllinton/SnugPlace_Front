import { Role } from "./user-role";
import { UserStatus } from "./user-status";

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  birthDate: Date; 
  role?: Role;
  status?: UserStatus;
  description?: string;
  profilePhoto?: string;
}