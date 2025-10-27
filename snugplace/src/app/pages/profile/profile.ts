import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule ],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  profileForm!: FormGroup;

   // Data for testing purposes
  currentUser = {
    name: 'Juan Pérez',
    phoneNumber: '3104567890',
    description: 'Anfitrión apasionado por el turismo ecológico',
    email: 'juanperez@example.com'
  };

  constructor(private fb: FormBuilder) {
    this.createForm();
    this.loadUserData();
  }


  private createForm() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      phoneNumber: ['', [Validators.required, Validators.maxLength(10)]],
      description: ['', [Validators.maxLength(200)]],
      email: [{ value: '', disabled: true }] 
    });
  }

  /** Load de data´s user authenticaded in the form */
  private loadUserData() {
    this.profileForm.patchValue(this.currentUser);
  }

  updateProfile() {
    if (this.profileForm.valid) {
      const updatedProfile = this.profileForm.getRawValue();
      console.log('Perfil actualizado:', updatedProfile);

      // Aquí puedes llamar a tu servicio para actualizar en el backend:
      // this.userService.updateProfile(updatedProfile).subscribe(...)
    } else {
      console.warn('Formulario inválido. Por favor verifique los campos.');
      this.profileForm.markAllAsTouched();
    }
  }

  isInvalidField(field: string): boolean {
    const control = this.profileForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
