import { Injectable } from '@angular/core';
import { EditAccommodationDTO } from '../models/edit-accommodation-dto';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { PlaceCardDTO, PlaceDTO } from '../models/place-dto';


// Interfaz para la respuesta paginada del backend
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // Página actual
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

export interface AccommodationResponse {
  error: boolean;
  content: string;
}

// Interfaz para los filtros de búsqueda
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

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  places: PlaceDTO[];
  
  // Para desarrollo - simular llamadas HTTP
  private apiUrl = 'http://localhost:8080/accommodations';
  private useMock = true; // Cambiar a false cuando el backend esté listo

  constructor(private http: HttpClient){
    this.places = this.createTestPlaces();
  }

  public getAll() {
    return this.places;
  }

  public save(newPlace: PlaceDTO) {
    newPlace.id = Math.floor(Math.random() * (5000 + 1));
    this.places.push(newPlace);
  }

  public get(id: number): PlaceDTO | undefined {
    return this.places.find(place => place.id == id); 
  }

  public delete(id: number) {
    this.places = this.places.filter(place => place.id != id);
  }

  // MÉTODO ORIGINAL (mantener para compatibilidad)
  public update(id: number, updatedPlace: PlaceDTO) {
    const indice = this.places.findIndex(place => place.id == id);
    if (indice != -1) {
      this.places[indice] = updatedPlace;
    }
  }

  // NUEVO MÉTODO: Actualizar accommodation usando el DTO del backend
  public updateAccommodation(id: number, updateData: EditAccommodationDTO): Observable<any> {
    if (this.useMock) {
      // Simulación para desarrollo
      return this.updateAccommodationLocal(id, updateData);
    } else {
      // Implementación real para producción
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });
      return this.http.put(`${this.apiUrl}/${id}`, updateData, { headers });
    }
  }

  // Método auxiliar para actualización local (simulación)
  private updateAccommodationLocal(id: number, updateData: EditAccommodationDTO): Observable<any> {
    return new Observable(observer => {
      try {
        const placeIndex = this.places.findIndex(place => place.id === id);
        
        if (placeIndex !== -1) {
          // Actualizar el lugar existente con los nuevos datos
          const updatedPlace: PlaceDTO = {
            ...this.places[placeIndex],
            title: updateData.title,
            description: updateData.description,
            pricePerNight: updateData.priceDay,
            maxGuests: updateData.guestsCount,
            services: updateData.services,
            images: updateData.images.map(img => img.url)
          };
          
          this.places[placeIndex] = updatedPlace;
          
          observer.next({
            success: true,
            message: 'Alojamiento actualizado exitosamente',
            data: updatedPlace
          });
          observer.complete();
        } else {
          observer.error({
            success: false,
            message: 'Alojamiento no encontrado'
          });
        }
      } catch (error) {
        observer.error({
          success: false,
          message: 'Error al actualizar el alojamiento',
          error: error
        });
      }
    });
  }

    /**
   * Obtiene todos los alojamientos con paginación y filtros
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
      // Enviar servicios como parámetros múltiples
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
   * Obtiene un alojamiento por ID
   */
  getAccommodationById(id: number): Observable<PlaceDTO> {
    return this.http.get<PlaceDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene alojamientos destacados (para mostrar en el home sin filtros)
   */
  getFeaturedAccommodations(page: number = 0, size: number = 12): Observable<PageResponse<PlaceCardDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageResponse<PlaceCardDTO>>(`${this.apiUrl}/featured`, { params });
  }

  // NUEVO MÉTODO: Obtener servicios disponibles
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

  private createTestPlaces() {
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
        title: 'Apartaestudio cerca a Uniquindio',
        description: 'Relájate en una cabaña frente al lago con acceso directo al muelle.',
        images: [
          'https://res.cloudinary.com/ddm5k1z0t/image/upload/v1760159810/app_name/k95km5l1guvyscl6byvs.png',
          'https://example.com/images/lago2.jpg'
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