import { Component } from '@angular/core';
import { AbstractControlOptions, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { repeat } from 'rxjs';

@Component({
  selector: 'app-create-accommodation',
  imports: [ReactiveFormsModule],
  templateUrl: './create-accommodation.html',
  styleUrl: './create-accommodation.css'
})
export class CreateAccommodation {

  createAccommodationForm!: FormGroup;
  selectedImages: File[] = [];
  cities: string[];
  servicesList: string[];

  constructor(private formBuilder: FormBuilder) {
    this.createForm();
    this.cities = ['Bogotá', 'Medellín', 'Cali','Barranquilla','Cartagena','Bucaramanga','Pereira','Manizales','Armenia','Santa Marta','Ibagué','Neiva','Pasto'];
    this.servicesList = ['WiFi', 'Desayuno incluido', 'Piscina', 'Aire acondicionado', 'Estacionamiento gratuito', 'Gimnasio', 'Admite mascotas', 'Servicio de limpieza', 'TV por cable'];
  }

  private createForm() {
    this.createAccommodationForm = this.formBuilder.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    city: ['', [Validators.required]],
    address: ['', [Validators.required]],
    location: ['', [Validators.required]],
    priceDay: [0, [Validators.required, Validators.pattern(/^[0-9]+$/),Validators.min(1)]],
    guestsCount: [1, [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.min(1)]],
    services: ['', [Validators.required]],
    images: [[], [Validators.required]]
  }
  );
  }

  public createAccommodation(){
    console.log(this.createAccommodationForm.value);
  }

  public onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      this.createAccommodationForm.patchValue({ images: files });
    }
  }

  onServiceChange(event: any) {
    const selectedServices = this.createAccommodationForm.value.services || [];
    const value = event.target.value;

    if (event.target.checked) {
      selectedServices.push(value);
    } else {
      const index = selectedServices.indexOf(value);
      if (index !== -1) {
        selectedServices.splice(index, 1);
      }
    }

    this.createAccommodationForm.patchValue({ services: selectedServices });
  }

}
