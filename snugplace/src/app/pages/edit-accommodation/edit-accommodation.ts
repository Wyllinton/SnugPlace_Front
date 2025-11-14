import { Component, OnInit } from '@angular/core';
import { AbstractControlOptions, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { repeat } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ResponseDTO } from '../../models/response-dto';
import { AccommodationService } from '../../services/accommodations-service';

@Component({
  selector: 'app-edit-accommodation',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-accommodation.html',
  styleUrls: ['./edit-accommodation.css']
})
export class EditAccommodation implements OnInit {

  editAccommodationForm!: FormGroup;
  selectedImages: File[] = [];
  servicesList: string[];
  accommodationId!: number;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private accommodationService: AccommodationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.servicesList = ['WiFi', 'Desayuno incluido', 'Piscina', 'Aire acondicionado', 'Estacionamiento gratuito', 'Gimnasio', 'Admite mascotas', 'Servicio de limpieza', 'TV por cable'];
  }

  private createForm() {
    this.editAccommodationForm = this.formBuilder.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    priceDay: [0, [Validators.required, Validators.pattern(/^[0-9]+$/),Validators.min(1)]],
    guestsCount: [1, [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.min(1)]],
    services: ['', [Validators.required]],
    images: [[]]
  }
  );
  }

  public editAccommodation() {
    if (this.editAccommodationForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isLoading = true;
    
    const formData = this.prepareFormData();
    
    this.accommodationService.updateAccommodation(this.accommodationId, formData)
      .subscribe({
        next: (response: ResponseDTO<string>) => {
          this.isLoading = false;
          if (!response.error) {
            console.log('Accommodation updated successfully:', response.error);
            // Redirigir o mostrar mensaje de éxito
            this.router.navigate(['/my-accommodations']);
          } else {
            console.error('Error from server:', response.error);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error updating accommodation:', error);
        }
      });
    }

    private prepareFormData(): FormData {
  const formData = new FormData();
  const formValue = this.editAccommodationForm.value;

  // Agregar campos simples como strings
  formData.append('title', formValue.title);
  formData.append('description', formValue.description);
  formData.append('priceDay', formValue.priceDay.toString());
  formData.append('guestsCount', formValue.guestsCount.toString());
  
  // Agregar servicios como array JSON o múltiples campos
  if (formValue.services && Array.isArray(formValue.services)) {
    // Opción 1: Como JSON string
    formData.append('services', JSON.stringify(formValue.services));
    
    // Opción 2: Como múltiples campos (depende de tu backend)
    // formValue.services.forEach((service: string, index: number) => {
    //   formData.append(`services[${index}]`, service);
    // });
  }

  // Agregar imágenes si hay nuevas
  if (formValue.images && formValue.images.length > 0) {
    formValue.images.forEach((file: File, index: number) => {
      formData.append('images', file, file.name);
    });
  }

  // Para debugging - mostrar contenido del FormData
  this.logFormDataContents(formData);

  return formData;
}

// Método auxiliar para debuggear el FormData
private logFormDataContents(formData: FormData) {
  console.log('📦 FormData contents:');
  for (let [key, value] of (formData as any).entries()) {
    console.log(`${key}:`, value);
  }
}

  private markAllFieldsAsTouched() {
    Object.keys(this.editAccommodationForm.controls).forEach(key => {
      const control = this.editAccommodationForm.get(key);
      control?.markAsTouched();
    });
  }

  public onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      this.selectedImages = files;
      this.editAccommodationForm.patchValue({ images: files });
    }
  }

  onServiceChange(event: any) {
    const selectedServices = this.editAccommodationForm.value.services || [];
    const value = event.target.value;

    if (event.target.checked) {
      selectedServices.push(value);
    } else {
      const index = selectedServices.indexOf(value);
      if (index !== -1) {
        selectedServices.splice(index, 1);
      }
    }
    this.editAccommodationForm.patchValue({ services: selectedServices });
  }

  ngOnInit() {
    this.createForm();
    this.loadAccommodationData();
  }

  private loadAccommodationData() {
    this.route.params.subscribe(params => {
      this.accommodationId = +params['id'];
      if (this.accommodationId) {
        this.getAccommodationDetails();
      }
    });
  }

  private getAccommodationDetails() {
    this.isLoading = true;
    this.accommodationService.getAccommodationDetails(this.accommodationId)
      .subscribe({
        next: (response: ResponseDTO<any>) => {
          if (!response.error && response.content) {
            this.populateForm(response.content);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading accommodation:', error);
          this.isLoading = false;
        }
      });
  }

  private populateForm(accommodation: any) {
    this.editAccommodationForm.patchValue({
      title: accommodation.title,
      description: accommodation.description,
      priceDay: accommodation.priceDay,
      guestsCount: accommodation.guestsCount,
      services: accommodation.services || []
    });
  }

   // Método auxiliar para mostrar errores en el template
  getFieldError(fieldName: string): string {
    const field = this.editAccommodationForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['maxlength']) return 'Máximo 500 caracteres';
      if (field.errors['min']) return 'El valor debe ser mayor a 0';
      if (field.errors['pattern']) return 'Solo se permiten números';
    }
    return '';
  }

}
