import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-accommodation',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-accommodation.html',
  styleUrls: ['./create-accommodation.css']
})
export class CreateAccommodation {
  createAccommodationForm!: FormGroup;
  selectedFiles: File[] = [];
  selectedServices: string[] = [];
  
  cities: string[];
  servicesList: string[];

  constructor(private formBuilder: FormBuilder) {
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
    return service; // Ya tienes nombres bonitos en español
  }

  onServiceChange(event: any): void {
    const service = event.target.value;
    const isChecked = event.target.checked;
    
    if (isChecked) {
      this.selectedServices.push(service);
    } else {
      this.selectedServices = this.selectedServices.filter(s => s !== service);
    }
    
    // Actualizar el form control
    this.createAccommodationForm.patchValue({
      services: this.selectedServices
    });
  }

  onFileChange(event: any): void {
    const files = event.target.files;
    if (files) {
      this.selectedFiles = Array.from(files);
      
      // Actualizar el form control
      this.createAccommodationForm.patchValue({
        images: this.selectedFiles
      });
    }
  }

  createAccommodation(): void {
    if (this.createAccommodationForm.valid) {
      const formData = {
        ...this.createAccommodationForm.value,
        services: this.selectedServices,
        images: this.selectedFiles
      };
      
      console.log('Datos del alojamiento:', formData);
      
      // Aquí irá la llamada al backend
      // this.accommodationService.createAccommodation(formData).subscribe(...)
      
    } else {
      this.markAllFieldsAsTouched();
    }
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.createAccommodationForm.controls).forEach(key => {
      const control = this.createAccommodationForm.get(key);
      control?.markAsTouched();
    });
  }
}