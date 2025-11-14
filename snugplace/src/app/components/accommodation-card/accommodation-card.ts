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
    event.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop';
  }
}