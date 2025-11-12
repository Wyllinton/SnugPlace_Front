import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccommodationCardComponent } from '../../components/accommodation-card/accommodation-card';

// Importar interfaces necesarias
interface FilterData {
  city: string | null;
  checkIn: string | null;
  checkOut: string | null;
  minPrice: number;
  maxPrice: number;
  guestsCount: number;
  services: string[];
  page: number;
}

// Interfaz para los datos de la tarjeta de alojamiento
interface PlaceCardDTO {
  id: number;
  title: string;
  city: string;
  pricePerNight: number;
  mainImage: string;
  averageRating: number;
  reviewsCount: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, AccommodationCardComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  
  showFilters = false;
  
  // Datos de los alojamientos
  accommodations: PlaceCardDTO[] = [];
  loading = false;
  error: string | null = null;
  
  // Paginación
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 12;
  
  filters: FilterData = {
    city: null,
    checkIn: null,
    checkOut: null,
    minPrice: 0,
    maxPrice: 1000000,
    guestsCount: 1,
    services: [],
    page: 0
  };

  minPriceFormatted = '0';
  maxPriceFormatted = '1,000,000';

  ngOnInit() {
    this.initializeDates();
    this.updatePriceDisplay();
    this.loadAccommodations(); // Cargar alojamientos al iniciar
  }

  /**
   * Carga los alojamientos (versión mock para desarrollo)
   * TODO: Reemplazar con llamada al servicio HTTP cuando el backend esté listo
   */
  loadAccommodations() {
    this.loading = true;
    this.error = null;

    // Simulación de delay de red
    setTimeout(() => {
      try {
        // Datos de ejemplo
        this.accommodations = [
          {
            id: 1,
            title: 'Apartamento moderno en el centro',
            city: 'Bogotá',
            pricePerNight: 180000,
            mainImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
            averageRating: 4.8,
            reviewsCount: 45
          },
          {
            id: 2,
            title: 'Casa de playa frente al mar',
            city: 'Cartagena',
            pricePerNight: 450000,
            mainImage: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600&h=400&fit=crop',
            averageRating: 4.9,
            reviewsCount: 78
          },
          {
            id: 3,
            title: 'Cabaña acogedora en las montañas',
            city: 'Manizales',
            pricePerNight: 120000,
            mainImage: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=600&h=400&fit=crop',
            averageRating: 4.7,
            reviewsCount: 32
          },
          {
            id: 4,
            title: 'Loft urbano con terraza',
            city: 'Medellín',
            pricePerNight: 200000,
            mainImage: 'https://images.unsplash.com/photo-1502672260066-6bc35f0a1d5d?w=600&h=400&fit=crop',
            averageRating: 4.6,
            reviewsCount: 51
          },
          {
            id: 5,
            title: 'Villa de lujo con piscina',
            city: 'Santa Marta',
            pricePerNight: 550000,
            mainImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
            averageRating: 5.0,
            reviewsCount: 89
          },
          {
            id: 6,
            title: 'Apartamento estudiantil económico',
            city: 'Bucaramanga',
            pricePerNight: 85000,
            mainImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
            averageRating: 4.3,
            reviewsCount: 28
          },
          {
            id: 7,
            title: 'Penthouse con vista panorámica',
            city: 'Cali',
            pricePerNight: 380000,
            mainImage: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=600&h=400&fit=crop',
            averageRating: 4.9,
            reviewsCount: 67
          },
          {
            id: 8,
            title: 'Casa campestre con jacuzzi',
            city: 'Pereira',
            pricePerNight: 220000,
            mainImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop',
            averageRating: 4.8,
            reviewsCount: 44
          },
          {
            id: 9,
            title: 'Estudio minimalista céntrico',
            city: 'Armenia',
            pricePerNight: 95000,
            mainImage: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop',
            averageRating: 4.5,
            reviewsCount: 36
          },
          {
            id: 10,
            title: 'Finca turística con actividades',
            city: 'Ibagué',
            pricePerNight: 280000,
            mainImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
            averageRating: 4.7,
            reviewsCount: 55
          },
          {
            id: 11,
            title: 'Apartamento familiar espacioso',
            city: 'Barranquilla',
            pricePerNight: 165000,
            mainImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop',
            averageRating: 4.6,
            reviewsCount: 41
          },
          {
            id: 12,
            title: 'Suite romántica con chimenea',
            city: 'Pasto',
            pricePerNight: 140000,
            mainImage: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&h=400&fit=crop',
            averageRating: 4.9,
            reviewsCount: 62
          }
        ];

        // Aplicar filtros si existen
        this.accommodations = this.applyLocalFilters(this.accommodations);

        // Simular paginación
        this.totalElements = this.accommodations.length;
        this.totalPages = Math.ceil(this.totalElements / this.pageSize);

        this.loading = false;
      } catch (err) {
        this.error = 'Error al cargar los alojamientos. Por favor, intenta de nuevo.';
        this.loading = false;
        console.error('Error:', err);
      }
    }, 800); // Simula delay de red
  }

