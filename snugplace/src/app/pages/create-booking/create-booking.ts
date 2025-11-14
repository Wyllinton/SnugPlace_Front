import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BookingService, CreateBookingDTO } from '../../services/booking-service';
import { AccommodationService } from '../../services/accommodations-service';
import { ResponseDTO } from '../../models/response-dto';
import Swal from 'sweetalert2';

// Interface que coincide con PlaceDTO del backend
interface Accommodation {
  id: number;
  title: string;
  priceDay: number;
  guestsCount: number;
  images: any[];
  city: string;
  address: string;
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
  accommodationId!: number;
  accommodation!: Accommodation;

  bookingForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Calculations
  numNights = 0;
  totalPrice = 0;

  // Invalid Dates
  invalidDates: Date[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private accommodationService: AccommodationService
  ){}

  ngOnInit(): void {
    this.loadAccommodationData();
  }

  private loadAccommodationData(): void {
    this.route.params.subscribe(params => {
      console.log('🔄 Params recibidos:', params);
      
      // ✅ CONVERSIÓN SEGURA DEL ID - Mismo patrón que EditAccommodation
      const idParam = params['id'];
      if (idParam && !isNaN(Number(idParam))) {
        this.accommodationId = Number(idParam);
        console.log('✅ ID válido:', this.accommodationId);
        this.getAccommodationDetails();
      } else {
        console.error('❌ ID inválido:', idParam);
        this.showError('ID de alojamiento inválido');
        this.router.navigate(['/home']);
      }
    });
  }

  private getAccommodationDetails(): void {
    this.loading = true;
    console.log('🔍 Obteniendo detalles para ID:', this.accommodationId);
    
    this.accommodationService.getAccommodationDetails(this.accommodationId)
      .subscribe({
        next: (response: ResponseDTO<any>) => {
          if (!response.error && response.content) {
            this.accommodation = this.mapPlaceDTOToAccommodation(response.content);
            console.log('✅ Alojamiento cargado:', this.accommodation);
            console.log('🔍 ID del alojamiento:', this.accommodation.id);
            
            this.initializeForm();
            this.loadUnavailableDates();
            this.setupCalculations();
          } else {
            this.showError('No se pudieron cargar los datos del alojamiento');
            this.router.navigate(['/home']);
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading accommodation:', error);
          this.loading = false;
          this.showError('Error al cargar los datos del alojamiento');
        }
      });
  }

  private mapPlaceDTOToAccommodation(placeDTO: any): Accommodation {
    console.log('🗺️ Mapeando accommodation a place:', placeDTO);

    // ✅ VERIFICAR DIFERENTES POSIBLES UBICACIONES DEL ID
    let id = placeDTO.id;
    
    // Si no está en id, buscar en otras propiedades comunes
    if (!id) {
      id = placeDTO.accommodationId || placeDTO.placeId;
      console.log('🔄 ID obtenido de propiedad alternativa:', id);
    }

    // ✅ SI TODAVÍA NO HAY ID, USAR EL ID QUE YA TENEMOS DE LA RUTA
    if (!id || isNaN(Number(id))) {
      console.log('⚠️ No se encontró ID en los datos, usando ID de la ruta:', this.accommodationId);
      id = this.accommodationId;
    }

    const mainImageUrl = placeDTO.mainImage?.url || placeDTO.mainImage || '';
    
    return {
      id: Number(id), // ✅ Asegurar que sea número
      title: placeDTO.title || 'Sin título',
      priceDay: placeDTO.priceDay || 0,
      guestsCount: placeDTO.guestsCount || 1,
      images: mainImageUrl ? [mainImageUrl] : [],
      city: placeDTO.city || 'Sin ciudad',
      address: placeDTO.address || 'Sin dirección'
    };
  }

  // Método para obtener la URL de la imagen principal
  getMainImageUrl(): string {
    if (!this.accommodation || !this.accommodation.images || this.accommodation.images.length === 0) {
      return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop';
    }
    
    // Si images es un array de ImageDTO, tomar la primera URL
    if (typeof this.accommodation.images[0] === 'object' && 'url' in this.accommodation.images[0]) {
      return (this.accommodation.images[0] as any).url;
    }
    
    // Si es un array de strings, tomar el primer elemento
    return this.accommodation.images[0] as string;
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
        Validators.max(this.accommodation?.guestsCount || 1)
      ]],
      comments: ['', [Validators.maxLength(500)]]
    }, {
      validators: [
        this.checkDates(),
        this.checkAvailability()
      ]
    });
  }

  setupCalculations(): void {
    // Recalculate when the dates change
    this.bookingForm.get('checkInDate')?.valueChanges.subscribe(() => {
      this.calculateBooking();
    });

    this.bookingForm.get('checkOutDate')?.valueChanges.subscribe(() => {
      this.calculateBooking();
    });

    // Initial Calculate
    this.calculateBooking();
  }

  loadUnavailableDates(): void {
    // En una implementación real, esto vendría del backend
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

      if (firstDate < today) {
        return { pastDate: true };
      }

      if (lastDate <= firstDate) {
        return { invalidDate: true };
      }

      const differenceDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      if (differenceDays < 1) {
        return { minimumNights: true };
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

      let currentDate = new Date(firstDate);
      while (currentDate < lastDate) {
        const isBusy = this.invalidDates.some(invalidDate => 
          invalidDate.toDateString() === currentDate.toDateString()
        );

        if (isBusy) {
          return { dateNotAvailable: true };
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

    this.numNights = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

    if (this.numNights > 0 && this.accommodation) {
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
    if (this.bookingForm.valid && this.accommodation) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formData = this.bookingForm.value;

      // ✅ VERIFICAR QUE EL ID DEL ALOJAMIENTO SEA VÁLIDO - Mismo patrón que EditAccommodation
      if (!this.accommodation.id || isNaN(this.accommodation.id)) {
        this.loading = false;
        this.showError('ID de alojamiento inválido');
        return;
      }

      const bookingData: CreateBookingDTO = {
        idAccommodation: this.accommodation.id, // ✅ Usar el ID que ya verificamos
        dateCheckIn: formData.checkInDate,
        dateCheckOut: formData.checkOutDate,
        guestsCount: formData.guestsCount,
        notes: formData.comments || undefined
      };

      console.log('📤 Enviando datos de reserva:', bookingData);
      console.log('🔍 Verificando idAccommodation:', bookingData.idAccommodation);

      this.bookingService.createBooking(bookingData).subscribe({
        next: (response) => {
          this.loading = false;
          if (!response.error) {
            this.successMessage = response.content;
            
            setTimeout(() => {
              this.router.navigate(['/my-bookings']);
            }, 2000);
          } else {
            this.errorMessage = response.content;
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error creating booking:', error);
          
          if (error.error && error.error.content) {
            this.errorMessage = error.error.content;
          } else {
            this.errorMessage = 'Error al procesar la reserva. Por favor, intenta nuevamente.';
          }
        }
      });
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
      if (formErrors['pastDate']) {
        errors.push('No puedes reservar fechas pasadas');
      }
      if (formErrors['invalidDate']) {
        errors.push('La fecha de salida debe ser posterior a la fecha de entrada');
      }
      if (formErrors['minimumNights']) {
        errors.push('La reserva debe ser de mínimo 1 noche');
      }
      if (formErrors['dateNotAvailable']) {
        errors.push('Las fechas seleccionadas no están disponibles');
      }
    }
    return errors;
  }
}