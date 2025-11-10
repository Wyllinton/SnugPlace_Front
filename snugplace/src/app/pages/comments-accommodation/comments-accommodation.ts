import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Booking {
  id: number;
  accommodationId: number;
  accommodationName: string;
  chechkOutDate: string;
}

@Component({
  selector: 'app-comments-accommodation',
  imports: [],
  templateUrl: './comments-accommodation.html',
  styleUrls: ['./comments-accommodation.css']
})

export class CommentsAccommodation implements OnInit {
  @Input() booking!: Booking;
  
  commentForm!: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
  
  //Rating 
  calificacionHover = 0;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.commentForm = this.fb.group({
      calification: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  setRating(rating: number): void {
    this.commentForm.patchValue({ calificacion: rating });
  }

  onCalificationHover(rating: number): void {
    this.calificacionHover = rating;
  }

  resetHover(): void {
    this.calificacionHover = 0;
  }

  getCalificationShown(): number {
    return this.calificacionHover || this.commentForm.get('calificacion')?.value || 0;
  }

  onSubmit(): void {
    if (this.commentForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const commentData = {
        bookingId: this.booking.id,
        accommodationId: this.booking.accommodationId,
        calificacion: this.commentForm.value.calificacion,
        comentario: this.commentForm.value.comentario
      };

      console.log('Crear comentario:', commentData);

      // Aquí iría la llamada al servicio
      setTimeout(() => {
        this.loading = false;
        this.successMessage = 'Comentario publicado exitosamente. ¡Gracias por tu opinión!';
        this.commentForm.reset();
      }, 1500);
    } else {
      this.commentForm.markAllAsTouched();
      this.errorMessage = 'Por favor completa todos los campos';
    }
  }

  showError(field: string): boolean {
    const control = this.commentForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Spanish wrappers used by the template
  mostrarError(field: string): boolean {
    return this.showError(field);
  }

  getErrorMessage(field: string): string {
    const control = this.commentForm.get(field);
    if (!control || !control.errors) return '';

    const errors = control.errors;

    if (errors['required']) return 'Este campo es obligatorio';
    if (errors['min']) return 'Debes seleccionar una calificación';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;

    return 'Campo inválido';
  }

  // Spanish wrapper for error message retrieval used by template
  obtenerMensajeError(field: string): string {
    return this.getErrorMessage(field);
  }
}
