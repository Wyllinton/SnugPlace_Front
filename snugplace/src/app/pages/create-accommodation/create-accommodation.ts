import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MapService } from '../../services/map-service';
import { ImageService, CloudinaryResponse } from '../../services/image-service';
import { CreateAccommodationDTO, ImageDTO } from '../../services/accommodations-service';
import { AuthService } from '../../services/auth-service'; // ✅ USANDO TU SERVICIO EXISTENTE
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AccommodationService } from '../../services/places-service';


interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-create-accommodation',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-accommodation.html',
  styleUrls: ['./create-accommodation.css']
})
export class CreateAccommodation implements OnInit, AfterViewInit, OnDestroy {
  createAccommodationForm!: FormGroup;
  selectedFiles: File[] = [];
  selectedServices: string[] = [];
  
  cities: string[];
  servicesList: string[];

  // Variables para el mapa
  selectedLocation: LocationCoordinates | null = null;
  private locationSubscription?: Subscription;

  // Estado de carga
  isSubmitting = false;
  isUploadingImages = false;

  constructor(
    private formBuilder: FormBuilder,
    private mapService: MapService,
    private imageService: ImageService,
    private accommodationService: AccommodationService,
    private authService: AuthService,
    private router: Router
  ) {
    this.cities = [
      'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 
      'Bucaramanga', 'Pereira', 'Manizales', 'Armenia', 'Santa Marta', 
      'Ibagué', 'Neiva', 'Pasto'
    ];
    
    this.servicesList = [
      'WiFi', 'Desayuno incluido', 'Piscina', 'Aire acondicionado', 
      'Estacionamiento gratuito', 'Gimnasio', 'Admite mascotas', 
      'Servicio de limpieza', 'TV por cable', 'Patio', 'Backyard'
    ];
    
    this.createForm();
  }

  ngOnInit(): void {
    // ✅ Verificar si el usuario está autenticado usando TU servicio
    if (!this.authService.isAuthenticated()) {
      Swal.fire({
        title: 'No autenticado',
        text: 'Debes iniciar sesión para crear alojamientos',
        icon: 'warning',
        confirmButtonText: 'Ir al login'
      }).then(() => {
        this.router.navigate(['/login']);
      });
      return;
    }

    // ✅ Verificar si el usuario es HOST usando TU servicio
    if (!this.authService.isHost()) {
      const userInfo = this.authService.getCurrentUser();
      Swal.fire({
        title: 'Acceso denegado',
        text: `Solo los anfitriones pueden crear alojamientos. Tu rol actual es: ${userInfo?.role || 'No definido'}`,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        this.router.navigate(['/home']);
      });
      return;
    }

    // Mostrar información del usuario autenticado
    const currentUser = this.authService.getCurrentUser();
    console.log('👤 Usuario autenticado:', currentUser);

    // Verificar si el token está por expirar
    if (this.authService.isTokenExpiringSoon()) {
      const timeRemaining = this.authService.getTokenTimeRemaining();
      console.warn(`⚠️ Tu sesión expirará en ${Math.floor(timeRemaining / 60)} minutos`);
    }

    // Suscribirse a los cambios de ubicación del mapa
    this.locationSubscription = this.mapService.selectedLocation$.subscribe(
      (location) => {
        if (location) {
          this.selectedLocation = location;
          this.createAccommodationForm.patchValue({
            location: `${location.latitude}, ${location.longitude}`
          });
        }
      }
    );
  }

  ngAfterViewInit(): void {
    // Inicializar el mapa después de que la vista esté lista
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  ngOnDestroy(): void {
    // Limpiar recursos
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }
    this.mapService.destroyMap();
  }

