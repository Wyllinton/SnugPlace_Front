import { Injectable } from '@angular/core';
import { EditAccommodationDTO } from '../models/edit-accommodation-dto';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PlaceCardDTO, PlaceDTO } from '../models/place-dto';
import { ResponseDTO } from '../models/response-dto';
import { ResponseListDTO } from '../models/response-list-dto';
import { AuthService } from './auth-service';
import { AccommodationResponse, CreateAccommodationDTO } from './accommodations-service';

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
export class AccommodationService {
  
  // URL del backend
  private apiUrl = 'http://localhost:8080/accommodations';

  // Array local para compatibilidad con componentes existentes
  private localPlaces: PlaceDTO[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Obtiene los headers con autenticación JWT
   */
  private getAuthHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

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
   * Crea un nuevo alojamiento
   * @param accommodationData Datos del alojamiento a crear
   * @returns Observable con la respuesta del backend
   */
  createAccommodation(accommodationData: CreateAccommodationDTO): Observable<AccommodationResponse> {
    const headers = this.getAuthHeaders();
    
    console.log('🚀 Enviando petición POST a:', `${this.apiUrl}/create`);
    console.log('📋 Headers:', headers);
    console.log('📦 Body:', accommodationData);
    
    return this.http.post<AccommodationResponse>(
      `${this.apiUrl}/create`,
      accommodationData,
      { headers }
    );
  }

  /**
   * Obtiene los alojamientos del host autenticado
   * @param page Número de página (default 0)
   * @returns Observable con la lista de alojamientos
   */
  getMyAccommodations(page: number = 0): Observable<any> {
    const headers = this.getAuthHeaders();
    
    return this.http.get(
      `${this.apiUrl}/my-accomodations?page=${page}`,
      { headers }
    );
  }

  /**
   * Verifica si un alojamiento está disponible en las fechas especificadas
   * @param id ID del alojamiento
   * @param checkIn Fecha de check-in (formato: yyyy-MM-dd)
   * @param checkOut Fecha de check-out (formato: yyyy-MM-dd)
   * @returns Observable con la respuesta de disponibilidad
   */
  checkAvailability(id: number, checkIn: string, checkOut: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/${id}/availability?checkIn=${checkIn}&checkOut=${checkOut}`
    );
  }

  /**
   * Obtiene los detalles de un alojamiento
   * @param id ID del alojamiento
   * @returns Observable con los detalles del alojamiento
   */
  getAccommodationDetails(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene tarjetas de alojamientos con filtros
   * @param filters Filtros a aplicar
   * @returns Observable con las tarjetas de alojamientos
   */
  getAccommodationCards(filters?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/cards`, filters || {});
  }

  /**
   * Obtiene los comentarios de un alojamiento
   * @param id ID del alojamiento
   * @returns Observable con los comentarios
   */
  getAccommodationComments(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/comments`);
  }

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
   * Actualiza un alojamiento existente
   * @param id ID del alojamiento
   * @param updateData Datos a actualizar
   * @returns Observable con la respuesta
   */
  updateAccommodation(id: number, updateData: any): Observable<AccommodationResponse> {
    const headers = this.getAuthHeaders();
    
    return this.http.patch<AccommodationResponse>(
      `${this.apiUrl}/edit/${id}`,
      updateData,
      { headers }
    );
  }

  /**
   * Elimina (soft delete) un alojamiento
   * @param id ID del alojamiento
   * @returns Observable con la respuesta
   */
  deleteAccommodation(id: number): Observable<AccommodationResponse> {
    const headers = this.getAuthHeaders();
    
    return this.http.delete<AccommodationResponse>(
      `${this.apiUrl}/${id}`,
      { headers }
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

  /**
   * Busca alojamientos con filtros avanzados
   * @param filters Objeto con los filtros de búsqueda
   * @returns Observable con los resultados
   */
  searchAccommodations(filters: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.get(
      `${this.apiUrl}`,
      { 
        headers,
        params: this.buildQueryParams(filters)
      }
    );
  }

  /**
   * Construye los parámetros de consulta para la búsqueda
   * @param filters Filtros de búsqueda
   * @returns Objeto con los parámetros
   */
  private buildQueryParams(filters: any): any {
    const params: any = {};
    
    if (filters.city) params.city = filters.city;
    if (filters.checkIn) params.checkIn = filters.checkIn;
    if (filters.checkOut) params.checkOut = filters.checkOut;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.guestsCount) params.guestsCount = filters.guestsCount;
    if (filters.services && filters.services.length > 0) {
      params.services = filters.services.join(',');
    }
    if (filters.page !== undefined) params.page = filters.page;
    
    return params;
  }
}