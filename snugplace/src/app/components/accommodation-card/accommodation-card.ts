import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlaceCardDTO } from '../../models/place-dto';

@Component({
  selector: 'app-accommodation-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './accommodation-card.html',
  styleUrls: ['./accommodation-card.css']
})
export class AccommodationCardComponent {
  @Input() accommodation!: PlaceCardDTO;

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