import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { PlaceDTO } from '../../models/place-dto';
import Swal from 'sweetalert2';
import { MapService } from '../../services/map-service';
import { AccommodationService } from '../../services/accommodations-service';

@Component({
  selector: 'app-accommodation-detail-user',
  imports: [CommonModule, RouterModule, DecimalPipe],
  templateUrl: './accommodation-detail-user.html',
  styleUrls: ['./accommodation-detail-user.css'] 
})
export class AccommodationDetailUser implements OnInit, OnDestroy, AfterViewInit {

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

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeMapWithPlaceLocation();
    }, 300);
  }

  private initializeMapWithPlaceLocation(): void {
    if (!this.place?.address?.location) return;

    const { longitude, latitude } = this.place.address.location;

    this.mapService.buildMap('map');

    setTimeout(() => {
      this.mapService.setCenter(longitude, latitude);
      this.mapService.setZoom(15);
      this.mapService.addMarker(longitude, latitude, this.place?.title);
    }, 1000);
  }

  ngOnDestroy(): void {
    this.mapService.destroyMap();
  }

  public onContactHost() {
    Swal.fire({
      title: 'Contactar Anfitrión',
      text: '¿Deseas contactar al anfitrión para hacer preguntas sobre este alojamiento?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, contactar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#198754',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: '¡Mensaje enviado!',
          text: 'Tu mensaje ha sido enviado al anfitrión. Te contactaremos pronto.',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  public onAddToFavorites() {
    Swal.fire({
      title: '¡Agregado a favoritos!',
      text: 'Este alojamiento ha sido agregado a tus favoritos.',
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#198754'
    });
  }
}