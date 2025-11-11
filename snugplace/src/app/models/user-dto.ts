import { Role } from "./user-role";

export interface UserDTO {
    id: number;
    name: string;
    email: string;
    photoUrl: string;
    role: Role;
}