import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { LoginDTO } from '../../models/login-dto';
import { AuthService } from '../../services/auth-service';
import { TokenService } from '../../services/token-service';
import { AuthResponseDTO } from '../../models/auth-response-dto'; // ✅ Nuevo modelo

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {

  loginForm!: FormGroup;
  
  constructor(
    private formBuilder: FormBuilder, 
    private authService: AuthService, 
    private tokenService: TokenService, 
    private router: Router
  ) {
    this.createForm();
  }

  private createForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.maxLength(20), Validators.minLength(8)]]
    });
  }

  public login() {
    const loginDTO = this.loginForm.value as LoginDTO;

    this.authService.login(loginDTO).subscribe({
      next: (authResponse: AuthResponseDTO) => { // ✅ Cambiado
        // ✅ Ahora accedemos directamente al token
        this.tokenService.login(authResponse.token);
        this.router.navigate(['/']).then(() => window.location.reload());
      },
      error: (error) => {
        console.error('Error completo:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'Credenciales inválidas'
        });
      }
    });
  }
}