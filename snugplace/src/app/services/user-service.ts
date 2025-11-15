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
  private usersURL = "http://snugplace-production.up.railway.app/users"; // ✅ SIN /api/

  constructor(private http: HttpClient, private tokenService: TokenService) { }

  // REGISTER NORMAL - POST /users/register
  public register(createUserDTO: CreateUserDTO): Observable<ResponseDTO<string>> {
    return this.http.post<ResponseDTO<string>>(`${this.usersURL}/register`, createUserDTO);
  }

  // REGISTER CON IMAGEN - POST /users/register-with-image
  public registerWithImage(formData: FormData): Observable<ResponseDTO<any>> {
    return this.http.post<ResponseDTO<any>>(`${this.usersURL}/register-with-image`, formData);
  }

  // OBTENER PERFIL - GET /users/{id}
  public getProfile(id: number): Observable<ResponseDTO<UserDTO>> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<ResponseDTO<UserDTO>>(`${this.usersURL}/${id}`, { headers });
  }

  // ACTUALIZAR PERFIL - PUT /users/{id}
  public updateProfile(id: number, updateProfileDTO: UpdateProfileDTO): Observable<ResponseDTO<string>> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.put<ResponseDTO<string>>(`${this.usersURL}/${id}`, updateProfileDTO, { headers });
  }

  // ACTUALIZAR IMAGEN DE PERFIL - PUT /users/{id}/profile-image
  public updateProfileImage(id: number, imageFile: File): Observable<ResponseDTO<any>> {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.put<ResponseDTO<any>>(`${this.usersURL}/${id}/profile-image`, formData, { headers });
  }

  // ELIMINAR USUARIO - DELETE /users/{id}
  public deleteUser(id: number): Observable<ResponseDTO<string>> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.delete<ResponseDTO<string>>(`${this.usersURL}/${id}`, { headers });
  }

  // CAMBIAR CONTRASEÑA - PUT /users/{id}/change-password
  public changePassword(id: number, changePasswordDTO: ChangeUserPasswordDTO): Observable<ResponseDTO<string>> {
    const token = this.tokenService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.put<ResponseDTO<string>>(`${this.usersURL}/${id}/change-password`, changePasswordDTO, { headers });
  }
}