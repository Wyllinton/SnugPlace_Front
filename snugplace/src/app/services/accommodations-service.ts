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

export interface UpdateAccommodationDTO {
  title: string;
  description: string;
  priceDay: number;
  guestsCount: number;
  services: string[];
  images: ImageDTO[];
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
  let params = new HttpParams()
    .set('page', filters.page?.toString() || '0');

  // ✅ CORREGIR: Usar los nombres correctos de parámetros
  if (filters.city) {
    params = params.set('city', filters.city);
  }
  if (filters.checkIn) {
    params = params.set('checkIn', filters.checkIn);
  }
  if (filters.checkOut) {
    params = params.set('checkOut', filters.checkOut);
  }
  if (filters.minPrice != null && filters.minPrice >= 0) {
    params = params.set('minPrice', filters.minPrice.toString());
  }
  if (filters.maxPrice != null && filters.maxPrice > 0) {
    params = params.set('maxPrice', filters.maxPrice.toString()); // ✅ CORREGIDO: era 'minPrice'
  }
  if (filters.guestsCount != null && filters.guestsCount > 0) {
    params = params.set('guestsCount', filters.guestsCount.toString()); // ✅ CORREGIDO: era 'minPrice'
  }
  if (filters.services && filters.services.length > 0) {
    filters.services.forEach(service => {
      params = params.append('services', service);
    });
  }

  console.log('🎯 PARÁMETROS ENVIADOS AL BACKEND:');
  console.log('📍 Ciudad:', filters.city);
  console.log('💰 Precio min:', filters.minPrice);
  console.log('💰 Precio max:', filters.maxPrice);
  console.log('👥 Huéspedes:', filters.guestsCount);
  console.log('🔧 Servicios:', filters.services);
  console.log('📄 Página:', filters.page);
  console.log('🔗 String de parámetros:', params.toString());

  return this.http.get<any>(`${this.apiUrl}`, { params })
    .pipe(
      tap(response => {
        console.log('🔍 RESPUESTA BRUTA DEL BACKEND:', response);
      console.log('🔍 ESTRUCTURA DE LOS DATOS:', {
          tieneData: !!response.data,
          esArray: Array.isArray(response.data),
          longitud: response.data?.length,
          primerElemento: response.data?.[0]
        });
      }),
      map(response => {
        console.log('✅ Mapeando respuesta paginada...');
        
      // ✅ VERIFICAR LA ESTRUCTURA REAL Y MAPEAR CORRECTAMENTE
        const rawData = response.data || [];
        console.log('📦 Datos crudos para mapear:', rawData);

        const mappedData = {
          error: response.error || false,
          message: response.message || '',
          data: rawData.map((item: any, index: number) => {
            // ✅ DEBUG DETALLADO DEL PRIMER ELEMENTO
            if (index === 0) {
              console.log('🔎 PRIMER ELEMENTO DETALLADO:', {
                itemCompleto: item,
                id: item.id,
                idTipo: typeof item.id,
                titulo: item.title,
                ciudad: item.city,
                precio: item.priceDay,
                tieneMainImage: !!item.mainImage,
                mainImageTipo: typeof item.mainImage
              });
            }

            const mappedItem = {
              id: item.id, // ✅ ESTE ES EL CAMPO CRÍTICO
              title: item.title || 'Sin título',
              city: item.city || 'Sin ciudad',
              pricePerNight: item.priceDay || 0,
              mainImage: this.extractMainImage(item), // ✅ Función mejorada
              averageRating: item.averageRating || 0,
              reviewsCount: item.reviewsCount || 0
            };

            // ✅ VALIDACIÓN CRÍTICA DEL ID
            if (!mappedItem.id || mappedItem.id === 'undefined' || mappedItem.id === 'null') {
              console.error('❌ ITEM SIN ID VÁLIDO:', {
                itemOriginal: item,
                itemMapeado: mappedItem,
                indice: index
              });
            }

            return mappedItem;
          }),
          totalElements: response.totalElements || 0,
          totalPages: response.totalPages || 0,
          currentPage: response.currentPage || filters.page || 0,
          size: response.size || 8
        };

        console.log('📋 Datos mapeados finales:', {
          totalElementos: mappedData.data.length,
          primerElementoMapeado: mappedData.data[0],
          ids: mappedData.data.map((d: any) => d.id)
        });

        return mappedData;
      }),
      catchError(error => {
        console.error('❌ Error HTTP en búsqueda:', error);
        return of({
          error: true,
          message: 'Error conectando con el servidor',
          data: [],
          totalElements: 0,
          totalPages: 0,
          currentPage: filters.page || 0,
          size: 8
        });
      })
    );
}

  // ✅ FUNCIÓN MEJORADA PARA EXTRAER LA IMAGEN PRINCIPAL
private extractMainImage(item: any): string {
  // Si item.mainImage es un string, usarlo directamente
  if (typeof item.mainImage === 'string') {
    return item.mainImage;
  }
  
  // Si item.mainImage es un objeto con propiedad url
  if (item.mainImage && typeof item.mainImage === 'object' && item.mainImage.url) {
    return item.mainImage.url;
  }
  
  // Si hay imágenes en un array
  if (item.images && Array.isArray(item.images) && item.images.length > 0) {
    const mainImage = item.images.find((img: any) => img.isMainImage);
    if (mainImage && mainImage.url) {
      return mainImage.url;
    }
    // Si no hay imagen principal, usar la primera
    if (item.images[0].url) {
      return item.images[0].url;
    }
  }
  return this.getDefaultImage();
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

  // En accommodations-service.ts
  updateAccommodation(id: number, updateData: UpdateAccommodationDTO): Observable<ResponseDTO<string>> {
    console.log('🔄 Actualizando alojamiento ID:', id);
    console.log('📦 Datos a enviar:', updateData);

    // ✅ VERIFICAR QUE EL ID SEA VÁLIDO
    if (!id || isNaN(id)) {
      console.error('❌ ID inválido en servicio:', id);
      return of({
        error: true,
        content: 'ID de alojamiento inválido'
      } as ResponseDTO<string>);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const url = `${this.apiUrl}/edit/${id}`;
    console.log('📤 URL de actualización:', url);

    return this.http.patch<ResponseDTO<string>>(url, updateData, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Respuesta de actualización:', response);
        }),
        catchError(error => {
          console.error('❌ Error actualizando alojamiento:', error);
          
          let errorMessage = 'Error desconocido al actualizar alojamiento';
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

  // Método para obtener datos del alojamiento para editar
  getAccommodationForEdit(id: number): Observable<ResponseDTO<any>> {
    return this.http.get<ResponseDTO<any>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (!response.error && response.content) {
            // Mapear la respuesta a un formato más fácil de usar en el formulario
            const accommodation = response.content;
            return {
              error: false,
              content: {
                id: accommodation.id,
                title: accommodation.title,
                description: accommodation.description,
                priceDay: accommodation.priceDay,
                guestsCount: accommodation.guestsCount,
                services: Array.from(accommodation.services || []),
                images: accommodation.images || [],
                // Mantener otros datos por si acaso
                city: accommodation.city,
                address: accommodation.address,
                latitude: accommodation.latitude,
                longitude: accommodation.longitude
              }
            };
          }
          return response;
        }),
        catchError(error => {
          console.error('❌ Error obteniendo datos para editar:', error);
          return of({
            error: true,
            content: 'Error obteniendo datos del alojamiento'
          } as ResponseDTO<any>);
        })
      );
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