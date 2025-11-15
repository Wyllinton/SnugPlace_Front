// En accommodation-detail.ts - actualizar el componente

import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { AccommodationService } from '../../services/accommodations-service';
import { PlaceDTO } from '../../models/place-dto';
import Swal from 'sweetalert2';
import { MapService } from '../../services/map-service';

@Component({
  selector: 'app-accommodation-detail',
  imports: [CommonModule, RouterModule, DecimalPipe],
  templateUrl: './accommodation-detail.html',
  styleUrl: './accommodation-detail.css'
})
export class AccommodationDetail implements OnInit, OnDestroy, AfterViewInit {

  placeId: number = 0;
  place: PlaceDTO | undefined;
  selectedImage: string | null = null;
  private mapInitialized = false;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute, 
    private placesServices: AccommodationService,
    private router: Router,
    private mapService: MapService
  ){}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const idParam = params["id"];
      console.log('🔍 ID recibido de la ruta:', idParam);
      
      if (idParam && !isNaN(Number(idParam))) {
        this.placeId = Number(idParam);
        console.log('✅ ID válido en accommodation-detail:', this.placeId);
        this.get(this.placeId);
      } else {
        console.error('❌ ID inválido en accommodation-detail:', idParam);
        Swal.fire('Error', 'ID de alojamiento no válido', 'error');
        this.router.navigate(['/my-places']);
      }
    });
  }

  public get(placeID: number): void {
    console.log('🔍 Iniciando carga del alojamiento ID:', placeID);
    this.isLoading = true;
    
    this.placesServices.getAccommodationDetails(placeID).subscribe({
      next: (resp) => {
        console.log('📥 Respuesta completa de getAccommodationDetails:', resp);
        console.log('🖼️ Imágenes recibidas:', resp.content?.images);
        
        if (!resp.error && resp.content) {
          this.place = this.mapAccommodationToPlace(resp.content);
          console.log('✅ Alojamiento cargado correctamente:', this.place);
          
          // Establecer imagen principal por defecto
          if (this.place.images && this.place.images.length > 0) {
            const mainImage = this.place.images.find(img => img.isMainImage) || this.place.images[0];
            this.selectedImage = mainImage.url;
          }
          
          // Inicializar el mapa después de un delay
          setTimeout(() => {
            this.initializeMapWithPlaceLocation();
          }, 300);
          
        } else {
          console.error('❌ Error en la respuesta:', resp.content);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar el alojamiento',
            icon: 'error'
          });
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Failed fetching place', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el alojamiento',
          icon: 'error'
        });
        this.isLoading = false;
      }
    });
  }

  private mapAccommodationToPlace(accommodation: any): PlaceDTO {
    console.log('🗺️ Haciendo mapping de accommodation a place:', accommodation);
    
    // Manejar imágenes - asegurar que siempre sea un array
    let images: any[] = [];
    if (accommodation.images && Array.isArray(accommodation.images)) {
      images = accommodation.images.map((img: any) => {
        if (typeof img === 'string') {
          return { 
            url: img, 
            cloudinaryId: '', 
            isMainImage: false 
          };
        }
        return img;
      });
    } else if (accommodation.mainImage) {
      // Si hay mainImage pero no array de imágenes
      images = [{
        url: typeof accommodation.mainImage === 'string' 
          ? accommodation.mainImage 
          : accommodation.mainImage.url,
        cloudinaryId: '',
        isMainImage: true
      }];
    }
    
    return {
      id: accommodation.id,
      title: accommodation.title,
      description: accommodation.description,
      priceDay: accommodation.priceDay,
      guestsCount: accommodation.guestsCount,
      images: images,
      services: Array.from(accommodation.services || []),
      address: {
        city: accommodation.city,
        address: accommodation.address,
        location: {
          latitude: accommodation.latitude,
          longitude: accommodation.longitude
        }
      },
      host: accommodation.host || { id: 0, name: 'Anfitrión', email: '' },
      averageRating: accommodation.averageRating || 0,
      reviewsCount: accommodation.reviewsCount || 0
    };
  }

  // Método para cambiar imagen seleccionada
  selectImage(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  // Resto de los métodos se mantienen igual...
  ngAfterViewInit(): void {
    if (this.place && !this.mapInitialized) {
      setTimeout(() => {
        this.initializeMapWithPlaceLocation();
      }, 300);
    }
  }

  private initializeMapWithPlaceLocation(): void {
    if (!this.place?.address?.location) {
      console.warn('No hay ubicación para mostrar en el mapa');
      return;
    }

    if (this.mapInitialized) {
      console.log('🗺️ El mapa ya fue inicializado');
      return;
    }

    const { longitude, latitude } = this.place.address.location;
    console.log('📍 Inicializando mapa en:', latitude, longitude);

    this.mapService.destroyMap();
    this.mapService.buildMap('map');

    setTimeout(() => {
      this.mapService.setCenter(longitude, latitude);
      this.mapService.setZoom(15);
      this.mapService.addMarker(longitude, latitude, this.place?.title);
      this.mapInitialized = true;
      console.log('✅ Mapa inicializado correctamente');
    }, 500);
  }

  ngOnDestroy(): void {
    this.mapService.destroyMap();
    this.mapInitialized = false;
  }

  public onDelete() {
    const idToDelete = this.placeId;
    
    if (!idToDelete || isNaN(idToDelete)) {
      console.error('❌ ID inválido para eliminar:', this.placeId);
      Swal.fire('Error', 'ID de alojamiento no válido', 'error');
      return;
    }

    console.log('🗑️ Intentando eliminar alojamiento ID:', idToDelete);

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
        this.placesServices.delete(idToDelete).subscribe({
          next: (response) => {
            if (!response.error) {
              Swal.fire({
                title: "¡Eliminado!",
                text: "El alojamiento ha sido eliminado correctamente.",
                icon: "success",
                confirmButtonText: "Aceptar"
              }).then(() => {
                this.router.navigate(['/my-places']);
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

  getSafePlaceId(): number {
    return this.placeId;
  }

    handleImageError(event: any): void {
      console.error('❌ Error cargando imagen principal');
      // Usar imagen por defecto
      event.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop';
    }

    handleThumbnailError(event: any, index: number): void {
      console.error(`❌ Error cargando miniatura ${index}`);
      // Usar imagen por defecto para miniatura
      event.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=150&fit=crop';
    }
}