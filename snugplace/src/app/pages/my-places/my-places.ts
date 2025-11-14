import { Component, OnInit } from '@angular/core';
import { PlaceDTO } from '../../models/place-dto';
import Swal from 'sweetalert2';
import { RouterModule } from '@angular/router'; 
import { AccommodationService } from '../../services/accommodations-service';
import { ResponseListDTO } from '../../models/response-list-dto';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

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

  constructor(private placesService: AccommodationService) {}

  ngOnInit(): void {
    this.loadMyAccommodations();
  }

  private loadMyAccommodations(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.placesService.getMyAccommodations().subscribe({
      next: (resp: ResponseListDTO<any[]>) => {
        if (!resp.error && resp.data) {
          this.places = resp.data.map(accommodation => this.mapAccommodationToPlace(accommodation));
          console.log('✅ Alojamientos cargados:', this.places.length);
        } else {
          this.errorMessage = resp.message || 'Error al cargar los alojamientos';
          console.error('Error en la respuesta:', resp.message);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando alojamientos:', err);
        this.errorMessage = 'No se pudieron cargar tus alojamientos. Intenta nuevamente.';
        this.isLoading = false;
        Swal.fire('Error', this.errorMessage, 'error');
      }
    });
  }

  private mapAccommodationToPlace(accommodation: any): PlaceDTO {
    const mainImageUrl = accommodation.mainImage?.url || '';
    const images = mainImageUrl ? [mainImageUrl] : [];
    
    // Asegurar que la descripción no sea demasiado larga
    const description = accommodation.description && accommodation.description.length > 100 
      ? accommodation.description.substring(0, 100) + '...' 
      : accommodation.description;

    return {
      id: accommodation.id,
      title: accommodation.title,
      description: description,
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