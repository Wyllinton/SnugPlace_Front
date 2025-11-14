import { Component, OnInit } from '@angular/core';
import { PlaceCardDTO, PlaceDTO } from '../../models/place-dto';
import Swal from 'sweetalert2';
import { RouterModule } from '@angular/router'; 
import { AccommodationService } from '../../services/accommodations-service';
import { ResponseListDTO } from '../../models/response-list-dto';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-my-places',
  imports: [RouterModule, CurrencyPipe],
  templateUrl: './my-places.html',
  styleUrl: './my-places.css'
})
export class MyPlaces implements OnInit {

  places: PlaceDTO[] = [];
  isLoading: boolean = true;

  constructor(private placesService: AccommodationService) {
  }

  ngOnInit(): void {
    this.loadMyAccommodations();
  }

  private loadMyAccommodations(): void {
    this.isLoading = true;
    this.placesService.getMyAccommodations().subscribe({
      next: (resp: ResponseListDTO<any[]>) => {
        if (!resp.error && resp.data) {
          // Mapear la respuesta del backend a PlaceDTO
          this.places = resp.data.map(accommodation => this.mapAccommodationToPlace(accommodation));
          console.log('✅ Alojamientos del host cargados:', this.places.length);
        } else {
          console.error('Error en la respuesta:', resp.message);
          Swal.fire('Error', 'No se pudieron cargar tus alojamientos', 'error');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando alojamientos:', err);
        this.isLoading = false;
        Swal.fire('Error', 'No se pudieron cargar tus alojamientos', 'error');
      }
    });
  }


  private mapAccommodationToPlace(accommodation: any): PlaceDTO {
    // Extraer URL de la imagen principal
    const mainImageUrl = accommodation.mainImage?.url || '';
    
    return {
      id: accommodation.id,
      title: accommodation.title,
      description: accommodation.description,
      priceDay: accommodation.priceDay,
      guestsCount: accommodation.guestsCount,
      images: mainImageUrl ? [mainImageUrl] : [],
      services: Array.from(accommodation.services || []),
      address: {
        city: accommodation.city,
        address: accommodation.address,
        location: {
          latitude: accommodation.latitude,
          longitude: accommodation.longitude
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
    }).then((result) => {
      if (result.isConfirmed) {
        this.placesService.delete(placeId).subscribe({
          next: (response) => {
            if (!response.error) {
              // Filtrar el alojamiento eliminado de la lista local
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

  // Método para recargar los datos
  public refresh(): void {
    this.loadMyAccommodations();
  }

}