import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';

// Interfaces basadas en los DTOs del backend
export interface MetricRequestDTO {
  firstDate: string;
  lastDate: string;
}

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

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private apiUrl = 'http://localhost:8080/api/metrics';
  private useMock = true; // Cambiar a false cuando el backend esté listo

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las métricas de alojamientos por período
   * @param request Objeto con fechas de inicio y fin
   * @returns Observable con array de métricas
   */
  public getAccommodationMetrics(request: MetricRequestDTO): Observable<MetricAccommodationDTO[]> {
    if (this.useMock) {
      // Simular llamada HTTP con delay
      return of(this.generateMockMetrics(request.firstDate, request.lastDate)).pipe(
        delay(800) // Simular latencia de red
      );
    } else {
      // Implementación real para cuando conectes el backend
      return this.http.post<MetricAccommodationDTO[]>(
        `${this.apiUrl}/accommodations`,
        request
      );
    }
  }

  /**
   * Obtiene las métricas de un alojamiento específico
   * @param accommodationId ID del alojamiento
   * @param request Objeto con fechas de inicio y fin
   * @returns Observable con métrica del alojamiento
   */
  public getAccommodationMetricById(
    accommodationId: number, 
    request: MetricRequestDTO
  ): Observable<MetricAccommodationDTO> {
    if (this.useMock) {
      const allMetrics = this.generateMockMetrics(request.firstDate, request.lastDate);
      const metric = allMetrics.find(m => m.idAccommodation === accommodationId);
      return of(metric || allMetrics[0]).pipe(delay(500));
    } else {
      return this.http.post<MetricAccommodationDTO>(
        `${this.apiUrl}/accommodations/${accommodationId}`,
        request
      );
    }
  }

  /**
   * Genera métricas de prueba basadas en los alojamientos existentes
   */
  private generateMockMetrics(startDate: string, endDate: string): MetricAccommodationDTO[] {
    // Datos de prueba basados en los 3 alojamientos del PlacesService
    return [
      {
        idAccommodation: 1,
        title: 'Casa de Campo El Roble',
        startDate: startDate,
        endDate: endDate,
        countBookings: 15,
        confirmedBookings: 12,
        cancelledBookings: 2,
        completedBookings: 10,
        averageRating: 4.7,
        totalIncomes: 3000000
      },
      {
        idAccommodation: 2,
        title: 'Apartamento Moderno en el Centro',
        startDate: startDate,
        endDate: endDate,
        countBookings: 22,
        confirmedBookings: 18,
        cancelledBookings: 3,
        completedBookings: 15,
        averageRating: 4.5,
        totalIncomes: 2700000
      },
      {
        idAccommodation: 3,
        title: 'Apartaestudio cerca a Uniquindio',
        startDate: startDate,
        endDate: endDate,
        countBookings: 18,
        confirmedBookings: 15,
        cancelledBookings: 1,
        completedBookings: 14,
        averageRating: 4.9,
        totalIncomes: 4200000
      }
    ];
  }

  /**
   * Obtiene lista de todos los alojamientos para el selector
   * (Puedes usar esto o consumir directamente desde PlacesService)
   */
  public getAllAccommodations(): Observable<{id: number, title: string}[]> {
    if (this.useMock) {
      return of([
        { id: 1, title: 'Casa de Campo El Roble' },
        { id: 2, title: 'Apartamento Moderno en el Centro' },
        { id: 3, title: 'Apartaestudio cerca a Uniquindio' }
      ]);
    } else {
      return this.http.get<{id: number, title: string}[]>(
        'http://localhost:8080/api/accommodations'
      );
    }
  }

  /**
   * Método auxiliar para validar fechas
   */
  public validateDateRange(startDate: string, endDate: string): {valid: boolean, message?: string} {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (start > end) {
      return { valid: false, message: 'La fecha inicial debe ser anterior a la fecha final' };
    }

    if (start > today) {
      return { valid: false, message: 'La fecha inicial no puede ser futura' };
    }

    if (end > today) {
      return { valid: false, message: 'La fecha final no puede ser futura' };
    }

    return { valid: true };
  }
}