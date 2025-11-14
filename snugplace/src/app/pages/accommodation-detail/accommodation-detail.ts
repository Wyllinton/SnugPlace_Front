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

  constructor(
    private route: ActivatedRoute, 
    private placesServices: AccommodationService,
    private router: Router,
    private mapService: MapService
  ){
    this.route.params.subscribe( (params) => {
      this.placeId = params["id"];
      this.get(this.placeId);
    });
  }

  public get(placeID: string): void {
  this.placesServices.getAccommodationById(+placeID).subscribe({
    next: (resp) => {
      // adjust depending on ResponseDTO shape:
      // if ResponseDTO has `data` with the PlaceDTO:
      this.place = (resp as any).data ?? (resp as unknown as PlaceDTO);
      this.initializeMapWithPlaceLocation();
    },
    error: (err) => {
      console.error('Failed fetching place', err);
    }
  });
}

  ngOnInit(): void {
    // El mapa se inicializará después de cargar los datos del lugar
  }

  ngAfterViewInit(): void {
  // Inicializa el mapa solo después de que el DOM esté listo
  setTimeout(() => {
    this.initializeMapWithPlaceLocation();
  }, 300);
}

  private initializeMapWithPlaceLocation(): void {
  if (!this.place?.address?.location) return;

  const { longitude, latitude } = this.place.address.location;

  // ✅ Crear mapa solo cuando el contenedor esté disponible
  this.mapService.buildMap('map');

  // Espera a que el mapa cargue antes de centrar
  setTimeout(() => {
    this.mapService.setCenter(longitude, latitude);
    this.mapService.setZoom(15);
    this.mapService.addMarker(longitude, latitude, this.place?.title);
  }, 1000);
}

  private addMarkerToMap(lng: number, lat: number): void {
    // Esta función podría estar en tu MapService
    // Por ahora la dejamos aquí como ejemplo
    console.log(`Marcador añadido en: ${lng}, ${lat}`);
    
    // Si tu MapService tiene un método para agregar marcadores, lo usarías aquí:
    // this.mapService.addMarker(lng, lat, this.place?.title);
  }

  ngOnDestroy(): void {
    // Limpiar el mapa cuando el componente se destruya
    this.mapService.destroyMap();
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
        this.placesServices.delete(placeId);
        Swal.fire({
          title: "¡Eliminado!",
          text: "El alojamiento ha sido eliminado correctamente.",
          icon: "success",
          confirmButtonText: "Aceptar"
        }).then(() => {
          this.router.navigate(['/my-places']);
        });
      }
    });
  }
}