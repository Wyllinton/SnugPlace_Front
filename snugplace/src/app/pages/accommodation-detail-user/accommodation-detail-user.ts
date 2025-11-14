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

  placeId: number = 0;
  place: PlaceDTO | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute, 
    private accommodationService: AccommodationService,
    private router: Router,
    private mapService: MapService
  ) {}

  ngOnInit(): void {
    console.log('🏠 AccommodationDetailUser inicializado');
    
    this.route.params.subscribe((params) => {
      this.placeId = +params['id'];
      console.log('📋 ID del alojamiento recibido:', this.placeId);
      
      if (this.placeId) {
        this.loadAccommodationDetails(this.placeId);
      } else {
        this.error = 'ID de alojamiento no válido';
        this.loading = false;
      }
    });
  }

  public loadAccommodationDetails(id: number): void {
    console.log('🔄 Cargando detalles del alojamiento ID:', id);
    this.loading = true;
    this.error = null;

    this.accommodationService.getAccommodationDetails(id).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del backend:', response);
        
        if (!response.error && response.content) {
          this.place = response.content;
          console.log('🏡 Alojamiento cargado:', this.place);
          this.initializeMapWithPlaceLocation();
        } else {
          this.error = response.content || 'Error al cargar los detalles del alojamiento';
          console.error('❌ Error en respuesta:', this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('💥 Error cargando detalles:', err);
        this.error = 'Error de conexión con el servidor';
        this.loading = false;
        
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los detalles del alojamiento',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.router.navigate(['/home']);
        });
      }
    });
  }

  ngAfterViewInit(): void {
    // El mapa se inicializa después de cargar los datos
  }

  private initializeMapWithPlaceLocation(): void {
    if (!this.place) {
      console.warn('⚠️ No hay datos del alojamiento para inicializar el mapa');
      return;
    }

    console.log('🗺️ Inicializando mapa con ubicación:', this.place.address);
    
    const latitude = this.place.address.location.latitude;
    const longitude = this.place.address.location.longitude;

    console.log('📍 Coordenadas:', { latitude, longitude });

    this.mapService.destroyMap();
    this.mapService.buildMap('map', false);

    setTimeout(() => {
      this.mapService.setCenter(longitude, latitude);
      this.mapService.setZoom(15);
      this.mapService.addMarker(longitude, latitude, this.place?.title || 'Alojamiento');
      console.log('✅ Mapa inicializado correctamente');
    }, 500);
  }

  ngOnDestroy(): void {
    this.mapService.destroyMap();
  }

  getServiceDisplayName(service: string): string {
    const serviceNames: { [key: string]: string } = {
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
    
    return serviceNames[service] || service;
  }

  public onContactHost(): void {
    if (!this.place) return;

    Swal.fire({
      title: `Contactar a ${this.place.host.name}`,
      html: `
        <div style="text-align: left;">
          <p><strong>Anfitrión:</strong> ${this.place.host.name}</p>
          <p><strong>Email:</strong> ${this.place.host.email}</p>
          <p>¿Deseas contactar al anfitrión para hacer preguntas sobre este alojamiento?</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, contactar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#198754',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: '¡Mensaje enviado!',
          text: `Tu mensaje ha sido enviado a ${this.place?.host.name}. Te contactaremos pronto.`,
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  public onAddToFavorites(): void {
    Swal.fire({
      title: '¡Agregado a favoritos!',
      text: 'Este alojamiento ha sido agregado a tus favoritos.',
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#198754'
    });
  }

  public onBookNow(): void {
    Swal.fire({
      title: 'Reservar ahora',
      text: 'Funcionalidad de reserva en desarrollo...',
      icon: 'info',
      confirmButtonText: 'Entendido'
    });
  }
}