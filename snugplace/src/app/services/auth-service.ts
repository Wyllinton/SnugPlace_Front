import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, throwError, tap } from 'rxjs';
import { LoginDTO } from '../models/login-dto';
import { AuthResponseDTO } from '../models/auth-response-dto';
import { ResetPasswordDTO } from '../models/reset-password-dto';
import { ResponseDTO } from '../models/response-dto';

export interface DecodedToken {
  sub: string; // email
  role: string; // USER o HOST
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authURL = "http://snugplace-production.up.railway.app/auth";
  private tokenKey = 'authToken';

  // BehaviorSubject para rastrear el estado de autenticación
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isAuthenticated());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) { }

  public login(loginDTO: LoginDTO): Observable<AuthResponseDTO> { 
    return this.http.post<AuthResponseDTO>(`${this.authURL}/login`, loginDTO)
      .pipe(
        tap(response => {
          // Guardar el token automáticamente después del login exitoso
          if (response && response.token) {
            this.saveAuthData(response);
            this.isAuthenticatedSubject.next(true);
          }
        })
      );
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


  /**
   * Verifica si el usuario está autenticado
   */
  public isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Verificar si el token ha expirado
    const decoded = this.decodeToken();
    if (!decoded) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp > currentTime;
  }

  /**
   * Guarda los datos de autenticación después del login
   */
  public saveAuthData(authResponse: AuthResponseDTO): void {
    if (authResponse.token) {
      localStorage.setItem(this.tokenKey, authResponse.token);
      console.log('✅ Token guardado exitosamente');
    }
  }

  /**
   * Limpia los datos de autenticación (logout)
   */
  public clearAuthData(): void {
    localStorage.removeItem(this.tokenKey);
    this.isAuthenticatedSubject.next(false);
    console.log('🚪 Sesión cerrada');
  }

  /**
   * Obtiene el token JWT almacenado
   */
  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Decodifica el token JWT para obtener la información del usuario
   */
  public decodeToken(): DecodedToken | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      return null;
    }
  }

  /**
   * Obtiene el rol del usuario actual
   */
  public getUserRole(): string | null {
    const decoded = this.decodeToken();
    return decoded ? decoded.role : null;
  }

  /**
   * Obtiene el email del usuario actual
   */
  public getUserEmail(): string | null {
    const decoded = this.decodeToken();
    return decoded ? decoded.sub : null;
  }

  /**
   * Verifica si el usuario es HOST
   */
  public isHost(): boolean {
    return this.getUserRole() === 'HOST';
  }

  /**
   * Verifica si el usuario es USER
   */
  public isUser(): boolean {
    return this.getUserRole() === 'USER';
  }

  /**
   * Verifica si el usuario está logueado (alias de isAuthenticated)
   */
  public isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Obtiene los headers HTTP con el token JWT para peticiones autenticadas
   */
  public getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Cierra sesión (alias de clearAuthData)
   */
  public logout(): void {
    this.clearAuthData();
  }

  /**
   * Obtiene información completa del usuario actual
   */
  public getCurrentUser(): { email: string; role: string } | null {
    const decoded = this.decodeToken();
    if (!decoded) return null;

    return {
      email: decoded.sub,
      role: decoded.role
    };
  }

  /**
   * Verifica si el token está próximo a expirar (menos de 5 minutos)
   */
  public isTokenExpiringSoon(): boolean {
    const decoded = this.decodeToken();
    if (!decoded) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - currentTime;
    const fiveMinutes = 5 * 60; // 5 minutos en segundos

    return timeUntilExpiry < fiveMinutes;
  }

  /**
   * Obtiene el tiempo restante hasta que expire el token (en segundos)
   */
  public getTokenTimeRemaining(): number {
    const decoded = this.decodeToken();
    if (!decoded) return 0;

    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - currentTime);
  }
}