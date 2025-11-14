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

  placeId: string = "";
  place: PlaceDTO | undefined;
  selectedImage: string | null = null;
  private mapInitialized = false;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute, 
    private placesServices: AccommodationService,
    private router: Router,
    private mapService: MapService
  ){
    this.route.params.subscribe( (params) => {
      this.placeId = params["id"];
      console.log('🔍 ID recibido de la ruta:', this.placeId);
      this.get(this.placeId);
    });
  }

  public get(placeID: string): void {
    console.log('🔍 Iniciando carga del alojamiento ID:', placeID);
    this.isLoading = true;
    
    // ✅ USAR EL MÉTODO QUE SÍ FUNCIONA - getAccommodationDetails
    this.placesServices.getAccommodationDetails(+placeID).subscribe({
      next: (resp) => {
        console.log('📥 Respuesta completa de getAccommodationDetails:', resp);
        
        if (!resp.error && resp.content) {
          this.place = this.mapAccommodationToPlace(resp.content);
          console.log('✅ Alojamiento cargado correctamente:', this.place);
          
          // ✅ Inicializar el mapa después de un delay
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
      host: accommodation.host || { id: 0, name: 'Anfitrión', email: '' },
      averageRating: accommodation.averageRating || 0,
      reviewsCount: accommodation.reviewsCount || 0
    };
  }

  ngOnInit(): void {
    // El mapa se inicializará después de cargar los datos del lugar
  }

  ngAfterViewInit(): void {
    // ✅ Si los datos ya están cargados, inicializar el mapa
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

    // ✅ Evitar inicializar múltiples veces
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
        this.placesServices.delete(placeId).subscribe({
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
}