import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MapService, LocationCoordinates } from '../../services/map-service';
import { Subscription } from 'rxjs';

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

  constructor(
    private formBuilder: FormBuilder,
    private mapService: MapService
  ) {
    this.cities = [
      'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 
      'Bucaramanga', 'Pereira', 'Manizales', 'Armenia', 'Santa Marta', 
      'Ibagué', 'Neiva', 'Pasto'
    ];
    
    this.servicesList = [
      'WiFi', 'Desayuno incluido', 'Piscina', 'Aire acondicionado', 
      'Estacionamiento gratuito', 'Gimnasio', 'Admite mascotas', 
      'Servicio de limpieza', 'TV por cable'
    ];
    
    this.createForm();
  }

  ngOnInit(): void {
    // Suscribirse a los cambios de ubicación del mapa
    this.locationSubscription = this.mapService.selectedLocation$.subscribe(
      (location) => {
        if (location) {
          this.selectedLocation = location;
          // Actualizar el formulario con las coordenadas
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
      location: ['', [Validators.required]], // Guardará "lat, lng"
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
        alert('Máximo 10 imágenes permitidas');
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
  createAccommodation(): void {
    if (this.createAccommodationForm.valid && this.selectedLocation) {
      const formValue = this.createAccommodationForm.value;
      
      const accommodationData = {
        title: formValue.title,
        description: formValue.description,
        address: {
          city: formValue.city,
          address: formValue.address,
          location: {
            latitude: this.selectedLocation.latitude,
            longitude: this.selectedLocation.longitude
          }
        },
        pricePerNight: parseFloat(formValue.priceDay),
        maxGuests: parseInt(formValue.guestsCount),
        services: this.selectedServices,
        images: this.selectedFiles // Aquí enviarías las imágenes al backend
      };
      
      console.log('📦 Datos del alojamiento listos para enviar:', accommodationData);
      
      // Aquí irá la llamada al backend
      // this.accommodationService.create(accommodationData).subscribe(...)
      
      alert('✅ Alojamiento creado exitosamente (simulado)');
      this.resetForm();
      
    } else {
      this.markAllFieldsAsTouched();
      
      if (!this.selectedLocation) {
        alert('⚠️ Por favor, selecciona una ubicación en el mapa');
      }
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
    if (confirm('¿Estás seguro de que quieres cancelar? Se perderán los datos no guardados.')) {
      this.resetForm();
      // O navegar de vuelta: this.router.navigate(['/my-places']);
    }
  }
}