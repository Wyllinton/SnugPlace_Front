import { Component, OnInit } from '@angular/core';
import { PlaceDTO } from '../../models/place-dto';
import Swal from 'sweetalert2';
import { RouterModule } from '@angular/router'; 
import { AccommodationService, SearchFilters } from '../../services/accommodations-service';
import { TokenService } from '../../services/token-service';
import { ResponseListDTO } from '../../models/response-list-dto';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-my-places',
  imports: [RouterModule, DecimalPipe],
  templateUrl: './my-places.html',
  styleUrl: './my-places.css'
})
export class MyPlaces implements OnInit {

  places: PlaceDTO[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(private placesService: AccommodationService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.loadMyAccommodations();
  }

  private loadMyAccommodations(): void {
  this.isLoading = true;
  this.errorMessage = '';
  
  console.log('🏠 Cargando mis alojamientos usando searchFilteredAccommodations...');
  
  // ✅ USAR EL MISMO MÉTODO QUE FUNCIONA EN HOME
  const emptyFilters: SearchFilters = { 
    page: 0, 
    size: 100  // Obtener muchos para filtrar
  };
  
  this.placesService.searchFilteredAccommodations(emptyFilters).subscribe({
    next: (response: any) => {
      console.log('✅ Respuesta de searchFilteredAccommodations:', response);
      
      if (!response.error && response.data) {
        // ✅ FILTRAR SOLO LOS ALOJAMIENTOS DEL USUARIO ACTUAL
        // Para esto necesitamos obtener el host de cada alojamiento
        const allAccommodations = response.data;
        
        console.log('🏘️ Todos los alojamientos:', allAccommodations.length);
        
        // Obtener detalles completos de CADA alojamiento para verificar el host
        this.getMyAccommodationsWithOwnerCheck(allAccommodations);
        
      } else {
        this.errorMessage = response.message || 'Error al cargar los alojamientos';
        this.isLoading = false;
      }
    },
    error: (err) => {
      console.error('Error cargando alojamientos:', err);
      this.errorMessage = 'No se pudieron cargar tus alojamientos. Intenta nuevamente.';
      this.isLoading = false;
      Swal.fire('Error', this.errorMessage, 'error');
    }
  });
}

private getMyAccommodationsWithOwnerCheck(allAccommodations: any[]): void {
  const currentUserId = this.tokenService.getUserId();
  
  console.log('👤 Usuario actual ID:', currentUserId);
  console.log('🏘️ Total de alojamientos a verificar:', allAccommodations.length);
  
  // Si no hay alojamientos, terminar aquí
  if (allAccommodations.length === 0) {
    this.places = [];
    this.isLoading = false;
    return;
  }

  // Para cada alojamiento, verificar si el usuario es el owner
  const accommodationChecks = allAccommodations.map(acc => {
    return this.placesService.getAccommodationDetails(acc.id).pipe(
      map(detailsResponse => {
        if (!detailsResponse.error && detailsResponse.content) {
          const accommodationDetails = detailsResponse.content;
          const hostId = Number(accommodationDetails.host?.id);
          const isOwner = hostId === currentUserId;
          
          console.log(`🔍 ${acc.title} - Host ID: ${hostId}, Es owner: ${isOwner}`);
          
          if (isOwner) {
            // Devolver los DETAILS completos, no solo el resumen
            return {
              ...accommodationDetails, // ← Usar los detalles completos
              id: acc.id,
              isOwner: true
            };
          }
        }
        return null; // No es del usuario
      }),
      catchError(error => {
        console.error(`Error verificando ${acc.title}:`, error);
        return of(null);
      })
    );
  });
  
  // Esperar a que todas las verificaciones terminen
  forkJoin(accommodationChecks).subscribe(results => {
    // Filtrar solo los alojamientos del usuario (eliminar nulls)
    const myAccommodations = results.filter(acc => acc !== null);
    
    console.log('🎯 Mis alojamientos finales:', myAccommodations);
    
    // Mapear a PlaceDTO usando los detalles COMPLETOS
    this.places = myAccommodations.map(accommodation => 
      this.mapAccommodationToPlace(accommodation)
    );
    
    this.isLoading = false;
    console.log('✅ Alojamientos cargados:', this.places.length);
  });
}

  private mapAccommodationToPlace(accommodation: any): PlaceDTO {
    console.log('🗺️ Mapeando alojamiento completo:', accommodation);
    
    // ✅ Obtener el ID de diferentes formas posibles
    let id = accommodation.id;
    
    // Si no tiene id directo, buscar en otras propiedades
    if (!id) {
      id = accommodation.accommodationId || accommodation.placeId;
      console.log('🔄 ID obtenido de propiedad alternativa:', id);
    }
    
    // Si aún no tiene ID, generar uno temporal (esto es solo para debugging)
    if (!id) {
      id = Date.now() + Math.random(); // ID temporal único
      console.warn('⚠️ Usando ID temporal:', id);
    }

    const mainImageUrl = accommodation.mainImage?.url || accommodation.mainImage || '';
    const images = mainImageUrl ? [mainImageUrl] : [];
    
    const description = accommodation.description && accommodation.description.length > 100 
      ? accommodation.description.substring(0, 100) + '...' 
      : accommodation.description;

    return {
      id: Number(id), // ✅ Asegurar que sea número
      title: accommodation.title || 'Sin título',
      description: description || 'Sin descripción',
      priceDay: accommodation.priceDay || 0,
      guestsCount: accommodation.guestsCount || 1,
      images: images,
      services: Array.from(accommodation.services || []),
      address: {
        city: accommodation.city || 'Sin ciudad',
        address: accommodation.address || 'Sin dirección',
        location: {
          latitude: accommodation.latitude || 0,
          longitude: accommodation.longitude || 0
        }
      },
      host: accommodation.host?.id || '',
      averageRating: accommodation.averageRating || 0
    };
  }

  public onDelete(placeId: number) {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará permanentemente el alojamiento.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.placesService.delete(placeId).subscribe({
          next: (response) => {
            if (!response.error) {
              this.places = this.places.filter(p => p.id !== placeId);
              Swal.fire({
                title: "¡Eliminado!",
                text: "El alojamiento ha sido eliminado correctamente.",
                icon: "success",
                confirmButtonText: "Aceptar"
              });
            } else {
              Swal.fire('Error', response.content, 'error');
            }
          },
          error: (err) => {
            console.error('Error eliminando:', err);
            Swal.fire('Error', 'No se pudo eliminar el alojamiento', 'error');
          }
        });
      }
    });
  }

  public refresh(): void {
    this.loadMyAccommodations();
  }

  // Método para formatear la fecha si es necesario
  formatDate(date: any): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES');
  }
}