  /**
   * Aplica filtros localmente (para desarrollo)
   * TODO: Eliminar cuando se integre con el backend
   */
  private applyLocalFilters(accommodations: PlaceCardDTO[]): PlaceCardDTO[] {
    let filtered = [...accommodations];

    // Filtrar por ciudad
    if (this.filters.city) {
      filtered = filtered.filter(acc => 
        acc.city.toLowerCase().includes(this.filters.city!.toLowerCase())
      );
    }

    // Filtrar por precio
    if (this.filters.minPrice > 0) {
      filtered = filtered.filter(acc => acc.pricePerNight >= this.filters.minPrice);
    }
    if (this.filters.maxPrice < 1000000) {
      filtered = filtered.filter(acc => acc.pricePerNight <= this.filters.maxPrice);
    }

    return filtered;
  }

  /**
   * Cambia de página en la paginación
   */
  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.filters.page = page;
      this.loadAccommodations();
      
      // Scroll hacia arriba suavemente
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Genera array de páginas para la paginación
   */
  getPageNumbers(): number[] {
    const maxPagesToShow = 5;
    const pages: number[] = [];
    
    let startPage = Math.max(0, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  initializeDates() {
    const today = new Date().toISOString().split('T')[0];
    // Puedes establecer valores iniciales aquí si es necesario
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  closeFilters() {
    this.showFilters = false;
  }

  updatePriceRange() {
    // Asegurar que los valores no se crucen
    if (this.filters.minPrice >= this.filters.maxPrice - 10000) {
      if (this.filters.minPrice > 0) {
        this.filters.maxPrice = this.filters.minPrice + 10000;
      } else {
        this.filters.minPrice = Math.max(0, this.filters.maxPrice - 10000);
      }
    }
    this.updatePriceDisplay();
  }

  updatePriceDisplay() {
    this.minPriceFormatted = this.formatNumber(this.filters.minPrice);
    this.maxPriceFormatted = this.formatNumber(this.filters.maxPrice);
  }

  updatePriceFromInput(type: 'min' | 'max') {
    if (type === 'min') {
      const parsedValue = this.parseNumber(this.minPriceFormatted);
      this.filters.minPrice = Math.max(0, Math.min(parsedValue, 1000000));
    } else {
      const parsedValue = this.parseNumber(this.maxPriceFormatted);
      this.filters.maxPrice = Math.max(0, Math.min(parsedValue, 1000000));
    }
    
    // Asegurar que min no sea mayor que max
    if (this.filters.minPrice > this.filters.maxPrice) {
      if (type === 'min') {
        this.filters.maxPrice = this.filters.minPrice + 10000;
      } else {
        this.filters.minPrice = Math.max(0, this.filters.maxPrice - 10000);
      }
    }
    
    this.updatePriceDisplay();
  }

  formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  parseNumber(str: string): number {
    return parseInt(str.replace(/,/g, '')) || 0;
  }

  toggleService(serviceValue: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;
    
    if (isChecked) {
      if (!this.filters.services.includes(serviceValue)) {
        this.filters.services.push(serviceValue);
      }
    } else {
      this.filters.services = this.filters.services.filter(s => s !== serviceValue);
    }
  }

  isServiceSelected(serviceValue: string): boolean {
    return this.filters.services.includes(serviceValue);
  }

  clearFilters() {
    this.filters = {
      city: null,
      checkIn: null,
      checkOut: null,
      minPrice: 0,
      maxPrice: 1000000,
      guestsCount: 1,
      services: [],
      page: 0
    };
    this.currentPage = 0;
    this.updatePriceDisplay();
    this.loadAccommodations();
  }

  applyFilters() {
    this.currentPage = 0;
    this.filters.page = 0;
    this.loadAccommodations();
    this.closeFilters();
  }

  handleSearch() {
    this.applyFilters();
  }
}