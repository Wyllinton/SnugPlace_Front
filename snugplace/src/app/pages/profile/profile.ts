import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TokenService } from '../../services/token-service';
import { UserService } from '../../services/user-service';
import { UserDTO } from '../../models/user-dto';
import { UpdateProfileDTO } from '../../models/update-user-dto';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {
  profileForm!: FormGroup;
  isLoading = false;
  currentUser: UserDTO | null = null;

  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private tokenService: TokenService,
    private userService: UserService
  ) {
    this.createForm();
  }

  ngOnInit() {
    this.loadUserData();
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
    if (this.tokenService.isLogged()) {
      const userId = this.tokenService.getUserId();
      if (userId) {
        this.isLoading = true;
        this.userService.getProfile(parseInt(userId)).subscribe({
          next: (response) => {
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
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error al cargar perfil:', error);
            this.isLoading = false;
          }
        });
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  // Método para abrir el selector de archivos
  openFileSelector() {
    this.photoInput.nativeElement.click();
  }

  updateProfile() {
    if (this.profileForm.valid && this.tokenService.isLogged()) {
      this.isLoading = true;
      const userId = this.tokenService.getUserId();
      
      const updateProfileDTO: UpdateProfileDTO = {
        name: this.profileForm.get('name')?.value,
        phoneNumber: this.profileForm.get('phoneNumber')?.value,
        photoURL: this.profileForm.get('photoURL')?.value,
        description: this.profileForm.get('description')?.value
      };

      if (userId) {
        this.userService.updateProfile(parseInt(userId), updateProfileDTO).subscribe({
          next: (response) => {
            if (!response.error) {
              console.log('Perfil actualizado exitosamente');
              alert('Perfil actualizado correctamente');
            } else {
              alert('Error al actualizar el perfil');
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error al actualizar perfil:', error);
            alert('Error al actualizar el perfil');
            this.isLoading = false;
          }
        });
      }
    } else {
      console.warn('Formulario inválido. Por favor verifique los campos.');
      this.profileForm.markAllAsTouched();
    }
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
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
    this.router.navigate(['/']);
  }

  isInvalidField(field: string): boolean {
    const control = this.profileForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}