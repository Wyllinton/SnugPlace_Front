import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { TokenService } from '../../services/token-service';
import { UserService } from '../../services/user-service';
import { UserDTO } from '../../models/user-dto';
import { UpdateProfileDTO } from '../../models/update-user-dto';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {
  profileForm!: FormGroup;
  isLoading = false;
  currentUser: UserDTO | null = null;
  userId: number | null = null;

  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private tokenService: TokenService,
    private userService: UserService
  ) {
    this.createForm();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.userId = +params['id'];
      console.log('ID obtenido de la ruta:', this.userId);
      
      if (this.userId && this.userId > 0) {
        this.loadUserData();
      } else {
        console.error('ID de usuario no válido en la ruta');
        this.router.navigate(['/login']);
      }
    });
  }

  private createForm() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      phoneNumber: ['', [Validators.required, Validators.maxLength(15)]],
      description: ['', [Validators.maxLength(500)]],
      photoURL: [''],
      email: [{ value: '', disabled: true }] 
    });
  }

  private loadUserData() {
    if (this.tokenService.isLogged() && this.userId) {
      console.log('Cargando datos para userId:', this.userId);
      this.isLoading = true;
      
      this.loadUserProfile(this.userId);
    } else {
      console.error('Usuario no autenticado o ID no disponible');
      this.router.navigate(['/login']);
    }
  }

  private loadUserProfile(userId: number) {
    this.userService.getProfile(userId).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (!response.error && response.content) {
          this.currentUser = response.content;
          
          this.profileForm.patchValue({
            name: response.content.name || '',
            email: response.content.email || '',
            photoURL: response.content.photoUrl || '',
            phoneNumber: '',
            description: ''
          });
          
          if (response.content.photoUrl) {
            this.updatePhotoPreview(response.content.photoUrl);
          }
          
          console.log('Perfil cargado exitosamente');
        } else {
          Swal.fire('Error', 'No se pudo cargar la información del perfil', 'error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al cargar perfil:', error);
        Swal.fire('Error', 'No se pudo cargar la información del perfil', 'error');
      }
    });
  }

  openFileSelector() {
    this.photoInput.nativeElement.click();
  }

  updateProfile() {
    if (this.profileForm.valid && this.userId) {
      this.isLoading = true;
      
      const updateProfileDTO: UpdateProfileDTO = {
        name: this.profileForm.get('name')?.value,
        phoneNumber: this.profileForm.get('phoneNumber')?.value,
        photoURL: this.profileForm.get('photoURL')?.value,
        description: this.profileForm.get('description')?.value
      };

      console.log('Enviando actualización para userId:', this.userId, updateProfileDTO);

      this.userService.updateProfile(this.userId, updateProfileDTO).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Respuesta de actualización:', response);
          
          if (!response.error) {
            Swal.fire({
              title: '¡Éxito!',
              text: response.content,
              icon: 'success',
              confirmButtonText: 'Aceptar'
            }).then(() => {
              // ✅ CAMBIO AQUÍ: Redirigir al HOME en lugar de recargar los datos
              this.router.navigate(['/']);
            });
          } else {
            Swal.fire('Error', response.content || 'Error al actualizar el perfil', 'error');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error al actualizar perfil:', error);
          Swal.fire('Error', error.message || 'Error al actualizar el perfil', 'error');
        }
      });
    } else {
      console.warn('Formulario inválido o ID de usuario no disponible');
      this.profileForm.markAllAsTouched();
    }
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        Swal.fire('Error', 'Por favor selecciona un archivo de imagen válido', 'error');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('Error', 'La imagen no debe superar los 5MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.updatePhotoPreview(e.target.result);
        this.profileForm.patchValue({
          photoURL: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  }

  private updatePhotoPreview(imageUrl: string) {
    const photoPreview = document.getElementById('photoPreview') as HTMLImageElement;
    const photoPlaceholder = document.getElementById('photoPlaceholder');
    
    if (photoPreview && photoPlaceholder) {
      photoPreview.src = imageUrl;
      photoPreview.style.display = 'block';
      photoPlaceholder.style.display = 'none';
    }
  }

  cancelEdit() {
    if (confirm('¿Estás seguro de que quieres cancelar? Los cambios no guardados se perderán.')) {
      this.router.navigate(['/']);
    }
  }

  navigateToChangePassword() {
    if (this.userId) {
      this.router.navigate([`${this.userId}/profile/change-password`]);
    } else {
      Swal.fire('Error', 'ID de usuario no disponible', 'error');
    }
  }

  isInvalidField(field: string): boolean {
    const control = this.profileForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  clearPhoto() {
    this.profileForm.patchValue({
      photoURL: ''
    });
    const photoPreview = document.getElementById('photoPreview') as HTMLImageElement;
    const photoPlaceholder = document.getElementById('photoPlaceholder');
    
    if (photoPreview && photoPlaceholder) {
      photoPreview.style.display = 'none';
      photoPlaceholder.style.display = 'flex';
    }
  }
}