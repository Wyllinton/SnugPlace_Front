import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth-service';
import { ResetPasswordDTO } from '../../models/reset-password-dto';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css']
})
export class ResetPassword implements OnInit, AfterViewInit {
  
  reset_passwordForm!: FormGroup;
  email: string = '';
  isSubmitting: boolean = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.createForm();
  }

  ngOnInit() {
    // Obtener el email de los query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        Swal.fire('Error', 'No se encontró el email. Por favor, vuelve a solicitar el código.', 'error');
        this.router.navigate(['/forgot-password']);
      }
    });
  }

  private createForm() {
    this.reset_passwordForm = this.formBuilder.group({
      codigo1: ['', [Validators.required, Validators.maxLength(1)]],
      codigo2: ['', [Validators.required, Validators.maxLength(1)]],
      codigo3: ['', [Validators.required, Validators.maxLength(1)]],
      codigo4: ['', [Validators.required, Validators.maxLength(1)]],
      nuevaPassword: ['', [Validators.required, Validators.maxLength(20), Validators.minLength(8)]]
    });
  }

  public resetPassword() {
    if (this.reset_passwordForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;

    // Construir el código de 4 dígitos
    const recoveryCode =
      this.reset_passwordForm.value.codigo1 +
      this.reset_passwordForm.value.codigo2 +
      this.reset_passwordForm.value.codigo3 +
      this.reset_passwordForm.value.codigo4;

    // Crear el DTO para resetear la contraseña
    const resetPasswordDTO: ResetPasswordDTO = {
      codigo: recoveryCode,
      nuevaPassword: this.reset_passwordForm.value.nuevaPassword
    };

    console.log('Email:', this.email);
    console.log('Código ingresado:', recoveryCode);
    console.log('Nueva contraseña:', this.reset_passwordForm.value.nuevaPassword);

    // Llamar al servicio para resetear la contraseña
    this.authService.resetPassword(resetPasswordDTO).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        
        if (!response.error) {
          Swal.fire({
            title: '¡Contraseña restablecida!',
            text: response.content,
            icon: 'success',
            confirmButtonText: 'Ir al Login',
            confirmButtonColor: '#198754'
          }).then(() => {
            this.router.navigate(['/login']);
          });
        } else {
          Swal.fire('Error', 'No se pudo restablecer la contraseña', 'error');
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        Swal.fire('Error', error.message || 'Error al restablecer la contraseña', 'error');
      }
    });
  }

  ngAfterViewInit() {
    // Cambia automáticamente el campo al ingresar el código
    const inputs = document.querySelectorAll('.code-inputs input');
    inputs.forEach((input, index) => {
      input.addEventListener('input', (e: any) => {
        if (e.target.value && index < inputs.length - 1) {
          (inputs[index + 1] as HTMLElement).focus();
        }
      });
      input.addEventListener('keydown', (e: any) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          (inputs[index - 1] as HTMLElement).focus();
        }
      });
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.reset_passwordForm.controls).forEach(key => {
      const control = this.reset_passwordForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.reset_passwordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.reset_passwordForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es obligatorio';
      if (field.errors['maxLength']) return 'Máximo 1 carácter';
      if (field.errors['minLength'] || field.errors['maxLength']) {
        return 'La contraseña debe tener entre 8 y 20 caracteres';
      }
    }
    return '';
  }
}