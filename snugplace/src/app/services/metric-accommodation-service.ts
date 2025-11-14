import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ResponseDTO } from '../models/response-dto';

// Interfaces basadas en los DTOs del backend
export interface MetricAccommodationDTO {
  idAccommodation: number;
  title: string;
  startDate: string;
  endDate: string;
  countBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  averageRating: number;
  totalIncomes: number;
}

// CORREGIR: Usar los mismos nombres que el backend
export interface MetricRequestDTO {
  firstDate: string;    // ← firstDate en lugar de startDate
  lasDate: string;      // ← lasDate en lugar de lastDate
}

export interface MetricHostDTO {
  totalAccommodations: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  totalComments: number;
  totalBookings: number;
  averageRating: number;
  totalIncomes: number;
}

@Injectable({
  providedIn: 'root'
})
export class MetricService {

  private apiUrl = 'http://localhost:8080/metrics';

  constructor(private http: HttpClient) {
    console.log('📊 MetricService inicializado');
  }

  /**
   * Obtener métricas de un alojamiento específico
   */
  getAccommodationMetric(id: number, firstDate: string, lastDate: string): Observable<ResponseDTO<MetricAccommodationDTO>> {
    console.log('📊 ========================================');
    console.log('📊 SOLICITANDO MÉTRICAS DEL ALOJAMIENTO');
    console.log('📊 ========================================');
    console.log('🏠 ID Alojamiento:', id);
    console.log('📅 Fecha inicio:', firstDate);
    console.log('📅 Fecha fin:', lastDate);

    // Validar que las fechas sean válidas
    if (!firstDate || !lastDate) {
      console.error('❌ Fechas inválidas');
      return of({
        error: true,
        content: 'Las fechas son requeridas' as any
      });
    }

    // Validar que la fecha final no sea anterior a la inicial
    if (new Date(lastDate) < new Date(firstDate)) {
      console.error('❌ Fecha final anterior a fecha inicial');
      return of({
        error: true,
        content: 'La fecha final no puede ser anterior a la fecha inicial' as any
      });
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // CORREGIR: Usar los nombres que espera el backend
    const requestBody: MetricRequestDTO = {
      firstDate: firstDate,    // ← firstDate
      lasDate: lastDate        // ← lasDate (con "s")
    };

    const url = `${this.apiUrl}/accommodations/${id}`;
    console.log('📤 Enviando POST a:', url);
    console.log('📦 Request Body:', requestBody);

    return this.http.post<ResponseDTO<MetricAccommodationDTO>>(url, requestBody, { headers })
      .pipe(
        tap(response => {
          console.log('✅ ========================================');
          console.log('✅ RESPUESTA MÉTRICAS EXITOSA');
          console.log('✅ ========================================');
          console.log('📥 Respuesta completa:', response);
        }),
        map(response => {
          if (response.error) {
            console.error('⚠️ Backend retornó error en content:', response.content);
          } else {
            console.log('📊 Métricas obtenidas correctamente:', response.content);
          }
          return response;
        }),
        catchError(error => {
          console.error('❌ ========================================');
          console.error('❌ ERROR OBTENIENDO MÉTRICAS');
          console.error('❌ ========================================');
          console.error('📛 Status:', error.status);
          console.error('📛 Status Text:', error.statusText);
          console.error('📛 Error completo:', error);
          console.error('📛 Error body:', error.error);
          
          let errorMessage = 'Error desconocido al obtener métricas';
          
          // Manejar diferentes formatos de error
          if (error.error) {
            if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.error.content) {
              errorMessage = error.error.content;
            } else if (error.error.message) {
              errorMessage = error.error.message;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }

          // Si es error 404, el alojamiento no existe
          if (error.status === 404) {
            errorMessage = 'El alojamiento no existe o no se encontró';
          }

          // Retornar un ResponseDTO con error
          return of({
            error: true,
            content: errorMessage as any
          });
        })
      );
  }

  /**
   * Obtener métricas del host (anfitrión)
   */
  getHostMetric(firstDate: string, lastDate: string): Observable<ResponseDTO<MetricHostDTO>> {
    console.log('👤 SOLICITANDO MÉTRICAS DEL HOST');
    console.log('📅 Fecha inicio:', firstDate);
    console.log('📅 Fecha fin:', lastDate);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // CORREGIR: Usar los nombres que espera el backend
    const requestBody: MetricRequestDTO = {
      firstDate: firstDate,    // ← firstDate
      lasDate: lastDate        // ← lasDate (con "s")
    };

    const url = `${this.apiUrl}/metrics/summary`;
    console.log('📤 Enviando POST a:', url);

    return this.http.post<ResponseDTO<MetricHostDTO>>(url, requestBody, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Métricas del host recibidas:', response);
        }),
        catchError(error => {
          console.error('❌ Error obteniendo métricas del host:', error);
          
          let errorMessage = 'Error obteniendo métricas del host';
          if (error.error?.content) {
            errorMessage = error.error.content;
          }

          return of({
            error: true,
            content: errorMessage as any
          });
        })
      );
  }

  /**
   * Validar rango de fechas (SOLO validación básica)
   */
  validateDateRange(startDate: string, endDate: string): { valid: boolean; message: string } {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // SOLO validar que endDate no sea anterior a startDate
    if (end < start) {
      return {
        valid: false,
        message: 'La fecha final no puede ser anterior a la fecha inicial'
      };
    }

    // QUITAR la validación de fechas futuras
    // QUITAR la validación de rango mayor a 1 año

    return {
      valid: true,
      message: 'Rango de fechas válido'
    };
  }

  /**
   * Formatear fecha para el backend (YYYY-MM-DD)
   */
  formatDateForBackend(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Obtener fecha de hace N días
   */
  getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.formatDateForBackend(date);
  }

  /**
   * Obtener fecha actual formateada
   */
  getCurrentDate(): string {
    return this.formatDateForBackend(new Date());
  }

  /**
   * Obtener fecha futura (para permitir seleccionar cualquier fecha)
   */
  getFutureDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return this.formatDateForBackend(date);
  }
}