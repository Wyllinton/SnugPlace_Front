import { Injectable } from '@angular/core';
import { EditAccommodationDTO } from '../models/edit-accommodation-dto';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PlaceCardDTO, PlaceDTO } from '../models/place-dto';
import { ResponseDTO } from '../models/response-dto';
import { ResponseListDTO } from '../models/response-list-dto';

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
  
  // URL del backend
  private apiUrl = 'http://localhost:8080/accommodations';

  // Array local para compatibilidad con componentes existentes
  private localPlaces: PlaceDTO[] = [];

  constructor(private http: HttpClient){}

  // ========== MÉTODOS LOCALES (para compatibilidad) ==========

  /**
   * Obtener todos los lugares (local - para compatibilidad)
   */
  public getAll(): PlaceDTO[] {
    console.log('📋 Obteniendo todos los lugares (local)');
    return this.localPlaces;
  }

  /**
   * Obtener un lugar por ID (local - para compatibilidad)
   */
  public get(id: number): PlaceDTO | undefined {
    console.log('🔍 Buscando lugar local por ID:', id);
    return this.localPlaces.find(place => place.id == id);
  }

  /**
   * Guardar lugar (local - para compatibilidad)
   */
  public save(newPlace: PlaceDTO) {
    console.log('💾 Guardando lugar local:', newPlace.title);
    newPlace.id = Math.floor(Math.random() * (5000 + 1));
    this.localPlaces.push(newPlace);
  }

  /**
   * Eliminar lugar (local - para compatibilidad)
   */
  public delete(id: number) {
    console.log('🗑️ Eliminando lugar local ID:', id);
    this.localPlaces = this.localPlaces.filter(place => place.id != id);
  }

  /**
   * Actualizar lugar (local - para compatibilidad)
   */
  public update(id: number, updatedPlace: PlaceDTO) {
    console.log('✏️ Actualizando lugar local ID:', id);
    const indice = this.localPlaces.findIndex(place => place.id == id);
    if (indice != -1) {
      this.localPlaces[indice] = updatedPlace;
    }
  }

  // ========== MÉTODOS BACKEND ==========

  /**
   * Buscar alojamientos con filtros - SOLO BACKEND
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
    console.log('📦 Datos enviados:', filterDTO);

    // USAR EL NUEVO ENDPOINT /cards DEL BACKEND
    return this.http.post<ResponseListDTO<PlaceCardDTO[]>>(`${this.apiUrl}/cards`, filterDTO)
      .pipe(
        map(response => {
          console.log('✅ Respuesta del backend recibida');
          console.log('📊 Respuesta completa:', response);
          console.log('🏠 Datos recibidos:', response.data);
          console.log('❌ Error en respuesta?', response.error);
          console.log('💬 Mensaje:', response.message);
          
          // Verificar si hay datos
          if (!response.data || response.data.length === 0) {
            console.log('⚠️  El backend devolvió un array vacío');
          } else {
            console.log('🎉 Backend devolvió', response.data.length, 'alojamientos');
          }

          // Mapear la respuesta del backend a la estructura esperada
          const mappedData = {
            error: response.error,
            message: response.message,
            data: response.data.map((item: any) => ({
              id: item.id,
              title: item.title,
              city: item.city,
              pricePerNight: item.priceDay, // Mapear priceDay a pricePerNight
              mainImage: item.mainImage?.url || item.mainImage || this.getDefaultImage(),
              averageRating: item.averageRating || 0,
              reviewsCount: item.reviewsCount || 0
            }))
          };
          
          console.log('🔄 Datos mapeados:', mappedData);
          console.log('🔢 Número de alojamientos mapeados:', mappedData.data.length);
          return mappedData;
        }),
        catchError(error => {
          console.error('❌ ERROR CRÍTICO llamando al backend:', error);
          console.log('📞 URL intentada:', `${this.apiUrl}/cards`);
          console.log('🔧 Estado del error:', error.status);
          console.log('📝 Mensaje del error:', error.message);
          
          // Devolver error en lugar de mock
          return of({
            error: true,
            message: 'Error conectando con el servidor: ' + (error.message || 'Desconocido'),
            data: []
          });
        })
      );
  }

  /**
   * Obtener un alojamiento por ID - SOLO BACKEND
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
          // Devolver un ResponseDTO válido
          return of({
            error: true,
            content: null as any
          } as ResponseDTO<PlaceDTO>);
        })
      );
  }

  /**
   * Obtener alojamientos destacados - SOLO BACKEND
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
   * Actualizar accommodation - SOLO BACKEND
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
   * Eliminar alojamiento - SOLO BACKEND
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
   * Verificar disponibilidad - SOLO BACKEND
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
}