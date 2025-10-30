import { Component } from '@angular/core';
import { AbstractControlOptions, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { repeat } from 'rxjs';

@Component({
  selector: 'app-edit-accommodation',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-accommodation.html',
  styleUrl: './edit-accommodation.css'
})
export class EditAccommodation {

  editAccommodationForm!: FormGroup;
  selectedImages: File[] = [];
  servicesList: string[];

  constructor(private formBuilder: FormBuilder) {
    this.createForm();
    this.servicesList = ['WiFi', 'Desayuno incluido', 'Piscina', 'Aire acondicionado', 'Estacionamiento gratuito', 'Gimnasio', 'Admite mascotas', 'Servicio de limpieza', 'TV por cable'];
  }

  private createForm() {
    this.editAccommodationForm = this.formBuilder.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    priceDay: [0, [Validators.required, Validators.pattern(/^[0-9]+$/),Validators.min(1)]],
    guestsCount: [1, [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.min(1)]],
    services: ['', [Validators.required]],
    images: [[], [Validators.required]]
  }
  );
  }

  public editAccommodation(){
    console.log(this.editAccommodationForm.value);
  }

  public onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
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

}
