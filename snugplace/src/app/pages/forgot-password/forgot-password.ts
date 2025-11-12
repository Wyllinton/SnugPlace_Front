import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth-service';

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
    private router: Router,
    private authService: AuthService
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
    const email = this.recoveryForm.get('email')?.value;

    this.authService.recoverPassword(email).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        
        if (!response.error) {
          Swal.fire({
            title: '¡Código enviado!',
            text: response.content,
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#198754'
          }).then(() => {
            // Redirigir a la página de reset password con el email
            this.router.navigate(['/reset-password'], { 
              queryParams: { email: email } 
            });
          });
        } else {
          Swal.fire('Error', 'No se pudo enviar el código', 'error');
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        Swal.fire('Error', error.message || 'Error al enviar el código', 'error');
      }
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.recoveryForm.controls).forEach(key => {
      const control = this.recoveryForm.get(key);
      control?.markAsTouched();
    });
  }

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