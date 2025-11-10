import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPassword {

  recoveryForm: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.recoveryForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.recoveryForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;

    // Simular envío de código (en una app real, aquí iría la llamada HTTP)
    setTimeout(() => {
      this.isSubmitting = false;
      
      Swal.fire({
        title: '¡Código enviado!',
        text: 'Hemos enviado un código de recuperación a tu correo electrónico.',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#198754'
      }).then(() => {
        // Redirigir a la página de reset password
        this.router.navigate(['/reset-password']);
      });
    }, 2000);
  }

  private markFormGroupTouched() {
    Object.keys(this.recoveryForm.controls).forEach(key => {
      const control = this.recoveryForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods for template validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.recoveryForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.recoveryForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es obligatorio';
      if (field.errors['email']) return 'Ingresa un correo electrónico válido';
    }
    return '';
  }
}