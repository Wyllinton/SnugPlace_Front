import { Injectable } from '@angular/core';
import { EditAccommodationDTO } from '../models/edit-accommodation-dto';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PlaceCardDTO, PlaceDTO } from '../models/place-dto';
import { ResponseDTO } from '../models/response-dto';
import { ResponseListDTO } from '../models/response-list-dto';

// Interfaces unificadas
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

export interface CreateAccommodationDTO {
  title: string;
  description: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  priceDay: number;
  guestsCount: number;
  services: string[];
  images: ImageDTO[];
}

export interface ImageDTO {
  url: string;
  cloudinaryId: string;
  isMainImage: boolean;
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
  
  // URL del backend
  private apiUrl = 'http://localhost:8080/accommodations';
  
  // Array local para compatibilidad con componentes existentes (SOLO DESARROLLO)
  private localAccommodations: PlaceDTO[] = this.createTestAccommodations();

  constructor(private http: HttpClient) {}

  // ========== MÉTODOS LOCALES (para compatibilidad - solo desarrollo) ==========

  /**
   * Obtener todos los alojamientos (local - para compatibilidad)
   * @deprecated Usar métodos del backend en su lugar
   */
  public getAll(): PlaceDTO[] {
    console.log('📋 Obteniendo todos los alojamientos (local)');
    return this.localAccommodations;
  }

  /**
   * Obtener un alojamiento por ID (local - para compatibilidad)
   * @deprecated Usar getAccommodationById en su lugar
   */
  public get(id: number): PlaceDTO | undefined {
    console.log('🔍 Buscando alojamiento local por ID:', id);
    return this.localAccommodations.find(accommodation => accommodation.id == id);
  }

  /**
   * Guardar alojamiento (local - para compatibilidad)
   * @deprecated Usar createAccommodation en su lugar
   */
  public save(newAccommodation: PlaceDTO) {
    console.log('💾 Guardando alojamiento local:', newAccommodation.title);
    newAccommodation.id = Math.floor(Math.random() * (5000 + 1));
    this.localAccommodations.push(newAccommodation);
  }

  /**
   * Eliminar alojamiento (local - para compatibilidad)
   * @deprecated Usar deleteAccommodation en su lugar
   */
  public delete(id: number) {
    console.log('🗑️ Eliminando alojamiento local ID:', id);
    this.localAccommodations = this.localAccommodations.filter(accommodation => accommodation.id != id);
  }

  /**
   * Actualizar alojamiento (local - para compatibilidad)
   * @deprecated Usar updateAccommodation en su lugar
   */
  public update(id: number, updatedAccommodation: PlaceDTO) {
    console.log('✏️ Actualizando alojamiento local ID:', id);
    const indice = this.localAccommodations.findIndex(accommodation => accommodation.id == id);
    if (indice != -1) {
      this.localAccommodations[indice] = updatedAccommodation;
    }
  }

  // ========== MÉTODOS BACKEND (PRODUCCIÓN) ==========

  /**
   * Buscar alojamientos con filtros - BACKEND
   */
  searchFilteredAccommodations(filters: SearchFilters): Observable<ResponseListDTO<PlaceCardDTO[]>> {
    console.log('🔍 Buscando alojamientos con filtros:', filters);
    
    const filterDTO = {
      city: filters.city,
      checkIn: filters.checkIn,
      checkOut: filters.checkOut,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      guestsCount: filters.guestsCount,
      services: filters.services,
      page: filters.page || 0,
      size: filters.size || 12
    };

    console.log('🚀 CONECTANDO AL BACKEND REAL');
    console.log('📤 Enviando petición a:', `${this.apiUrl}/cards`);

    return this.http.post<ResponseListDTO<PlaceCardDTO[]>>(`${this.apiUrl}/cards`, filterDTO)
      .pipe(
        map(response => {
          console.log('✅ Respuesta del backend recibida');
          console.log('🎉 Backend devolvió', response.data?.length || 0, 'alojamientos');

          // Mapear la respuesta del backend a la estructura esperada
          const mappedData = {
            error: response.error,
            message: response.message,
            data: response.data ? response.data.map((item: any) => ({
              id: item.id,
              title: item.title,
              city: item.city,
              pricePerNight: item.priceDay,
              mainImage: item.mainImage?.url || item.mainImage || this.getDefaultImage(),
              averageRating: item.averageRating || 0,
              reviewsCount: item.reviewsCount || 0
            })) : []
          };
          
          return mappedData;
        }),
        catchError(error => {
          console.error('❌ ERROR llamando al backend:', error);
          return of({
            error: true,
            message: 'Error conectando con el servidor: ' + (error.message || 'Desconocido'),
            data: []
          });
        })
      );
  }

