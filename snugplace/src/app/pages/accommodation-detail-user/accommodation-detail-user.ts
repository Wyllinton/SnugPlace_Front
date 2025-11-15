// En accommodation-detail-user.ts - actualizar el componente

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
  selectedImage: string | null = null;
  private mapInitialized = false;

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
        console.log('🖼️ Imágenes recibidas:', response.content?.images);
        
        if (!response.error && response.content) {
          this.place = this.mapAccommodationToPlace(response.content);
          console.log('🏡 Alojamiento cargado después de mapping:', this.place);
          
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

  // Manejar errores de imágenes
  handleImageError(event: any): void {
    console.error('❌ Error cargando imagen principal');
    event.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop';
  }

  handleThumbnailError(event: any, index: number): void {
    console.error(`❌ Error cargando miniatura ${index}`);
    event.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=150&fit=crop';
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
    if (!this.place) {
      console.warn('⚠️ No hay datos del alojamiento para inicializar el mapa');
      return;
    }

    if (this.mapInitialized) {
      console.log('🗺️ El mapa ya fue inicializado');
      return;
    }

    console.log('🗺️ Inicializando mapa con ubicación:', this.place.address);
    
    const latitude = this.place.address.location.latitude;
    const longitude = this.place.address.location.longitude;

    console.log('📍 Coordenadas:', { latitude, longitude });

    this.mapService.destroyMap();
    this.mapService.buildMap('map');

    setTimeout(() => {
      this.mapService.setCenter(longitude, latitude);
      this.mapService.setZoom(15);
      this.mapService.addMarker(longitude, latitude, this.place?.title || 'Alojamiento');
      this.mapInitialized = true;
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
    console.log('🔢 PlaceId:', this.placeId);

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('🔐 Usuario no autenticado, redirigiendo a login');
      Swal.fire({
        title: 'Iniciar sesión requerido',
        text: 'Debes iniciar sesión para realizar una reserva',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Iniciar sesión',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#198754',
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login'], { 
            queryParams: { 
              returnUrl: this.router.url 
            } 
          });
        }
      });
      return;
    }

    if (!this.placeId || this.placeId === 0) {
      console.error('❌ No se pudo obtener el ID del alojamiento');
      Swal.fire({
        title: 'Error',
        text: 'No se pudo identificar el alojamiento. Por favor, recarga la página.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    console.log('📍 Navegando a bookings/create con ID:', this.placeId);
    this.router.navigate(['/bookings/create', this.placeId]);
  }
}