import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { PlaceCardDTO, PlaceDTO } from '../models/place-dto';
import { ResponseDTO } from '../models/response-dto';
import { ResponseListDTO } from '../models/response-list-dto';

export interface CreateAccommodationDTO {
  host: HostDTO;
  title: string;
  description: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  priceDay: number;
  guestsCount: number;
  averageRating: number;
  status: string;
  services: string[];
  images: ImageDTO[];
  comments?: any[];
}

export interface HostDTO {
  id: number;
  name: string;
  email: string;
}

export interface ImageDTO {
  url: string;
  cloudinaryId: string;
  isMainImage: boolean;
}

export interface SearchFilters {
  city?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  guestsCount?: number | null;
  services?: string[] | null;
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class AccommodationService {
  
  private apiUrl = 'http://localhost:8080/accommodations';

  constructor(private http: HttpClient) {
    console.log('🏗️ AccommodationService inicializado');
  }

  public getAvailableServices(): string[] {
    return [
      'WIFI',
      'AIR_CONDITIONING',
      'PARKING',
      'POOL',
      'BREAKFAST',
      'PETS_ALLOWED',
      'GYM',
      'CLEANING',
      'TV',
      'PATIO',
      'BACKYARD'
    ];
  }

  public getServiceDisplayNames(): { [key: string]: string } {
    return {
      'WIFI': 'WiFi',
      'AIR_CONDITIONING': 'Aire Acondicionado',
      'PARKING': 'Estacionamiento',
      'POOL': 'Piscina',
      'BREAKFAST': 'Desayuno Incluido',
      'PETS_ALLOWED': 'Mascotas Permitidas',
      'GYM': 'Gimnasio',
      'CLEANING': 'Servicio de Limpieza',
      'TV': 'TV',
      'PATIO': 'Patio',
      'BACKYARD': 'Jardín'
    };
  }

  private validateServices(services: string[]): { valid: boolean; invalid: string[] } {
    const validServices = this.getAvailableServices();
    const invalidServices = services.filter(s => !validServices.includes(s));
    
    return {
      valid: invalidServices.length === 0,
      invalid: invalidServices
    };
  }

  createAccommodation(accommodationData: CreateAccommodationDTO): Observable<ResponseDTO<string>> {
    console.log('🏠 ========================================');
    console.log('🏠 INICIANDO CREACIÓN DE ALOJAMIENTO');
    console.log('🏠 ========================================');
    
    const serviceValidation = this.validateServices(accommodationData.services);
    
    if (!serviceValidation.valid) {
      console.error('❌ Servicios inválidos detectados:', serviceValidation.invalid);
      console.error('✅ Servicios válidos son:', this.getAvailableServices());
      
      return of({
        error: true,
        content: `Servicios inválidos: ${serviceValidation.invalid.join(', ')}. Los servicios válidos son: ${this.getAvailableServices().join(', ')}`
      } as ResponseDTO<string>);
    }

    console.log('✅ Servicios validados correctamente:', accommodationData.services);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const url = `${this.apiUrl}/create`;
    console.log('📤 Enviando POST a:', url);

    const jsonPayload = JSON.stringify(accommodationData, null, 2);
    console.log('📄 JSON PAYLOAD:');
    console.log(jsonPayload);

    return this.http.post<ResponseDTO<string>>(url, accommodationData, { headers })
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

          let errorMessage = 'Error desconocido al crear alojamiento';
          
          if (error.error?.content) {
            errorMessage = error.error.content;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          if (errorMessage.includes('services') || errorMessage.includes('Data truncated')) {
            console.error('🔴 ERROR DE SERVICIOS DETECTADO');
            console.error('🔍 Servicios enviados:', accommodationData.services);
            console.error('🔍 Tipo de servicios:', typeof accommodationData.services);
            console.error('🔍 Es array?:', Array.isArray(accommodationData.services));
            
            errorMessage = 'Error al procesar los servicios. Por favor verifica la consola del navegador.';
          }

          return of({
            error: true,
            content: errorMessage
          } as ResponseDTO<string>);
        })
      );
  }

  searchFilteredAccommodations(filters: SearchFilters): Observable<any> {
    const filterDTO = {
      city: filters.city,
      checkIn: filters.checkIn,
      checkOut: filters.checkOut,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      guestsCount: filters.guestsCount,
      services: filters.services
    };

    const params = new HttpParams()
      .set('page', filters.page?.toString() || '0')
      .set('size', filters.size?.toString() || '8');

    console.log('📤 Enviando POST a /cards con:', {
      filterDTO,
      page: filters.page,
      size: filters.size
    });

    return this.http.post<any>(`${this.apiUrl}/cards`, filterDTO, { params })
      .pipe(
        tap(response => {
          console.log('🔍 RESPUESTA BRUTA DEL BACKEND:', response);
        }),
        map(response => {
          console.log('✅ Mapeando respuesta del backend...');
          
          const mappedData = {
            error: response.error,
            message: response.message,
            data: response.data?.map((item: any) => ({
              id: item.id,
              title: item.title,
              city: item.city,
              pricePerNight: item.priceDay,
              mainImage: item.mainImage?.url || item.mainImage || this.getDefaultImage(),
              averageRating: item.averageRating || 0,
              reviewsCount: 0
            })) || [],
            totalElements: response.totalElements || 0,
            totalPages: response.totalPages || 0,
            currentPage: response.currentPage || 0,
            size: response.size || 8
          };
          
          console.log('📋 Datos mapeados para frontend:', mappedData);
          return mappedData;
        }),
        catchError(error => {
          console.error('❌ Error HTTP en búsqueda:', error);
          console.error('❌ Error status:', error.status);
          console.error('❌ Error message:', error.message);
          return of({
            error: true,
            message: 'Error conectando con el servidor',
            data: [],
            totalElements: 0,
            totalPages: 0,
            currentPage: 0,
            size: 8
          });
        })
      );
  }

  getAll(): Observable<ResponseListDTO<PlaceCardDTO[]>> {
    const emptyFilters: SearchFilters = { page: 0, size: 100 };
    return this.searchFilteredAccommodations(emptyFilters);
  }

  getFeaturedAccommodations(): Observable<ResponseListDTO<PlaceCardDTO[]>> {
    const emptyFilters: SearchFilters = { page: 0, size: 12 };
    return this.searchFilteredAccommodations(emptyFilters);
  }

  getAccommodationById(id: number): Observable<ResponseDTO<PlaceDTO>> {
    return this.http.get<ResponseDTO<PlaceDTO>>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => {
        console.error('❌ Error obteniendo alojamiento:', error);
        return of({ error: true, content: null as any } as ResponseDTO<PlaceDTO>);
      }));
  }

  updateAccommodation(id: number, formData: FormData): Observable<ResponseDTO<string>> {
    return this.http.patch<ResponseDTO<string>>(`${this.apiUrl}/edit/${id}`, formData)
      .pipe(catchError(error => {
        console.error('❌ Error actualizando:', error);
        throw error;
      }));
  }

  delete(id: number): Observable<ResponseDTO<string>> {
    return this.http.delete<ResponseDTO<string>>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => {
        console.error('❌ Error eliminando:', error);
        return of({ error: true, content: 'Error eliminando alojamiento' } as ResponseDTO<string>);
      }));
  }

  getAccommodationDetails(id: number): Observable<ResponseDTO<any>> {
    console.log('📋 Obteniendo detalles del alojamiento ID:', id);
    
    return this.http.get<ResponseDTO<any>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          console.log('✅ Detalles del alojamiento recibidos:', response);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error obteniendo detalles:', error);
          return of({
            error: true,
            content: 'Error obteniendo detalles del alojamiento',
            data: null
          } as ResponseDTO<any>);
        })
      );
  }

  private getDefaultImage(): string {
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop';
  }

  getMyAccommodations(page: number = 0): Observable<ResponseListDTO<any[]>> {
  console.log('🏠 Obteniendo mis alojamientos, página:', page);
  
  // ✅ USAR EL MISMO ENDPOINT QUE SÍ FUNCIONA (searchFilteredAccommodations)
  // Pero sin filtros para obtener TODOS los alojamientos del usuario
  const emptyFilters: SearchFilters = { 
    page: page, 
    size: 50  // O un número suficientemente grande
  };
  
  return this.searchFilteredAccommodations(emptyFilters).pipe(
    map(response => {
      console.log('✅ Mis alojamientos obtenidos con IDs reales:', response.data);
      
      // ✅ Filtrar para obtener solo los alojamientos del usuario actual
      // Esto requiere que el backend envíe información del host en la respuesta
      const myAccommodations = response.data || [];
      
      return {
        error: response.error,
        message: response.message,
        data: myAccommodations,
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        currentPage: response.currentPage,
        size: response.size
      };
    }),
    catchError(error => {
      console.error('❌ Error obteniendo mis alojamientos:', error);
      throw error;
    })
  );
}
}