import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user-service';
import { ChangeUserPasswordDTO } from '../../models/change-user-password-dto';
import { ResponseDTO } from '../../models/response-dto';

@Component({
  selector: 'app-change-user-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './change-user-password.html',
  styleUrls: ['./change-user-password.css']
})
export class ChangeUserPassword implements OnInit {
  changePasswordForm!: FormGroup;
  isLoading = false;
  userId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService
  ) {
    this.createForm();
  }

  ngOnInit() {
    // Obtener el ID del usuario de la ruta
    this.route.params.subscribe(params => {
      this.userId = params['id'] ? parseInt(params['id']) : null;
    });
  }

  private createForm() {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(30)]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(30)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Validador personalizado para verificar que las contraseñas coincidan
  private passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      if (confirmPassword && confirmPassword.hasError('passwordMismatch')) {
        confirmPassword.setErrors(null);
      }
      return null;
    }
  }

  // Métodos para verificar requisitos de contraseña
  hasMinLength(): boolean {
    const password = this.changePasswordForm.get('newPassword')?.value;
    return password && password.length >= 8;
  }

  hasLetter(): boolean {
    const password = this.changePasswordForm.get('newPassword')?.value;
    return password && /[a-zA-Z]/.test(password);
  }

  hasNumber(): boolean {
    const password = this.changePasswordForm.get('newPassword')?.value;
    return password && /\d/.test(password);
  }

  hasSpecialChar(): boolean {
    const password = this.changePasswordForm.get('newPassword')?.value;
    return password && /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  changePassword() {
    if (this.changePasswordForm.valid && this.userId) {
      this.isLoading = true;

      const changePasswordDTO: ChangeUserPasswordDTO = {
        currentPassword: this.changePasswordForm.get('currentPassword')?.value,
        newPassword: this.changePasswordForm.get('newPassword')?.value
      };

      this.userService.changePassword(this.userId, changePasswordDTO).subscribe({
        next: (response: ResponseDTO<any>) => {
          this.isLoading = false;
          if (!response.error) {
            alert('Contraseña cambiada exitosamente');
            this.router.navigate([`/${this.userId}/profile`]);
          } else {
            // Manejar el error según la estructura de tu ResponseDTO
            const errorMessage = typeof response.content === 'string' ? response.content : 'Error al cambiar la contraseña';
            alert('Error al cambiar la contraseña: ' + errorMessage);
          }
        },
        error: (error) => {
          console.error('Error al cambiar contraseña:', error);
          this.isLoading = false;
          alert('Error al cambiar la contraseña. Por favor, inténtalo de nuevo.');
        }
      });
    } else {
      console.warn('Formulario inválido. Por favor verifique los campos.');
      this.changePasswordForm.markAllAsTouched();
    }
  }

  cancel() {
    if (this.userId) {
      this.router.navigate([`/${this.userId}/profile`]);
    } else {
      this.router.navigate(['/']);
    }
  }

  isInvalidField(field: string): boolean {
    const control = this.changePasswordForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getPasswordStrength(password: string): string {
    if (!password) return '';
    
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const length = password.length;

    if (length >= 8 && hasLetter && hasNumber && hasSpecialChar) {
      return 'fuerte';
    } else if (length >= 8 && ((hasLetter && hasNumber) || (hasLetter && hasSpecialChar) || (hasNumber && hasSpecialChar))) {
      return 'media';
    } else if (length >= 8) {
      return 'débil';
    } else {
      return 'muy débil';
    }
  }

  getPasswordStrengthClass(password: string): string {
    const strength = this.getPasswordStrength(password);
    switch (strength) {
      case 'fuerte': return 'password-strong';
      case 'media': return 'password-medium';
      case 'débil': return 'password-weak';
      case 'muy débil': return 'password-very-weak';
      default: return '';
    }
  }
}