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
  isUploadingImage: boolean = false;

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
      profilePhoto: [''], // Se llenará con la URL de Cloudinary
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
   * Sube la imagen de perfil a Cloudinary
   */
  private uploadProfileImage(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.selectedProfileImage) {
        resolve(''); // No hay imagen, continuar sin ella
        return;
      }

      this.isUploadingImage = true;

      this.imageService.uploadProfileImage(this.selectedProfileImage)
        .pipe(finalize(() => this.isUploadingImage = false))
        .subscribe({
          next: (response) => {
            console.log('Imagen subida exitosamente:', response);
            resolve(response.secure_url);
          },
          error: (error) => {
            console.error('Error al subir imagen:', error);
            reject(error);
          }
        });
    });
  }

  /**
   * Crea el usuario con validación y subida de imagen
   */
  public async createUser() {
    if (this.registerForm.invalid) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor complete todos los campos correctamente',
        icon: 'error'
      });
      return;
    }

    try {
      // Mostrar loading
      Swal.fire({
        title: 'Registrando usuario...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Subir imagen de perfil si existe
      let profilePhotoUrl = '';
      if (this.selectedProfileImage) {
        try {
          profilePhotoUrl = await this.uploadProfileImage();
        } catch (error) {
          Swal.fire({
            title: 'Error',
            text: 'Error al subir la imagen de perfil. ¿Desea continuar sin imagen?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar'
          }).then((result) => {
            if (!result.isConfirmed) {
              throw new Error('Registro cancelado por el usuario');
            }
          });
        }
      }

      // Crear DTO con la URL de la imagen
      const createUserDTO: CreateUserDTO = {
        ...this.registerForm.value,
        profilePhoto: profilePhotoUrl
      };

      // Registrar usuario
      this.userService.register(createUserDTO).subscribe({
        next: (data) => {
          Swal.fire({
            title: 'Éxito',
            text: data.content,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            this.router.navigate(['/login']);
          });
        },
        error: (error) => {
          Swal.fire({
            title: 'Error',
            text: error.error?.content || 'Error al registrar usuario',
            icon: 'error'
          });
        }
      });

    } catch (error: any) {
      console.error('Error en el proceso de registro:', error);
      if (error.message !== 'Registro cancelado por el usuario') {
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un error durante el registro',
          icon: 'error'
        });
      }
    }
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