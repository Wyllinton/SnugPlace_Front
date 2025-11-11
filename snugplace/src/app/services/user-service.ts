import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateUserDTO } from '../models/create-user-dto';
import { UpdateProfileDTO } from '../models/update-user-dto';
import { ResponseDTO } from '../models/response-dto';
import { UserDTO } from '../models/user-dto';
import { ChangeUserPasswordDTO } from '../models/change-user-password-dto';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersURL = "http://localhost:8080/users";

  constructor(private http: HttpClient) { }

  // REGISTER - POST /users/register
  public register(createUserDTO: CreateUserDTO): Observable<ResponseDTO<string>> {
    return this.http.post<ResponseDTO<string>>(`${this.usersURL}/register`, createUserDTO);
  }

  // GET PROFILE - GET /users/{id}/profile
  public getProfile(id: number): Observable<ResponseDTO<UserDTO>> {
    return this.http.get<ResponseDTO<UserDTO>>(`${this.usersURL}/${id}/profile`);
  }

  // UPDATE PROFILE - PATCH /users/{id}/profile
  public updateProfile(id: number, updateProfileDTO: UpdateProfileDTO): Observable<ResponseDTO<string>> {
    return this.http.patch<ResponseDTO<string>>(`${this.usersURL}/${id}/profile`, updateProfileDTO);
  }

  // DELETE USER - DELETE /users/{id}/profile
  public deleteUser(id: number): Observable<ResponseDTO<string>> {
    return this.http.delete<ResponseDTO<string>>(`${this.usersURL}/${id}/profile`);
  }

  // CHANGE PASSWORD - PATCH /users/{id}/profile/change-password
  public changePassword(id: number, changePasswordDTO: ChangeUserPasswordDTO): Observable<ResponseDTO<string>> {
    return this.http.patch<ResponseDTO<string>>(`${this.usersURL}/${id}/profile/change-password`, changePasswordDTO);
  }
}