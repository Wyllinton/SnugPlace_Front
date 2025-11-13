import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from './auth-service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener el token
    const token = this.authService.getToken();

    // Clonar la petición y agregar el token si existe
    let authReq = req;
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Enviar la petición y manejar errores
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token inválido o expirado
          Swal.fire({
            title: 'Sesión expirada',
            text: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
            icon: 'warning',
            confirmButtonText: 'Ir al login'
          }).then(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          });
        } else if (error.status === 403) {
          // Acceso denegado
          Swal.fire({
            title: 'Acceso denegado',
            text: 'No tienes permisos para realizar esta acción',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }

        return throwError(() => error);
      })
    );
  }
}