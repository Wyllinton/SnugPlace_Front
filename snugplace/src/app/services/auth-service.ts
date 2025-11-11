import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginDTO } from '../models/login-dto';
import { AuthResponseDTO } from '../models/auth-response-dto'; 

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authURL = "http://localhost:8080/auth";

  constructor(private http: HttpClient) { }

  public login(loginDTO: LoginDTO): Observable<AuthResponseDTO> { 
    return this.http.post<AuthResponseDTO>(`${this.authURL}/login`, loginDTO);
  }
}