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
  private mapInitialized = false; // ✅ Controlar si el mapa ya fue inicializado

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

    this.accommodationService.getAccommodationById(id).subscribe({
      next: (response) => {
        console.log('✅ Respuesta COMPLETA del backend:', response);
        
        if (!response.error && response.content) {
          this.place = this.mapAccommodationToPlace(response.content);
          console.log('🏡 Alojamiento cargado después de mapping:', this.place);
          
          // ✅ Inicializar el mapa después de un delay para asegurar que el DOM esté listo
          setTimeout(() => {
            this.initializeMapWithPlaceLocation();
          }, 300);
          
        } else {
          this.error = typeof response.content === 'string'
            ? response.content
            : 'Error al cargar los detalles del alojamiento';
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

  ngAfterViewInit(): void {
    // ✅ Si los datos ya están cargados, inicializar el mapa
    if (this.place && !this.mapInitialized) {
      setTimeout(() => {
        this.initializeMapWithPlaceLocation();
      }, 300);
    }
  }

  private initializeMapWithPlaceLocation(): void {
    if (!this.place) {
      console.warn('⚠️ No hay datos del alojamiento para inicializar el mapa');
      return;
    }

    // ✅ Evitar inicializar múltiples veces
    if (this.mapInitialized) {
      console.log('🗺️ El mapa ya fue inicializado');
      return;
    }

    console.log('🗺️ Inicializando mapa con ubicación:', this.place.address);
    
    const latitude = this.place.address.location.latitude;
    const longitude = this.place.address.location.longitude;

    console.log('📍 Coordenadas:', { latitude, longitude });

    // ✅ Destruir mapa existente antes de crear uno nuevo
    this.mapService.destroyMap();

    // ✅ Construir el mapa - IMPORTANTE: usar los mismos parámetros que en accommodation-detail
    this.mapService.buildMap('map'); // ✅ Sin el segundo parámetro 'false'

    // ✅ Delay para asegurar que el mapa se renderice correctamente
    setTimeout(() => {
      this.mapService.setCenter(longitude, latitude);
      this.mapService.setZoom(15);
      this.mapService.addMarker(longitude, latitude, this.place?.title || 'Alojamiento');
      this.mapInitialized = true; // ✅ Marcar como inicializado
      console.log('✅ Mapa inicializado correctamente');
    }, 500);
  }

  ngOnDestroy(): void {
    this.mapService.destroyMap();
    this.mapInitialized = false;
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
    console.log('📅 Intentando navegar a creación de reserva...');
    console.log('🏠 Place actual:', this.place);
    console.log('🔢 PlaceId actual:', this.placeId);

    // Usar placeId como respaldo si place es null
    const accommodationId = this.place?.id || this.placeId;

    if (!accommodationId || accommodationId === 0) {
      console.error('❌ No se pudo obtener el ID del alojamiento');
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cargar la información del alojamiento. Por favor, recarga la página.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    console.log('📍 Navegando a bookings/create con ID:', accommodationId);
    
    // Navegar a la página de creación de reserva
    this.router.navigate(['/bookings/create', accommodationId]);
  }
}