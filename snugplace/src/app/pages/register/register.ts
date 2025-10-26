import { Component } from '@angular/core';
import { AbstractControlOptions, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { repeat } from 'rxjs';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  registerForm!: FormGroup;
  
  constructor(private formBuilder: FormBuilder) {
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

  public createUser(){
    console.log(this.registerForm.value);
  }

  public passwordsMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmaPassword = formGroup.get('repeatPassword')?.value;

    // Si las contraseñas no coinciden, devuelve un error, de lo contrario, null
    return password == confirmaPassword ? null : { passwordsMismatch: true };
}

}