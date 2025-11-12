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
}
