import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MapService } from '../../services/map-service';
import { ImageService, CloudinaryResponse } from '../../services/image-service';
import { AccommodationService, CreateAccommodationDTO, ImageDTO } from '../../services/accommodations-service';
import { TokenService } from '../../services/token-service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

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
  selectedServices: string[] = []; // ✅ Array de ENUMS
  
  cities: string[];
  servicesList: string[];
  serviceDisplayNames: { [key: string]: string };

  selectedLocation: LocationCoordinates | null = null;
  private locationSubscription?: Subscription;

  isSubmitting = false;
  isUploadingImages = false;

  constructor(
    private formBuilder: FormBuilder,
    private mapService: MapService,
    private imageService: ImageService,
    private accommodationService: AccommodationService,
    private tokenService: TokenService,
    private router: Router
  ) {
    this.cities = [
      'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 
      'Bucaramanga', 'Pereira', 'Manizales', 'Armenia', 'Santa Marta', 
      'Ibagué', 'Neiva', 'Pasto'
    ];
    
    this.servicesList = this.accommodationService.getAvailableServices();
    this.serviceDisplayNames = this.accommodationService.getServiceDisplayNames();
    
    console.log('🏗️ CreateAccommodation Component inicializado');
    console.log('📋 Servicios disponibles:', this.servicesList);
    
    this.createForm();
  }

  ngOnInit(): void {
    if (!this.tokenService.isLogged()) {
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

    const userRole = this.tokenService.getRole();
    if (userRole !== 'HOST') {
      Swal.fire({
        title: 'Acceso denegado',
        text: `Solo los anfitriones pueden crear alojamientos. Tu rol actual es: ${userRole || 'No definido'}`,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        this.router.navigate(['/home']);
      });
      return;
    }

    const userId = this.tokenService.getId();
    console.log('👤 Usuario autenticado:', { id: userId, role: userRole });

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
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  ngOnDestroy(): void {
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
    this.mapService.buildMap('map', true);
    this.mapService.setCenter(-75.6967, 4.5389);
    this.mapService.setZoom(13);
    setTimeout(() => this.mapService.resizeMap(), 300);
  }

  getCoordinatesDisplay(): string {
    if (!this.selectedLocation) {
      return 'No se ha seleccionado ubicación';
    }
    return `Latitud: ${this.selectedLocation.latitude}, Longitud: ${this.selectedLocation.longitude}`;
  }

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

    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['min']) return `El valor mínimo es ${control.errors['min'].min}`;
    if (control.errors['max']) return `El valor máximo es ${control.errors['max'].max}`;
    if (control.errors['pattern']) return 'Solo se permiten números';

    return 'Campo inválido';
  }

  getServiceDisplayName(serviceEnum: string): string {
    return this.serviceDisplayNames[serviceEnum] || serviceEnum;
  }

  /**
   * ✅ MÉTODO CRÍTICO - Manejar cambios en servicios
   */
  onServiceChange(event: any): void {
    const serviceEnum = event.target.value;
    const isChecked = event.target.checked;
    
    console.log(`🔧 Servicio ${isChecked ? 'seleccionado' : 'deseleccionado'}:`, serviceEnum);
    
    if (isChecked) {
      if (!this.selectedServices.includes(serviceEnum)) {
        this.selectedServices.push(serviceEnum);
      }
    } else {
      this.selectedServices = this.selectedServices.filter(s => s !== serviceEnum);
    }
    
    console.log('📋 Servicios actuales (ENUMS):', this.selectedServices);
    console.log('🔍 Tipo:', typeof this.selectedServices);
    console.log('🔍 Es array?:', Array.isArray(this.selectedServices));
    
    this.createAccommodationForm.patchValue({
      services: this.selectedServices
    });
  }

  onFileChange(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (files.length > 10) {
        Swal.fire({
          title: 'Demasiadas imágenes',
          text: 'Máximo 10 imágenes permitidas',
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      const maxSize = 5 * 1024 * 1024;
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

  getDescriptionLength(): number {
    const description = this.createAccommodationForm.get('description')?.value;
    return description ? description.length : 0;
  }

  /**
   * ✅ CREAR ALOJAMIENTO - VERSIÓN CON MÁXIMO LOGGING
   */
  async createAccommodation(): Promise<void> {
  console.log('🚀 ========================================');
  console.log('🚀 INICIO - createAccommodation()');
  console.log('🚀 ========================================');

  // Validaciones
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

  if (!this.selectedLocation) {
    Swal.fire({
      title: 'Ubicación requerida',
      text: 'Por favor selecciona una ubicación en el mapa',
      icon: 'warning',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  if (!this.tokenService.isLogged()) {
    Swal.fire({
      title: 'Sesión expirada',
      text: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
      icon: 'error',
      confirmButtonText: 'Ir al login'
    }).then(() => {
      this.tokenService.logout();
      this.router.navigate(['/login']);
    });
    return;
  }

  this.isSubmitting = true;

  try {
    // ✅ PASO 1: Subir imágenes
    let images: ImageDTO[] = [];

    if (this.selectedFiles.length > 0) {
      console.log(`📸 Subiendo ${this.selectedFiles.length} imagen(es)...`);
      
      Swal.fire({
        title: 'Subiendo imágenes...',
        text: `Subiendo ${this.selectedFiles.length} imagen(es) a Cloudinary`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      this.isUploadingImages = true;
      const uploadedImages: CloudinaryResponse[] = await this.imageService.uploadMultipleImages(this.selectedFiles);
      this.isUploadingImages = false;

      images = uploadedImages.map((img, index) => ({
        url: img.url,
        cloudinaryId: img.cloudinaryId,
        isMainImage: index === 0
      }));

      console.log('✅ Imágenes subidas:', images);
    } else {
      console.log('📸 No hay imágenes seleccionadas (se enviará array vacío)');
    }

    // ✅ PASO 2: Obtener datos COMPLETOS del usuario
    const userId = this.tokenService.getUserId(); // ✅ Ahora es number
    const userName = this.tokenService.getName();
    const userEmail = this.tokenService.getEmail();
    
    console.log('🔑 Datos del usuario:', { 
      id: userId, 
      name: userName, 
      email: userEmail 
    });

    if (!userId || userId === 0) {
      throw new Error('No se pudo obtener el ID del usuario del token');
    }

    if (!userName) {
      console.warn('⚠️ No se encontró el nombre del usuario en el token');
    }

    if (!userEmail) {
      console.warn('⚠️ No se encontró el email del usuario en el token');
    }

    // ✅ PASO 3: Preparar datos del formulario
    const formValue = this.createAccommodationForm.value;
    
    console.log('📝 Datos del formulario:');
    console.log('   title:', formValue.title);
    console.log('   description:', formValue.description);
    console.log('   city:', formValue.city);
    console.log('   address:', formValue.address);
    console.log('   priceDay:', formValue.priceDay);
    console.log('   guestsCount:', formValue.guestsCount);

    // ✅ PASO 4: LOG DETALLADO DE SERVICIOS
    console.log('🔧 ========================================');
    console.log('🔧 SERVICIOS SELECCIONADOS - ANÁLISIS DETALLADO');
    console.log('🔧 ========================================');
    console.log('🔧 this.selectedServices:', this.selectedServices);
    console.log('🔧 Tipo:', typeof this.selectedServices);
    console.log('🔧 Es Array?:', Array.isArray(this.selectedServices));
    console.log('🔧 Longitud:', this.selectedServices.length);
    console.log('🔧 Cada servicio:');
    this.selectedServices.forEach((service, index) => {
      console.log(`   ${index}: "${service}" (tipo: ${typeof service})`);
    });
    console.log('🔧 JSON.stringify:', JSON.stringify(this.selectedServices));
    console.log('🔧 ========================================');

    // ✅ PASO 5: Crear DTO EXACTO con HostDTO completo
    const accommodationData: CreateAccommodationDTO = {
      host: {
        id: userId,        // ✅ number
        name: userName || "Anfitrión SnugPlace",    // ✅ string con valor por defecto
        email: userEmail || "host@snugplace.com"   // ✅ string con valor por defecto
      },
      title: formValue.title,
      description: formValue.description,
      city: formValue.city,
      address: formValue.address,
      latitude: Number(this.selectedLocation.latitude),
      longitude: Number(this.selectedLocation.longitude),
      priceDay: Number(formValue.priceDay),
      guestsCount: Number(formValue.guestsCount),
      averageRating: 0.0,
      status: "ACTIVE",
      services: [...this.selectedServices],  // ✅ Crear nueva copia del array
      images: images,
      comments: []
    };

    console.log('📦 ========================================');
    console.log('📦 DTO FINAL COMPLETO');
    console.log('📦 ========================================');
    console.log('📦 accommodationData:', accommodationData);
    console.log('📦 Host object:', accommodationData.host);
    console.log('📦 JSON completo:');
    console.log(JSON.stringify(accommodationData, null, 2));
    console.log('📦 ========================================');

    // ✅ PASO 6: Enviar al backend
    Swal.fire({
      title: 'Creando alojamiento...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.accommodationService.createAccommodation(accommodationData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        
        console.log('✅ ========================================');
        console.log('✅ RESPUESTA EXITOSA DEL BACKEND');
        console.log('✅ ========================================');
        console.log('✅ Response:', response);
        
        if (response.error) {
          throw new Error(response.content || 'Error desconocido');
        }
        
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
        
        console.error('❌ ========================================');
        console.error('❌ ERROR DEL BACKEND');
        console.error('❌ ========================================');
        console.error('❌ Error completo:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Error body:', error.error);
        console.error('❌ Message:', error.message);
        
        if (error.status === 401) {
          Swal.fire({
            title: 'Sesión expirada',
            text: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
            icon: 'error',
            confirmButtonText: 'Ir al login'
          }).then(() => {
            this.tokenService.logout();
            this.router.navigate(['/login']);
          });
        } else {
          const errorMessage = error.error?.content || error.error?.message || error.message || 'Error desconocido';
          
          Swal.fire({
            title: 'Error',
            html: `<div style="text-align: left;">
              <p><strong>No se pudo crear el alojamiento:</strong></p>
              <p style="color: #d33; margin-top: 10px;">${errorMessage}</p>
              <p style="margin-top: 15px; font-size: 0.9em; color: #666;">
                Por favor revisa la consola del navegador (F12) para más detalles.
              </p>
            </div>`,
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      }
    });

  } catch (error: any) {
    this.isSubmitting = false;
    this.isUploadingImages = false;
    
    console.error('❌ ========================================');
    console.error('❌ ERROR EN CATCH');
    console.error('❌ ========================================');
    console.error('❌ Error:', error);
    
    Swal.fire({
      title: 'Error',
      text: error.message || 'Ocurrió un error inesperado',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }
}

  private resetForm(): void {
    this.createAccommodationForm.reset();
    this.selectedFiles = [];
    this.selectedServices = [];
    this.selectedLocation = null;
    this.mapService.clearSelectedLocation();
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.createAccommodationForm.controls).forEach(key => {
      const control = this.createAccommodationForm.get(key);
      control?.markAsTouched();
    });
  }

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