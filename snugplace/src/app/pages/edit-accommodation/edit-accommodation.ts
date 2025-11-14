import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ResponseDTO } from '../../models/response-dto';
import { AccommodationService, UpdateAccommodationDTO } from '../../services/accommodations-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-accommodation',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './edit-accommodation.html',
  styleUrls: ['./edit-accommodation.css']
})
export class EditAccommodation implements OnInit {

  editAccommodationForm!: FormGroup;
  servicesList: string[];
  accommodationId!: number;
  isLoading = false;
  isSubmitting = false;

  constructor(
    private formBuilder: FormBuilder,
    private accommodationService: AccommodationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.servicesList = this.accommodationService.getAvailableServices();
  }

  private createForm() {
    this.editAccommodationForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      priceDay: [0, [Validators.required, Validators.min(1)]],
      guestsCount: [1, [Validators.required, Validators.min(1)]],
      services: this.formBuilder.array([], Validators.required)
    });
  }

  public editAccommodation() {
    if (this.editAccommodationForm.invalid) {
      this.markAllFieldsAsTouched();
      this.showError('Por favor, completa todos los campos requeridos correctamente');
      return;
    }

    const selectedServices = this.getSelectedServices();
    if (selectedServices.length === 0) {
      this.showError('Debes seleccionar al menos un servicio');
      return;
    }

    // ✅ VERIFICAR QUE accommodationId SEA VÁLIDO
    if (!this.accommodationId || isNaN(this.accommodationId)) {
      this.showError('ID de alojamiento inválido');
      return;
    }

    this.isSubmitting = true;

    const updateData: UpdateAccommodationDTO = {
      title: this.editAccommodationForm.value.title,
      description: this.editAccommodationForm.value.description,
      priceDay: this.editAccommodationForm.value.priceDay,
      guestsCount: this.editAccommodationForm.value.guestsCount,
      services: selectedServices,
      images: [] // Array vacío de imágenes
    };

    console.log('📤 Enviando datos de actualización para ID:', this.accommodationId);
    console.log('📦 Datos:', updateData);

    this.accommodationService.updateAccommodation(this.accommodationId, updateData)
      .subscribe({
        next: (response: ResponseDTO<string>) => {
          this.isSubmitting = false;
          if (!response.error) {
            Swal.fire({
              title: '¡Éxito!',
              text: 'Alojamiento actualizado correctamente',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            }).then(() => {
              this.router.navigate(['/accommodation', this.accommodationId]);
            });
          } else {
            this.showError(response.content || 'Error al actualizar el alojamiento');
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error updating accommodation:', error);
          this.showError('Error del servidor al actualizar el alojamiento');
        }
      });
  }

  // Manejo de servicios
  get servicesArray(): FormArray {
    return this.editAccommodationForm.get('services') as FormArray;
  }

  private initializeServices() {
    const servicesArray = this.servicesArray;
    servicesArray.clear();
    this.servicesList.forEach(() => {
      servicesArray.push(new FormControl(false));
    });
  }

  getSelectedServices(): string[] {
    return this.servicesList.filter((_, index) => this.servicesArray.at(index).value);
  }

  onServiceChange(index: number, event: any) {
    this.servicesArray.at(index).setValue(event.target.checked);
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.editAccommodationForm.controls).forEach(key => {
      const control = this.editAccommodationForm.get(key);
      control?.markAsTouched();
    });
  }

  private showError(message: string) {
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }

  ngOnInit() {
    this.createForm();
    this.initializeServices();
    this.loadAccommodationData();
  }

  private loadAccommodationData() {
    this.route.params.subscribe(params => {
      console.log('🔄 Params recibidos:', params);
      
      // ✅ CONVERSIÓN SEGURA DEL ID
      const idParam = params['id'];
      if (idParam && !isNaN(Number(idParam))) {
        this.accommodationId = Number(idParam);
        console.log('✅ ID válido:', this.accommodationId);
        this.getAccommodationDetails();
      } else {
        console.error('❌ ID inválido:', idParam);
        this.showError('ID de alojamiento inválido');
        this.router.navigate(['/my-places']);
      }
    });
  }

  private getAccommodationDetails() {
    this.isLoading = true;
    console.log('🔍 Obteniendo detalles para ID:', this.accommodationId);
    
    this.accommodationService.getAccommodationDetails(this.accommodationId)
      .subscribe({
        next: (response: ResponseDTO<any>) => {
          if (!response.error && response.content) {
            this.populateForm(response.content);
          } else {
            this.showError('No se pudieron cargar los datos del alojamiento');
            this.router.navigate(['/my-places']);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading accommodation:', error);
          this.isLoading = false;
          this.showError('Error al cargar los datos del alojamiento');
        }
      });
  }

  private populateForm(accommodation: any) {
    console.log('📝 Poblando formulario con:', accommodation);

    // Datos básicos
    this.editAccommodationForm.patchValue({
      title: accommodation.title,
      description: accommodation.description,
      priceDay: accommodation.priceDay,
      guestsCount: accommodation.guestsCount
    });

    // Servicios
    if (accommodation.services) {
      this.servicesList.forEach((service, index) => {
        const isSelected = accommodation.services.includes(service);
        this.servicesArray.at(index).setValue(isSelected);
      });
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.editAccommodationForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['maxlength']) {
        if (fieldName === 'title') return 'Máximo 100 caracteres';
        if (fieldName === 'description') return 'Máximo 500 caracteres';
      }
      if (field.errors['min']) return 'El valor debe ser mayor a 0';
    }
    return '';
  }

  getServiceDisplayName(service: string): string {
    const displayNames = this.accommodationService.getServiceDisplayNames();
    return displayNames[service] || service;
  }

  onCancel() {
    this.router.navigate(['/accommodation', this.accommodationId]);
  }
}