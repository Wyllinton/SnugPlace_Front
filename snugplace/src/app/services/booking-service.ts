import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ResponseDTO } from '../models/response-dto';

export interface CreateBookingDTO {
  idAccommodation: number;
  dateCheckIn: string;
  dateCheckOut: string;
  guestsCount: number;
  notes?: string;
}

export interface BookingDTO {
  id: number;
  idAccommodation: number;
  user: UserResponseDTO;
  dateCheckIn: string;
  dateCheckOut: string;
  guestsCount: number;
  status: string;
  price: number;
  comments?: CommentDTO[];
  isMyOwnBooking: boolean; // NUEVO CAMPO del backend
}

export interface UserResponseDTO {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface CommentDTO {
  id: number;
  content: string;
  rating: number;
  createdAt: string;
  user: UserResponseDTO;
}

export interface FilteredBookingDTO {
  titleAccommodation?: string;
  description?: string;
  dateCheckIn?: string;
  dateCheckOut?: string;
  guestsCount?: number;
  price?: number;
  page?: number;
}

export interface BookingDetailDTO {
  user: UserResponseDTO;
  dateCheckIn: string;
  dateCheckOut: string;
  guestsCount: number;
  status: string;
  price: number;
  createdAt: string;
  comments: CommentDTO[];
}

export interface BookingDetailUserDTO {
  dateCheckIn: string;
  dateCheckOut: string;
  guestsCount: number;
  status: string;
  price: number;
  createdAt: string;
  comments: CommentDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  
  private apiUrl = 'http://snugplace-production.up.railway.app/bookings';

  constructor(private http: HttpClient) {
    console.log('📅 BookingService inicializado');
  }

  createBooking(bookingData: CreateBookingDTO): Observable<ResponseDTO<string>> {
    console.log('📅 ========================================');
    console.log('📅 INICIANDO CREACIÓN DE RESERVA');
    console.log('📅 ========================================');
    
    console.log('📦 Datos de la reserva:', bookingData);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const url = `${this.apiUrl}`;
    console.log('📤 Enviando POST a:', url);

    const jsonPayload = JSON.stringify(bookingData, null, 2);
    console.log('📄 JSON PAYLOAD:');
    console.log(jsonPayload);

    return this.http.post<ResponseDTO<string>>(url, bookingData, { headers })
      .pipe(
        tap(response => {
          console.log('✅ ========================================');
          console.log('✅ RESPUESTA DEL BACKEND EXITOSA');
          console.log('✅ ========================================');
          console.log('📥 Respuesta completa:', response);
        }),
        map(response => {
          if (response.error) {
            console.error('⚠️ Backend retornó error:', response.content);
          }
          return response;
        }),
        catchError(error => {
          console.error('❌ ========================================');
          console.error('❌ ERROR DEL BACKEND');
          console.error('❌ ========================================');
          console.error('📛 Status:', error.status);
          console.error('📛 Status Text:', error.statusText);
          console.error('📛 Error completo:', error);
          console.error('📛 Error body:', error.error);
          
          if (error.error) {
            console.error('📛 Mensaje del backend:', error.error.content || error.error.message);
          }

          let errorMessage = 'Error desconocido al crear reserva';
          
          if (error.error?.content) {
            errorMessage = error.error.content;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          return of({
            error: true,
            content: errorMessage
          } as ResponseDTO<string>);
        })
      );
  }

  getBookingDetail(id: number): Observable<ResponseDTO<BookingDetailUserDTO>> {
    console.log('📋 Obteniendo detalles de reserva ID:', id);
    
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    return this.http.get<ResponseDTO<BookingDetailUserDTO>>(`${this.apiUrl}/${id}/detail-user`, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Detalles de reserva recibidos:', response);
        }),
        catchError(error => {
          console.error('❌ Error obteniendo detalles de reserva:', error);
          
          let errorMessage = 'Error obteniendo detalles de la reserva';
          if (error.error?.content) {
            errorMessage = error.error.content;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          // Para errores, retornamos un ResponseDTO con content null
          return of({
            error: true,
            content: null as any
          } as ResponseDTO<BookingDetailUserDTO>);
        })
      );
  }

