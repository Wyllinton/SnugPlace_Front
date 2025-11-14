import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { TokenService } from '../services/token-service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  console.log('🔐 === INTERCEPTOR INICIADO ===');
  console.log('🔐 URL:', req.url);
  console.log('🔐 Método:', req.method);
  console.log('🔐 isLogged():', tokenService.isLogged());

  // Clonar la petición y agregar el token si existe
  let authReq = req;
  if (tokenService.isLogged()) {
    const token = tokenService.getToken();
    console.log('🔐 Token encontrado:', token ? `SÍ (${token.substring(0, 20)}...)` : 'NO');
    
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('🔐 Headers agregados:', authReq.headers.keys());
    console.log('🔐 Header Authorization:', authReq.headers.get('Authorization'));
  } else {
    console.log('🔐 Usuario NO logueado, enviando petición sin token');
  }

  console.log('🔐 === ENVIANDO PETICIÓN ===');

  // Enviar la petición y manejar errores
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('❌ === ERROR HTTP ===');
      console.error('❌ Status:', error.status);
      console.error('❌ URL:', error.url);
      console.error('❌ Mensaje:', error.message);
      console.error('❌ Error completo:', error);
      
      if (error.status === 401) {
        console.log('🔐 Error 401 - Token inválido o expirado');
        Swal.fire({
          title: 'Sesión expirada',
          text: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
          icon: 'warning',
          confirmButtonText: 'Ir al login'
        }).then(() => {
          tokenService.logout();
          router.navigate(['/login']);
        });
      } else if (error.status === 403) {
        console.log('🔐 Error 403 - Acceso denegado');
        Swal.fire({
          title: 'Acceso denegado',
          text: 'No tienes permisos para realizar esta acción',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      } else if (error.status === 500) {
        console.log('🔐 Error 500 - Error del servidor');
        // Mostrar el mensaje específico del backend
        const backendMessage = error.error?.content || error.message;
        Swal.fire({
          title: 'Error del servidor',
          text: backendMessage,
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }

      return throwError(() => error);
    })
  );
};