  private createForm() {
    this.createAccommodationForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
      city: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      location: ['', [Validators.required]],
      priceDay: ['', [Validators.required, Validators.min(1), Validators.max(10000000)]],
      guestsCount: ['', [Validators.required, Validators.min(1), Validators.max(50)]],
      services: [[]],
      images: [[]]
    });
  }

  private initializeMap(): void {
    // Construir el mapa en modo interactivo
    this.mapService.buildMap('map', true);

    // Centrar en Armenia por defecto
    this.mapService.setCenter(-75.6967, 4.5389);
    this.mapService.setZoom(13);

    // Redimensionar después de la carga
    setTimeout(() => {
      this.mapService.resizeMap();
    }, 300);
  }

  /**
   * Obtener el texto formateado de las coordenadas
   */
  getCoordinatesDisplay(): string {
    if (!this.selectedLocation) {
      return 'No se ha seleccionado ubicación';
    }
    return `Latitud: ${this.selectedLocation.latitude}, Longitud: ${this.selectedLocation.longitude}`;
  }

  /**
   * Verificar si una ubicación ha sido seleccionada
   */
  hasLocation(): boolean {
    return this.selectedLocation !== null;
  }

  isInvalidField(field: string): boolean {
    const control = this.createAccommodationForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.createAccommodationForm.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return 'Este campo es obligatorio';
    }
    if (control.errors['minlength']) {
      return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    }
    if (control.errors['maxlength']) {
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    }
    if (control.errors['min']) {
      return `El valor mínimo es ${control.errors['min'].min}`;
    }
    if (control.errors['max']) {
      return `El valor máximo es ${control.errors['max'].max}`;
    }
    if (control.errors['pattern']) {
      return 'Solo se permiten números';
    }

    return 'Campo inválido';
  }

  getServiceDisplayName(service: string): string {
    return service;
  }

  onServiceChange(event: any): void {
    const service = event.target.value;
    const isChecked = event.target.checked;
    
    if (isChecked) {
      this.selectedServices.push(service);
    } else {
      this.selectedServices = this.selectedServices.filter(s => s !== service);
    }
    
    this.createAccommodationForm.patchValue({
      services: this.selectedServices
    });
  }

  onFileChange(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Validar máximo 10 imágenes
      if (files.length > 10) {
        Swal.fire({
          title: 'Demasiadas imágenes',
          text: 'Máximo 10 imágenes permitidas',
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      // Validar tamaño de cada archivo (máx 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      const invalidFiles = Array.from(files).filter((file: any) => file.size > maxSize);
      
      if (invalidFiles.length > 0) {
        Swal.fire({
          title: 'Archivos muy grandes',
          text: 'Cada imagen debe pesar máximo 5MB',
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      this.selectedFiles = Array.from(files);
      
      this.createAccommodationForm.patchValue({
        images: this.selectedFiles
      });
    }
  }

  /**
   * Obtener el número de caracteres en la descripción
   */
  getDescriptionLength(): number {
    const description = this.createAccommodationForm.get('description')?.value;
    return description ? description.length : 0;
  }

  /**
   * Crear el alojamiento
   */
  async createAccommodation(): Promise<void> {
    // Validar formulario
    if (!this.createAccommodationForm.valid) {
      this.markAllFieldsAsTouched();
      Swal.fire({
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos requeridos',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Validar ubicación
    if (!this.selectedLocation) {
      Swal.fire({
        title: 'Ubicación requerida',
        text: 'Por favor selecciona una ubicación en el mapa',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Validar imágenes
    if (this.selectedFiles.length === 0) {
      Swal.fire({
        title: 'Imágenes requeridas',
        text: 'Debes subir al menos una imagen del alojamiento',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // ✅ Verificar que la sesión siga activa antes de enviar
    if (!this.authService.isAuthenticated()) {
      Swal.fire({
        title: 'Sesión expirada',
        text: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
        icon: 'error',
        confirmButtonText: 'Ir al login'
      }).then(() => {
        this.authService.clearAuthData();
        this.router.navigate(['/login']);
      });
      return;
    }

    this.isSubmitting = true;

    try {
      // Mostrar loading mientras se suben las imágenes
      Swal.fire({
        title: 'Subiendo imágenes...',
        text: 'Por favor espera mientras se suben las imágenes',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.isUploadingImages = true;

      // Subir imágenes a Cloudinary
      const uploadedImages: CloudinaryResponse[] = await this.imageService.uploadMultipleImages(this.selectedFiles);

      this.isUploadingImages = false;

      // Convertir a ImageDTO (primera imagen es la principal)
      const images: ImageDTO[] = uploadedImages.map((img, index) => ({
        url: img.url,
        cloudinaryId: img.cloudinaryId,
        isMainImage: index === 0 // Primera imagen es la principal
      }));

      // Preparar datos del alojamiento
      const formValue = this.createAccommodationForm.value;
      const accommodationData: CreateAccommodationDTO = {
        title: formValue.title,
        description: formValue.description,
        city: formValue.city,
        address: formValue.address,
        latitude: this.selectedLocation.latitude,
        longitude: this.selectedLocation.longitude,
        priceDay: parseFloat(formValue.priceDay),
        guestsCount: parseInt(formValue.guestsCount),
        services: this.selectedServices,
        images: images
      };

      console.log('📦 Datos a enviar al backend:', accommodationData);
      console.log('🔑 Token utilizado:', this.authService.getToken()?.substring(0, 20) + '...');

      // Enviar al backend
      this.accommodationService.createAccommodation(accommodationData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          
          Swal.fire({
            title: '¡Éxito!',
            text: response.content || 'Alojamiento creado exitosamente',
            icon: 'success',
            confirmButtonText: 'Ver mis alojamientos'
          }).then(() => {
            this.resetForm();
            this.router.navigate(['/my-places']);
          });
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('❌ Error al crear alojamiento:', error);
          
          // Manejar error de autenticación
          if (error.status === 401) {
            Swal.fire({
              title: 'Sesión expirada',
              text: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
              icon: 'error',
              confirmButtonText: 'Ir al login'
            }).then(() => {
              this.authService.clearAuthData();
              this.router.navigate(['/login']);
            });
          } else {
            Swal.fire({
              title: 'Error',
              text: error.error?.content || 'No se pudo crear el alojamiento. Por favor intenta nuevamente.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        }
      });

    } catch (error) {
      this.isSubmitting = false;
      this.isUploadingImages = false;
      console.error('❌ Error al procesar la solicitud:', error);
      
      Swal.fire({
        title: 'Error',
        text: 'Ocurrió un error al subir las imágenes. Por favor intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  /**
   * Resetear el formulario
   */
  private resetForm(): void {
    this.createAccommodationForm.reset();
    this.selectedFiles = [];
    this.selectedServices = [];
    this.selectedLocation = null;
    this.mapService.clearSelectedLocation();
  }

  /**
   * Marcar todos los campos como tocados
   */
  private markAllFieldsAsTouched(): void {
    Object.keys(this.createAccommodationForm.controls).forEach(key => {
      const control = this.createAccommodationForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Cancelar creación
   */
  cancelCreate(): void {
    Swal.fire({
      title: '¿Cancelar creación?',
      text: 'Se perderán todos los datos ingresados',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, continuar',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.resetForm();
        this.router.navigate(['/my-places']);
      }
    });
  }
}