  searchFilteredBookings(filters: FilteredBookingDTO): Observable<ResponseDTO<BookingDTO[]>> {
    console.log('🔍 Buscando reservas con filtros:', filters);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<ResponseDTO<BookingDTO[]>>(`${this.apiUrl}`, filters, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Reservas encontradas:', response);
        }),
        catchError(error => {
          console.error('❌ Error buscando reservas:', error);
          
          let errorMessage = 'Error buscando reservas';
          if (error.error?.content) {
            errorMessage = error.error.content;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          // Para errores, retornamos un ResponseDTO con array vacío
          return of({
            error: true,
            content: []
          } as ResponseDTO<BookingDTO[]>);
        })
      );
  }

  cancelBooking(id: number, reason: string): Observable<ResponseDTO<string>> {
    console.log('❌ Cancelando reserva ID:', id, 'Razón:', reason);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const params = new HttpParams().set('reason', reason);

    return this.http.put<ResponseDTO<string>>(`${this.apiUrl}/${id}/cancel`, null, { headers, params })
      .pipe(
        tap(response => {
          console.log('✅ Reserva cancelada:', response);
        }),
        catchError(error => {
          console.error('❌ Error cancelando reserva:', error);
          
          let errorMessage = 'Error cancelando reserva';
          if (error.error?.content) {
            errorMessage = error.error.content;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          return of({
            error: true,
            content: errorMessage
          } as ResponseDTO<string>);
        })
      );
  }

  confirmBooking(id: number): Observable<ResponseDTO<string>> {
    console.log('✅ Confirmando reserva ID:', id);

    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    return this.http.put<ResponseDTO<string>>(`${this.apiUrl}/${id}/confirm`, null, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Reserva confirmada:', response);
        }),
        catchError(error => {
          console.error('❌ Error confirmando reserva:', error);
          
          let errorMessage = 'Error confirmando reserva';
          if (error.error?.content) {
            errorMessage = error.error.content;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          return of({
            error: true,
            content: errorMessage
          } as ResponseDTO<string>);
        })
      );
  }

  cancelBookingByHost(id: number): Observable<ResponseDTO<string>> {
    console.log('🏠 Host cancelando reserva ID:', id);

    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    return this.http.put<ResponseDTO<string>>(`${this.apiUrl}/${id}/cancel-by-host`, null, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Reserva cancelada por host:', response);
        }),
        catchError(error => {
          console.error('❌ Error cancelando reserva como host:', error);
          
          let errorMessage = 'Error cancelando reserva';
          if (error.error?.content) {
            errorMessage = error.error.content;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          return of({
            error: true,
            content: errorMessage
          } as ResponseDTO<string>);
        })
      );
  }

  getMyBookings(): Observable<ResponseDTO<BookingDTO[]>> {
    console.log('📅 Obteniendo mis reservas desde /my-bookings...');
    
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    return this.http.get<ResponseDTO<BookingDTO[]>>(`${this.apiUrl}/my-bookings`, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Respuesta de /my-bookings:', response);
        }),
        catchError(error => {
          console.error('❌ Error obteniendo mis reservas:', error);
          
          let errorMessage = 'Error obteniendo reservas';
          if (error.error?.content) {
            errorMessage = error.error.content;
          }

          return of({
            error: true,
            content: []
          } as ResponseDTO<BookingDTO[]>);
        })
      );
  }

  // Método para hosts (si necesitas detalles específicos de host)
  getBookingDetailHost(id: number): Observable<ResponseDTO<any>> {
    console.log('🏠 Obteniendo detalles de reserva para host ID:', id);
    
    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    return this.http.get<ResponseDTO<any>>(`${this.apiUrl}/${id}/detail`, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Detalles de reserva para host recibidos:', response);
        }),
        catchError(error => {
          console.error('❌ Error obteniendo detalles para host:', error);
          
          let errorMessage = 'Error obteniendo detalles de la reserva';
          if (error.error?.content) {
            errorMessage = error.error.content;
          }

          return of({
            error: true,
            content: null as any
          } as ResponseDTO<any>);
        })
      );
  }
}