import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword {

  reset_passwordForm!: FormGroup;
  
  constructor(private formBuilder: FormBuilder) {
  this.createForm();
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

  public resetPassword(){
    const code =
    this.reset_passwordForm.value.codigo1 +
    this.reset_passwordForm.value.codigo2 +
    this.reset_passwordForm.value.codigo3 +
    this.reset_passwordForm.value.codigo4;

    console.log('Código ingresado:', code);
    console.log('Nueva contraseña:', this.reset_passwordForm.value.nuevaPassword);
  }

  ngAfterViewInit() {  //Cambia automaticamente el campo al ingresar el código
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
}