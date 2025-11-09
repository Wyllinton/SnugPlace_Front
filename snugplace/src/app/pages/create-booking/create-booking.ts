import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Accommodation {
  id: number;
  title: string;
  priceDay: number;
  guestsCount: number;
  mainImage: string;
  city: string;
  address: string
}

@Component({
  selector: 'app-create-booking',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './create-booking.html',
  styleUrls: ['./create-booking.css'],
})

export class CreateBooking implements OnInit {
  @Input() accommodation!: Accommodation;

  bookingForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage ='';

  //Calculations
  numNights = 0;
  totalPrice = 0;

  //Invalid Dates
  invalidDates: Date[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router 
  ){}

  ngOnInit(): void {
    this.initializeForm();
    this.loadUnavalaibleDates();
    this.calculations();
  }

  initializeForm(): void {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    this.bookingForm = this.fb.group({
      checkInDate: [this.formatDate(today), [Validators.required]],
      checkOutDate: [this.formatDate(tomorrow), [Validators.required]],
      guestsCount: [1, [
        Validators.required, 
        Validators.min(1), 
        Validators.max(this.accommodation.guestsCount)
      ]],
      comments: ['', [Validators.maxLength(500)]]
    }, {
      validators: [
        this.checkDates(),
        this.checkAvailability()
      ]
    });
  }

  calculations(): void {
    // Recalculate when the dates change
    this.bookingForm.get('checkInDate')?.valueChanges.subscribe(() => {
      this.calculateBooking();
    });

    this.bookingForm.get('checkOutDate')?.valueChanges.subscribe(() => {
      this.calculateBooking();
    });

    //Initial Calculate
    this.calculateBooking();
  }

  loadUnavalaibleDates(): void {
    // Simular carga de fechas ya reservadas
    // En producción, esto vendría del backend
    const today = new Date();
    this.invalidDates = [
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
    ];
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getMinDate(): string {
    return this.formatDate(new Date());
  }

  checkDates(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const checkInDate = group.get('checkInDate')?.value;
      const checkOutDate = group.get('checkOutDate')?.value;

      if (!checkInDate || !checkOutDate) return null;

      const firstDate = new Date(checkInDate);
      const lastDate = new Date(checkOutDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check the dates are not earlier 
      if (firstDate < today) {
        return { fechaPasada: true };
      }

      // Check the lastDate is after the firstDate
      if (lastDate <= firstDate) {
        return { fechaInvalida: true };
      }

      // Check min one night
      const differenceDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      if (differenceDays < 1) {
        return { minimoNoches: true };
      }

      return null;
    };
  }

  checkAvailability(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const checkInDate = group.get('checkInDate')?.value;
      const checkOutDate = group.get('checkOutDate')?.value;

      if (!checkInDate || !checkOutDate) return null;

      const firstDate = new Date(checkInDate);
      const lastDate = new Date(checkOutDate);

      //Check the dates
      let currentDate = new Date(firstDate);
      while (currentDate < lastDate) {
        const isBusy = this.invalidDates.some(invalidDate => 
          invalidDate.toDateString() === currentDate.toDateString()
        );

        if (isBusy) {
          return { fechaNoDisponible: true };
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return null;
    };
  }

  calculateBooking(): void {
    const checkInDate = this.bookingForm.get('checkInDate')?.value;
    const checkOutDate = this.bookingForm.get('checkOutDate')?.value;

    if (!checkInDate || !checkOutDate) {
      this.numNights = 0;
      this.totalPrice = 0;
      return;
    }

    const firstDate = new Date(checkInDate);
    const lastDate = new Date(checkOutDate);

    // Calculate the num of nights
    this.numNights = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate the total price
    if (this.numNights > 0) {
      this.totalPrice = this.numNights * this.accommodation.priceDay;
    } else {
      this.totalPrice = 0;
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  onSubmit(): void {
    if (this.bookingForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const bookingData = {
        accommodationId: this.accommodation.id,
        checkInDate: this.bookingForm.value.checkInDate,
        checkOutDate: this.bookingForm.value.checkOutDate,
        guestsCount: this.bookingForm.value.guestsCount,
        comments: this.bookingForm.value.comments,
        totalPrice: this.totalPrice,
        numNights: this.numNights
      };

      console.log('Create Booking:', bookingData);

      // Aquí iría la llamada al servicio
      setTimeout(() => {
        this.loading = false;
        this.successMessage = 'Reserva creada exitosamente. Te hemos enviado un correo de confirmación.';
        
        setTimeout(() => {
          this.router.navigate(['/mis-reservas']);
        }, 2000);
      }, 1500);
    } else {
      this.bookingForm.markAllAsTouched();
      this.errorMessage = 'Por favor corrige los errores en el formulario';
    }
  }

  showError(field: string): boolean {
    const control = this.bookingForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.bookingForm.get(field);
    if (!control || !control.errors) return '';

    const errors = control.errors;

    if (errors['required']) return 'Este campo es obligatorio';
    if (errors['min']) return `Mínimo ${errors['min'].min} huésped(es)`;
    if (errors['max']) return `Máximo ${errors['max'].max} huéspedes permitidos`;
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;

    return 'Campo inválido';
  }

  getErrors(): string[] {
    const errors: string[] = [];
    const formErrors = this.bookingForm.errors;

    if (formErrors) {
      if (formErrors['fechaPasada']) {
        errors.push('No puedes reservar fechas pasadas');
      }
      if (formErrors['fechaInvalida']) {
        errors.push('La fecha de salida debe ser posterior a la fecha de entrada');
      }
      if (formErrors['minimoNoches']) {
        errors.push('La reserva debe ser de mínimo 1 noche');
      }
      if (formErrors['fechaNoDisponible']) {
        errors.push('Las fechas seleccionadas no están disponibles');
      }
    }

    return errors;
  }
}
