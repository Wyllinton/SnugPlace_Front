import { Component } from '@angular/core';
import { AbstractControlOptions, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user-service';
import Swal from 'sweetalert2';
import { CreateUserDTO } from '../../models/create-user-dto';
import { finalize } from 'rxjs/operators';
import { ImageService } from '../../services/image-service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {

  registerForm!: FormGroup;
  selectedProfileImage: File | null = null;
  profileImageUrl: string | null = null;
  isUploading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private imageService: ImageService,
    private router: Router
  ) {
    this.createForm();
  }

  private createForm() {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.maxLength(10)]],
      description: [''],
      repeatPassword: ['', [Validators.required, Validators.maxLength(20), Validators.minLength(8)]],
      role: ['', [Validators.required]],
      birthDate: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.maxLength(20), Validators.minLength(8)]]
    },
    { validators: this.passwordsMatchValidator } as AbstractControlOptions
    );
  }

  /**
   * Maneja la selección de archivo de imagen
   */
  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validar el archivo
      const validation = this.imageService.validateImageFile(file);
      if (!validation.valid) {
        Swal.fire({
          title: 'Error',
          text: validation.error,
          icon: 'error'
        });
        input.value = ''; // Limpiar el input
        return;
      }

      this.selectedProfileImage = file;
      
      // Crear preview local
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Crea el usuario con imagen en un solo paso
   */
  public createUser() {
    if (this.registerForm.invalid) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor complete todos los campos correctamente',
        icon: 'error'
      });
      return;
    }

    this.isUploading = true;

    // Mostrar loading
    Swal.fire({
      title: 'Registrando usuario...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Crear FormData para enviar todo en una sola petición
    const formData = new FormData();
    
    // Agregar campos del formulario
    formData.append('name', this.registerForm.get('name')?.value);
    formData.append('email', this.registerForm.get('email')?.value);
    formData.append('password', this.registerForm.get('password')?.value);
    formData.append('phoneNumber', this.registerForm.get('phoneNumber')?.value);
    formData.append('birthDate', this.registerForm.get('birthDate')?.value);
    formData.append('role', this.registerForm.get('role')?.value);
    
    // Agregar descripción si existe
    const description = this.registerForm.get('description')?.value;
    if (description) {
      formData.append('description', description);
    }

    // Agregar imagen si existe
    if (this.selectedProfileImage) {
      formData.append('profileImage', this.selectedProfileImage);
    }

    // Llamar al nuevo servicio que registra usuario e imagen en un solo paso
    this.userService.registerWithImage(formData).subscribe({
      next: (response) => {
        this.isUploading = false;
        
        if (response.error) {
          Swal.fire({
            title: 'Error',
            text: response.content?.message || 'Error al registrar usuario',
            icon: 'error'
          });
          return;
        }

        // Éxito - mostrar mensaje con información de la imagen
        const successMessage = this.selectedProfileImage 
          ? `Usuario registrado exitosamente con imagen`
          : `Usuario registrado exitosamente`;

        Swal.fire({
          title: '¡Éxito!',
          text: successMessage,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (error) => {
        this.isUploading = false;
        console.error('Error en registro:', error);
        
        Swal.fire({
          title: 'Error',
          text: error.error?.content?.message || error.error?.content || 'Error al registrar usuario',
          icon: 'error'
        });
      }
    });
  }

  public passwordsMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('repeatPassword')?.value;
    return password == confirmPassword ? null : { passwordsMismatch: true };
  }

  /**
   * Limpia la imagen seleccionada
   */
  clearProfileImage(): void {
    this.selectedProfileImage = null;
    this.profileImageUrl = null;
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }
}