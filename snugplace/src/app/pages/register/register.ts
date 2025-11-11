import { Component } from '@angular/core';
import { AbstractControlOptions, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router'; // Importar Router
import { UserService } from '../../services/user-service';
import Swal from 'sweetalert2';
import { CreateUserDTO } from '../../models/create-user-dto';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {

  registerForm!: FormGroup;
  
  constructor(
    private formBuilder: FormBuilder, 
    private userService: UserService,
    private router: Router // Inyectar Router
  ) {
    this.createForm();
  }

  private createForm() {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.maxLength(10)]],
      profilePhoto: [''],
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

  public createUser() {
    // Obtenemos los datos del formulario y los convertimos a CreateUserDTO
    const createUserDTO = this.registerForm.value as CreateUserDTO;

    this.userService.register(createUserDTO).subscribe({
      next: (data) => {
        // Mostramos el mensaje de éxito del backend
        Swal.fire({
          title: 'Éxito',
          text: data.content,
          icon: 'success',
          timer: 2000, // Cierra automáticamente después de 2 segundos
          showConfirmButton: false
        }).then(() => {
          // Redirigir al login después de que se cierre el SweetAlert
          this.router.navigate(['/login']);
        });
      },
      error: (error) => {
        // Mostramos el mensaje de error del backend
        Swal.fire({
          title: 'Error',
          text: error.error.content,
          icon: 'error'
        });
      }
    });
  }

  public passwordsMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('repeatPassword')?.value; // Corregí esto - debe ser repeatPassword

    // Si las contraseñas no coinciden, devuelve un error, de lo contrario, null
    return password == confirmPassword ? null : { passwordsMismatch: true };
  }
}