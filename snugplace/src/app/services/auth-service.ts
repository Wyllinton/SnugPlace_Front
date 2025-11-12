import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { LoginDTO } from '../models/login-dto';
import { AuthResponseDTO } from '../models/auth-response-dto';
import { ResetPasswordDTO } from '../models/reset-password-dto';
import { ResponseDTO } from '../models/response-dto';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authURL = "http://localhost:8080/auth";

  constructor(private http: HttpClient) { }

  public login(loginDTO: LoginDTO): Observable<AuthResponseDTO> { 
    return this.http.post<AuthResponseDTO>(`${this.authURL}/login`, loginDTO);
  }

  public recoverPassword(email: string): Observable<ResponseDTO<string>> {
    return this.http.post<ResponseDTO<string>>(`${this.authURL}/recover-password`, { email })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => new Error(error.error?.message || 'Error al enviar código de recuperación'));
        })
      );
  }

  public resetPassword(resetPasswordDTO: ResetPasswordDTO): Observable<ResponseDTO<string>> {
    console.log('🔍 Enviando resetPasswordDTO al backend:', resetPasswordDTO);
    
    return this.http.post<ResponseDTO<string>>(`${this.authURL}/reset-password`, resetPasswordDTO)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('🔥 Error del servidor:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error
          });
          return throwError(() => new Error(
            error.error?.message || 
            error.error?.content || 
            'Error al restablecer contraseña'
          ));
        })
      );
  }


  // Método para verificar si el usuario está autenticado
  public isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  // Método para guardar el token después del login
  public saveAuthData(authResponse: AuthResponseDTO): void {
    localStorage.setItem('authToken', authResponse.token);
  }

  // Método para limpiar datos de autenticación (logout)
  public clearAuthData(): void {
    localStorage.removeItem('authToken');
  }

  // Método para obtener el token
  public getToken(): string | null {
    return localStorage.getItem('authToken');
  }
}