  /**
   * Obtener un alojamiento por ID - BACKEND
   */
  getAccommodationById(id: number): Observable<ResponseDTO<PlaceDTO>> {
    console.log('🔍 Obteniendo alojamiento por ID:', id);
    
    return this.http.get<ResponseDTO<PlaceDTO>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          console.log('✅ Detalles del alojamiento recibidos:', response);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error obteniendo alojamiento:', error);
          return of({
            error: true,
            content: null as any
          } as ResponseDTO<PlaceDTO>);
        })
      );
  }

  /**
   * Obtener alojamientos destacados - BACKEND
   */
  getFeaturedAccommodations(): Observable<ResponseListDTO<PlaceCardDTO[]>> {
    console.log('⭐ Obteniendo alojamientos destacados');
    
    const emptyFilters: SearchFilters = {
      page: 0,
      size: 12
    };
    return this.searchFilteredAccommodations(emptyFilters);
  }

  /**
   * Actualizar accommodation - BACKEND
   */
  updateAccommodation(id: number, updateData: EditAccommodationDTO): Observable<ResponseDTO<string>> {
    console.log('✏️ Actualizando alojamiento:', id);
    
    return this.http.patch<ResponseDTO<string>>(`${this.apiUrl}/edit/${id}`, updateData)
      .pipe(
        map(response => {
          console.log('✅ Alojamiento actualizado:', response);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error actualizando alojamiento:', error);
          throw error;
        })
      );
  }

  /**
   * Eliminar alojamiento - BACKEND
   */
  deleteAccommodation(id: number): Observable<ResponseDTO<string>> {
    console.log('🗑️ Eliminando alojamiento:', id);
    
    return this.http.delete<ResponseDTO<string>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          console.log('✅ Alojamiento eliminado:', response);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error eliminando alojamiento:', error);
          throw error;
        })
      );
  }

  /**
   * Verificar disponibilidad - BACKEND
   */
  verifyAvailability(id: number, checkIn: string, checkOut: string): Observable<any> {
    console.log('📅 Verificando disponibilidad para alojamiento:', id);
    
    const params = new HttpParams()
      .set('checkIn', checkIn)
      .set('checkOut', checkOut);

    return this.http.get(`${this.apiUrl}/${id}/availability`, { params })
      .pipe(
        map(response => {
          console.log('✅ Disponibilidad verificada:', response);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error verificando disponibilidad:', error);
          throw error;
        })
      );
  }

  /**
   * Crear nuevo alojamiento - BACKEND
   */
  createAccommodation(accommodationData: CreateAccommodationDTO): Observable<any> {
    console.log('🏠 Creando nuevo alojamiento');
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}`, accommodationData, { headers })
      .pipe(
        map(response => {
          console.log('✅ Alojamiento creado:', response);
          return response;
        }),
        catchError(error => {
          console.error('❌ Error creando alojamiento:', error);
          throw error;
        })
      );
  }

  /**
   * Buscar alojamientos con parámetros GET (alternativa)
   */
  searchAccommodations(filters: SearchFilters): Observable<PageResponse<PlaceCardDTO>> {
    let params = new HttpParams();

    // Agregar parámetros solo si tienen valor
    if (filters.city) {
      params = params.set('city', filters.city);
    }
    if (filters.checkIn) {
      params = params.set('checkIn', filters.checkIn);
    }
    if (filters.checkOut) {
      params = params.set('checkOut', filters.checkOut);
    }
    if (filters.minPrice !== null && filters.minPrice !== undefined) {
      params = params.set('minPrice', filters.minPrice.toString());
    }
    if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
      params = params.set('maxPrice', filters.maxPrice.toString());
    }
    if (filters.guestsCount !== null && filters.guestsCount !== undefined) {
      params = params.set('guestsCount', filters.guestsCount.toString());
    }
    if (filters.services && filters.services.length > 0) {
      filters.services.forEach(service => {
        params = params.append('services', service);
      });
    }
    
    // Paginación
    params = params.set('page', (filters.page || 0).toString());
    params = params.set('size', (filters.size || 10).toString());

    return this.http.get<PageResponse<PlaceCardDTO>>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Obtener servicios disponibles
   */
  public getAvailableServices(): string[] {
    return [
      'WIFI',
      'KITCHEN',
      'AIR_CONDITIONING',
      'HEATING',
      'WASHING_MACHINE',
      'DRYER',
      'PARKING',
      'POOL',
      'GYM',
      'BREAKFAST_INCLUDED',
      'PET_FRIENDLY',
      'TV',
      'WORKSPACE',
      'FIRE_EXTINGUISHER',
      'FIRST_AID_KIT'
    ];
  }

  // Método auxiliar para obtener imagen por defecto
  private getDefaultImage(): string {
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop';
  }

  // Datos de prueba para desarrollo
  private createTestAccommodations(): PlaceDTO[] {
    return [
      {
        id: 1,
        title: 'Casa de Campo El Roble',
        description: 'Hermosa casa campestre con vista a las montañas y chimenea.',
        images: [
          'https://example.com/images/campo1.jpg',
          'https://example.com/images/campo2.jpg'
        ],
        services: ['WIFI', 'KITCHEN', 'PARKING'],
        maxGuests: 6,
        pricePerNight: 250000,
        hostId: 'host_001',
        address: {
          city: 'Manizales',
          address: 'Vereda El Rosario, km 5 vía Neira',
          location: { latitude: 5.0703, longitude: -75.5138 }
        }
      },
      {
        id: 2,
        title: 'Apartamento Moderno en el Centro',
        description: 'Apartamento completamente amoblado, ideal para estancias cortas.',
        images: [
          'https://example.com/images/apto1.jpg',
          'https://example.com/images/apto2.jpg'
        ],
        services: ['WIFI', 'AIR_CONDITIONING', 'TV'],
        maxGuests: 3,
        pricePerNight: 180000,
        hostId: 'host_002',
        address: {
          city: 'Bogotá',
          address: 'Carrera 7 #45-20, Chapinero',
          location: { latitude: 4.6486, longitude: -74.0635 }
        }
      },
      {
        id: 3,
        title: 'Cabaña frente al Lago',
        description: 'Relájate en una cabaña frente al lago con acceso directo al muelle.',
        images: [
          'https://res.cloudinary.com/ddm5k1z0t/image/upload/v1760159810/app_name/k95km5l1guvyscl6byvs.png'
        ],
        services: ['WIFI', 'KITCHEN', 'WORKSPACE'],
        maxGuests: 4,
        pricePerNight: 300000,
        hostId: 'host_003',
        address: {
          city: 'Guatapé',
          address: 'Orilla del embalse, sector El Peñol',
          location: { latitude: 4.554343307684577, longitude: -75.6603681833535 }
        }
      }
    ];
  }
}