import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { BookingService, BookingDTO } from '../../services/booking-service';
import { TokenService } from '../../services/token-service';
import { AccommodationService } from '../../services/accommodations-service';

@Component({
  selector: 'app-my-bookings',
  imports: [RouterModule, CommonModule],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css'
})
export class MyBookings implements OnInit {

  allBookings: BookingDTO[] = [];
  filteredBookings: BookingDTO[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  currentFilter: string = '';
  accommodationTitles: Map<number, string> = new Map();
  accommodationLocations: Map<number, string> = new Map();
  userRole: string = '';

  constructor(
    private bookingService: BookingService,
    private accommodationService: AccommodationService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.userRole = this.tokenService.getRole();
    console.log('👤 Rol del usuario:', this.userRole);
    this.loadMyBookings();
  }

  private loadMyBookings(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('📅 Cargando mis reservas desde /my-bookings...');
    
    this.bookingService.getMyBookings().subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta de /my-bookings:', response);
        
        if (!response.error && response.content) {
          this.allBookings = response.content;
          this.filteredBookings = [...this.allBookings];
          console.log('📅 Reservas cargadas:', this.allBookings);
          
          // Cargar información de alojamientos
          this.loadAccommodationInfo();
        } else {
          this.errorMessage = response.message || 'Error al cargar las reservas';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('❌ Error cargando reservas:', err);
        this.errorMessage = 'No se pudieron cargar tus reservas. Intenta nuevamente.';
        this.isLoading = false;
        Swal.fire('Error', this.errorMessage, 'error');
      }
    });
  }

  private loadAccommodationInfo(): void {
    const accommodationIds = [...new Set(this.allBookings.map(booking => booking.idAccommodation))];
    
    console.log('🏠 IDs de alojamientos a cargar:', accommodationIds);
    
    if (accommodationIds.length === 0) {
      this.isLoading = false;
      return;
    }

    accommodationIds.forEach(accommodationId => {
      this.accommodationService.getAccommodationDetails(accommodationId).subscribe({
        next: (response: any) => {
          if (!response.error && response.content) {
            const accommodation = response.content;
            this.accommodationTitles.set(accommodationId, accommodation.title);
            this.accommodationLocations.set(accommodationId, accommodation.city || 'Ubicación no disponible');
            console.log(`✅ Info cargada para alojamiento ${accommodationId}:`, accommodation.title);
          }
        },
        error: (err) => {
          console.error(`Error cargando alojamiento ${accommodationId}:`, err);
          this.accommodationTitles.set(accommodationId, 'Alojamiento no disponible');
          this.accommodationLocations.set(accommodationId, 'Ubicación desconocida');
        },
        complete: () => {
          // Cuando terminamos de cargar todos
          if (Array.from(this.accommodationTitles.keys()).length === accommodationIds.length) {
            this.isLoading = false;
          }
        }
      });
    });
  }

  // FILTROS
  filterByStatus(status: string): void {
    this.currentFilter = status;
    if (status === '') {
      this.filteredBookings = [...this.allBookings];
    } else {
      this.filteredBookings = this.allBookings.filter(booking => booking.status === status);
    }
  }

  clearFilter(): void {
    this.currentFilter = '';
    this.filteredBookings = [...this.allBookings];
  }

  // VISTA Y ROL
  isHostView(): boolean {
    return this.userRole === 'HOST';
  }

  // INFORMACIÓN DE ALOJAMIENTO
  getAccommodationTitle(accommodationId: number): string {
    return this.accommodationTitles.get(accommodationId) || 'Cargando...';
  }

  getAccommodationLocation(accommodationId: number): string {
    return this.accommodationLocations.get(accommodationId) || '...';
  }

  // ESTADOS Y BADGES
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-warning text-dark';
      case 'CONFIRMED':
        return 'bg-success text-white';
      case 'CANCELED':
        return 'bg-danger text-white';
      case 'COMPLETED':
        return 'bg-info text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pendiente',
      'CONFIRMED': 'Confirmada',
      'CANCELED': 'Cancelada',
      'COMPLETED': 'Completada'
    };
    return statusMap[status] || status;
  }

  // LÓGICA DE RESERVAS
  canCancelBooking(status: string): boolean {
    return status === 'PENDING' || status === 'CONFIRMED';
  }

  isUpcomingBooking(checkInDate: string): boolean {
    const today = new Date();
    const checkIn = new Date(checkInDate);
    const diffTime = checkIn.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7; // Próximos 7 días
  }

  getNightsCount(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // ACCIONES
  viewBookingDetails(bookingId: number): void {
    console.log('🔍 Viendo detalles de reserva:', bookingId);
    
    const endpoint = this.isHostView() ? 
      this.bookingService.getBookingDetailHost(bookingId) : 
      this.bookingService.getBookingDetail(bookingId);

    endpoint.subscribe({
      next: (response: any) => {
        if (!response.error && response.content) {
          const bookingDetails = response.content;
          
          Swal.fire({
            title: `Detalles de Reserva #${bookingId}`,
            html: this.getBookingDetailsHtml(bookingDetails),
            icon: 'info',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#0d6efd',
            width: '600px'
          });
        } else {
          Swal.fire('Error', 'No se pudieron cargar los detalles de la reserva', 'error');
        }
      },
      error: (err) => {
        console.error('Error cargando detalles:', err);
        Swal.fire('Error', 'Error al cargar los detalles de la reserva', 'error');
      }
    });
  }

  private getBookingDetailsHtml(bookingDetails: any): string {
    const userInfo = this.isHostView() ? 
      `<p><strong>Huésped:</strong> ${bookingDetails.user.name} (${bookingDetails.user.email})</p>` : '';

    return `
      <div class="text-start">
        ${userInfo}
        <p><strong>Check-in:</strong> ${this.formatDate(bookingDetails.dateCheckIn)}</p>
        <p><strong>Check-out:</strong> ${this.formatDate(bookingDetails.dateCheckOut)}</p>
        <p><strong>Huéspedes:</strong> ${bookingDetails.guestsCount}</p>
        <p><strong>Precio Total:</strong> $${bookingDetails.price}</p>
        <p><strong>Estado:</strong> <span class="badge ${this.getStatusBadgeClass(bookingDetails.status)}">${this.getStatusText(bookingDetails.status)}</span></p>
        <p><strong>Fecha de creación:</strong> ${this.formatDateTime(bookingDetails.createdAt)}</p>
        ${bookingDetails.comments && bookingDetails.comments.length > 0 ? 
          `<p><strong>Comentarios:</strong> ${bookingDetails.comments.length} comentario(s)</p>` : 
          '<p><strong>Comentarios:</strong> Sin comentarios</p>'
        }
      </div>
    `;
  }

  cancelBooking(bookingId: number): void {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción cancelará tu reserva. ¿Deseas continuar?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No, mantener",
      confirmButtonColor: "#dc3545",
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Razón de cancelación',
          input: 'textarea',
          inputLabel: 'Por favor, indica la razón de la cancelación:',
          inputPlaceholder: 'Ej: Cambio de planes, problemas de fecha...',
          showCancelButton: true,
          confirmButtonText: 'Confirmar cancelación',
          cancelButtonText: 'Volver',
          inputValidator: (value) => {
            if (!value) {
              return 'Por favor, indica la razón de la cancelación';
            }
            return null;
          }
        }).then((reasonResult) => {
          if (reasonResult.isConfirmed) {
            this.bookingService.cancelBooking(bookingId, reasonResult.value).subscribe({
              next: (response) => {
                if (!response.error) {
                  // Actualizar el estado local de la reserva
                  const booking = this.allBookings.find(b => b.id === bookingId);
                  if (booking) {
                    booking.status = 'CANCELED';
                    this.filteredBookings = [...this.allBookings];
                  }
                  
                  Swal.fire({
                    title: "¡Cancelada!",
                    text: "Tu reserva ha sido cancelada correctamente.",
                    icon: "success",
                    confirmButtonText: "Aceptar"
                  });
                } else {
                  Swal.fire('Error', response.content, 'error');
                }
              },
              error: (err) => {
                console.error('Error cancelando:', err);
                Swal.fire('Error', 'No se pudo cancelar la reserva', 'error');
              }
            });
          }
        });
      }
    });
  }

  confirmBooking(bookingId: number): void {
    Swal.fire({
      title: "Confirmar Reserva",
      text: "¿Estás seguro de que deseas confirmar esta reserva?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, confirmar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#198754"
    }).then((result) => {
      if (result.isConfirmed) {
        this.bookingService.confirmBooking(bookingId).subscribe({
          next: (response) => {
            if (!response.error) {
              const booking = this.allBookings.find(b => b.id === bookingId);
              if (booking) {
                booking.status = 'CONFIRMED';
                this.filteredBookings = [...this.allBookings];
              }
              
              Swal.fire({
                title: "¡Confirmada!",
                text: "La reserva ha sido confirmada correctamente.",
                icon: "success",
                confirmButtonText: "Aceptar"
              });
            } else {
              Swal.fire('Error', response.content, 'error');
            }
          },
          error: (err) => {
            console.error('Error confirmando:', err);
            Swal.fire('Error', 'No se pudo confirmar la reserva', 'error');
          }
        });
      }
    });
  }

  cancelBookingByHost(bookingId: number): void {
    Swal.fire({
      title: "Rechazar Reserva",
      text: "¿Estás seguro de que deseas rechazar esta reserva?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, rechazar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545"
    }).then((result) => {
      if (result.isConfirmed) {
        this.bookingService.cancelBookingByHost(bookingId).subscribe({
          next: (response) => {
            if (!response.error) {
              const booking = this.allBookings.find(b => b.id === bookingId);
              if (booking) {
                booking.status = 'CANCELED';
                this.filteredBookings = [...this.allBookings];
              }
              
              Swal.fire({
                title: "¡Rechazada!",
                text: "La reserva ha sido rechazada correctamente.",
                icon: "success",
                confirmButtonText: "Aceptar"
              });
            } else {
              Swal.fire('Error', response.content, 'error');
            }
          },
          error: (err) => {
            console.error('Error rechazando:', err);
            Swal.fire('Error', 'No se pudo rechazar la reserva', 'error');
          }
        });
      }
    });
  }

  refresh(): void {
    this.loadMyBookings();
  }

  // FORMATEO DE FECHAS
  formatDate(date: string | Date): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES');
  }

  formatDateTime(dateTime: string | Date): string {
    if (!dateTime) return 'No disponible';
    return new Date(dateTime).toLocaleString('es-ES');
  }
}