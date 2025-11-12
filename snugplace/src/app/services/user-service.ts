import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CreateUserDTO } from '../models/create-user-dto';
import { UpdateProfileDTO } from '../models/update-user-dto';
import { ResponseDTO } from '../models/response-dto';
import { UserDTO } from '../models/user-dto';
import { ChangeUserPasswordDTO } from '../models/change-user-password-dto';
import { TokenService } from './token-service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersURL = "http://localhost:8080/users";

  constructor(private http: HttpClient, private tokenService: TokenService) { }

  // REGISTER - POST /users/register
  public register(createUserDTO: CreateUserDTO): Observable<ResponseDTO<string>> {
    return this.http.post<ResponseDTO<string>>(`${this.usersURL}/register`, createUserDTO);
  }

  // OBTENER PERFIL - GET /users/{id}/profile
  public getProfile(id: number): Observable<ResponseDTO<UserDTO>> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<ResponseDTO<UserDTO>>(`${this.usersURL}/${id}/profile`, { headers });
  }

  // ACTUALIZAR PERFIL - PATCH /users/{id}/profile/edit
  public updateProfile(id: number, updateProfileDTO: UpdateProfileDTO): Observable<ResponseDTO<string>> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.patch<ResponseDTO<string>>(`${this.usersURL}/${id}/profile/edit`, updateProfileDTO, { headers });
  }

  // ELIMINAR USUARIO - DELETE /users/{id}/profile/del
  public deleteUser(id: number): Observable<ResponseDTO<string>> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.delete<ResponseDTO<string>>(`${this.usersURL}/${id}/profile/del`, { headers });
  }

  // CAMBIAR CONTRASEÑA - PATCH /users/{id}/profile/change-password
  public changePassword(id: number, changePasswordDTO: ChangeUserPasswordDTO): Observable<ResponseDTO<string>> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.patch<ResponseDTO<string>>(`${this.usersURL}/${id}/profile/change-password`, changePasswordDTO, { headers });
  }
}