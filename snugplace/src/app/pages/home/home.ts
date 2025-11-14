import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccommodationCardComponent } from '../../components/accommodation-card/accommodation-card';
import { PaginationComponent } from '../../components/pagination/pagination'; // ✅ Importar el nuevo componente
import { AccommodationService, SearchFilters } from '../../services/accommodations-service';
import { PlaceCardDTO } from '../../models/place-dto';
import { ResponseListDTO } from '../../models/response-list-dto';

// Interfaz para los datos de filtro
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

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, AccommodationCardComponent, PaginationComponent], // ✅ Agregar PaginationComponent
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  
  showFilters = false;
  
  // Datos de los alojamientos
  accommodations: PlaceCardDTO[] = [];
  loading = false;
  error: string | null = null;
  
  // Paginación - ✅ CAMBIAR a 8 elementos por página
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 8; // ✅ Cambiar de 12 a 8
  
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

  constructor(private placesService: AccommodationService) {}

  ngOnInit() {
    console.log('🏠 Componente Home inicializado');
    this.initializeDates();
    this.updatePriceDisplay();
    this.loadAccommodations();
  }

  /**
   * Carga los alojamientos desde el backend
   */
  loadAccommodations() {
  console.log('🔄 Cargando alojamientos...');
  this.loading = true;
  this.error = null;

  const searchFilters: SearchFilters = {
    city: this.filters.city,
    checkIn: this.filters.checkIn,
    checkOut: this.filters.checkOut,
    minPrice: this.filters.minPrice,
    maxPrice: this.filters.maxPrice,
    guestsCount: this.filters.guestsCount,
    services: this.filters.services,
    page: this.currentPage, // ✅ Usar currentPage en lugar de filters.page
    size: this.pageSize
  };

  console.log('🎯 Filtros aplicados:', searchFilters);

  this.placesService.searchFilteredAccommodations(searchFilters).subscribe({
    next: (response: any) => {
      console.log('✅ Respuesta paginada recibida:', response);
      
      if (!response.error) {
        this.accommodations = response.data;
        
        // ✅ USAR LA INFORMACIÓN DE PAGINACIÓN DEL BACKEND
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        this.currentPage = response.currentPage || 0;
        
        console.log(`🏡 ${this.accommodations.length} alojamientos cargados`);
        console.log(`📊 Página ${this.currentPage + 1} de ${this.totalPages}, Total: ${this.totalElements}`);
        
      } else {
        this.error = response.message || 'Error al cargar los alojamientos';
        console.error('❌ Error en respuesta:', this.error);
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('💥 Error en suscripción:', err);
      this.error = 'Error de conexión con el servidor.';
      this.loading = false;
    }
  });
}

changePage(page: number) {
  console.log('📄 Cambiando a página:', page);
  if (page >= 0 && page < this.totalPages) {
    this.currentPage = page;
    this.loadAccommodations();
    
    // Scroll hacia arriba suavemente
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

  // ✅ ELIMINAR getPageNumbers() - Ahora está en el componente de paginación

  initializeDates() {
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Fechas inicializadas');
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
    console.log('🎛️ Filtros:', this.showFilters ? 'abiertos' : 'cerrados');
  }

  closeFilters() {
    this.showFilters = false;
    console.log('❌ Filtros cerrados');
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
    console.log('💰 Rango de precios actualizado:', this.filters.minPrice, '-', this.filters.maxPrice);
  }

  updatePriceDisplay() {
    this.minPriceFormatted = this.formatNumber(this.filters.minPrice);
    this.maxPriceFormatted = this.formatNumber(this.filters.maxPrice);
  }

  updatePriceFromInput(type: 'min' | 'max') {
    console.log('⌨️ Actualizando precio desde input:', type);
    
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
    
    console.log('🔧 Servicio', serviceValue, isChecked ? 'activado' : 'desactivado');
    
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
    console.log('🧹 Limpiando todos los filtros');
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
    console.log('✅ Aplicando filtros');
    this.currentPage = 0;
    this.filters.page = 0;
    this.loadAccommodations();
    this.closeFilters();
  }

  handleSearch() {
    console.log('🔍 Ejecutando búsqueda');
    this.applyFilters();
  }
}