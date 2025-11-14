import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PlaceCardDTO } from '../../models/place-dto';
import { TokenService } from '../../services/token-service';
import { AccommodationService } from '../../services/accommodations-service';

@Component({
  selector: 'app-accommodation-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accommodation-card.html',
  styleUrls: ['./accommodation-card.css']
})
export class AccommodationCardComponent implements OnInit {
  @Input() accommodation!: PlaceCardDTO;
  
  isOwner: boolean = false;
  isLoading: boolean = true;
  navigationLoading: boolean = false;

  constructor(
    private tokenService: TokenService,
    private accommodationService: AccommodationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkIfUserIsOwner();
  }

  /**
   * Verifica si el usuario autenticado es el dueño del alojamiento
   */
  private checkIfUserIsOwner(): void {
    // Si no hay usuario autenticado, no es owner
    if (!this.tokenService.isLogged()) {
      console.log('❌ Usuario no autenticado');
      this.isOwner = false;
      this.isLoading = false;
      return;
    }

    const currentUserId = this.tokenService.getUserId();
    console.log('👤 Usuario actual ID:', currentUserId);
    console.log('🏠 Alojamiento ID:', this.accommodation.id);

    // Obtener detalles completos del alojamiento para verificar el host
    this.accommodationService.getAccommodationDetails(this.accommodation.id).subscribe({
      next: (response) => {
        console.log('📋 Respuesta detalles alojamiento:', response);
        
        if (!response.error && response.content) {
          const accommodationDetails = response.content;
          console.log('🏡 Host del alojamiento:', accommodationDetails.host);
          console.log('🆔 ID del host:', accommodationDetails.host?.id);
          
          // Asegurarnos de comparar números con números
          const hostId = Number(accommodationDetails.host?.id);
          const userId = Number(currentUserId);
          
          console.log('🔢 Host ID (number):', hostId);
          console.log('🔢 User ID (number):', userId);
          
          // Verificar si el usuario actual es el host del alojamiento
          this.isOwner = hostId === userId;
          console.log('✅ ¿Es owner?:', this.isOwner);
        } else {
          console.log('❌ Error en respuesta o sin contenido');
          this.isOwner = false;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('💥 Error obteniendo detalles:', error);
        this.isOwner = false;
        this.isLoading = false;
      }
    });
  }

  /**
   * Maneja el click en la card - Navegación programática
   */
  async onCardClick(): Promise<void> {
    if (this.navigationLoading) {
      return;
    }

    this.navigationLoading = true;
    console.log('🎯 Iniciando navegación...');
    console.log('👑 Es owner?:', this.isOwner);

    // Pequeño delay para que se vea el loading
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      if (this.isOwner) {
        console.log('📍 Navegando a accommodation-detail');
        this.router.navigate(['/accommodation', this.accommodation.id]);
      } else {
        console.log('📍 Navegando a accommodation-detail-user');
        this.router.navigate(['/accommodation-detail', this.accommodation.id]);
      }
    } catch (error) {
      console.error('💥 Error en navegación:', error);
    } finally {
      this.navigationLoading = false;
    }
  }

  /**
   * Genera un array de estrellas para mostrar la calificación
   */
  getStarsArray(): boolean[] {
    const rating = Math.round(this.accommodation.averageRating || 0);
    return Array(5).fill(false).map((_, index) => index < rating);
  }

  /**
   * Formatea el precio con separadores de miles
   */
  formatPrice(price: number): string {
    return price.toLocaleString('es-CO');
  }

  /**
   * Maneja el error de carga de imagen
   */
  onImageError(event: any): void {
    event.target.src = 'https://res.cloudinary.com/ddm5k1z0t/image/upload/v1763084357/Gemini_Generated_Image_8eawas8eawas8eaw_notjjr.png';
  }
}