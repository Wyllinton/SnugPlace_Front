import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccommodationCardComponent } from '../../components/accommodation-card/accommodation-card';
import { PaginationComponent } from '../../components/pagination/pagination';
import { AccommodationService, SearchFilters } from '../../services/accommodations-service';
import { PlaceCardDTO } from '../../models/place-dto';
import { ResponseListDTO } from '../../models/response-list-dto';

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
  imports: [RouterModule, CommonModule, FormsModule, AccommodationCardComponent, PaginationComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  
  showFilters = false;
  
  accommodations: PlaceCardDTO[] = [];
  loading = false;
  error: string | null = null;
  
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 8;
  
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

  loadAccommodations() {
  this.debugFilterState();
  console.log('🔄 Cargando alojamientos con filtros...', this.filters);
  this.loading = true;
  this.error = null;

  // ✅ VALIDAR: Fechas lógicas
  if (this.filters.checkIn && this.filters.checkOut) {
    const checkInDate = new Date(this.filters.checkIn);
    const checkOutDate = new Date(this.filters.checkOut);
    
    if (checkOutDate <= checkInDate) {
      this.error = 'La fecha de salida debe ser posterior a la de llegada';
      this.loading = false;
      return;
    }
  }

  const searchFilters: SearchFilters = {
    city: this.filters.city || null,
    checkIn: this.filters.checkIn || null,
    checkOut: this.filters.checkOut || null,
    minPrice: this.filters.minPrice,
    maxPrice: this.filters.maxPrice, // ✅ Asegurar que esto no sea null
    guestsCount: this.filters.guestsCount, // ✅ Asegurar que esto no sea null
    services: this.filters.services.length > 0 ? this.filters.services : [],
    page: this.currentPage,
    size: this.pageSize
  };

  // ✅ VALIDAR que los valores numéricos no sean null/undefined
  if (searchFilters.minPrice == null) searchFilters.minPrice = 0;
  if (searchFilters.maxPrice == null) searchFilters.maxPrice = 1000000;
  if (searchFilters.guestsCount == null) searchFilters.guestsCount = 1;

  console.log('🎯 Filtros aplicados al servicio:', searchFilters);

  this.placesService.searchFilteredAccommodations(searchFilters).subscribe({
    next: (response: any) => {
      console.log('✅ Respuesta del backend:', response);
      
      if (!response.error) {
        this.accommodations = response.data || [];
        
        // ✅ USAR LOS VALORES REALES DEL BACKEND, no forzar
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        this.currentPage = response.currentPage || 0;
        
        console.log('📊 Información de paginación REAL:', {
          accommodations: this.accommodations.length,
          totalElements: this.totalElements,
          totalPages: this.totalPages,
          currentPage: this.currentPage
        });
        
      } else {
        this.error = response.message || 'Error al cargar los alojamientos';
        console.error('❌ Error en respuesta:', this.error);
        this.accommodations = [];
        this.totalElements = 0;
        this.totalPages = 0;
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('💥 Error en suscripción:', err);
      this.error = 'Error de conexión con el servidor. Intenta nuevamente.';
      this.loading = false;
      this.accommodations = [];
      this.totalElements = 0;
      this.totalPages = 0;
    }
  });
}

  changePage(page: number) {
    console.log('📄 Cambiando a página:', page);
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadAccommodations();
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ... (el resto de tus métodos se mantienen igual)
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
    this.closeFilters();
  }

  applyFilters() {
  console.log('✅ Aplicando filtros:', this.filters);
  console.log('🎯 FILTROS ANTES DE ENVIAR:');
  console.log('📍 Ciudad:', this.filters.city);
  console.log('💰 Precio min:', this.filters.minPrice);
  console.log('💰 Precio max:', this.filters.maxPrice);
  console.log('👥 Huéspedes:', this.filters.guestsCount);
  console.log('🔧 Servicios:', this.filters.services);
  
  // ✅ VALIDAR: Precios lógicos
  if (this.filters.minPrice > this.filters.maxPrice) {
    const temp = this.filters.minPrice;
    this.filters.minPrice = this.filters.maxPrice;
    this.filters.maxPrice = temp;
    this.updatePriceDisplay();
  }
  
  this.currentPage = 0;
  this.filters.page = 0;
  this.loadAccommodations();
  this.closeFilters();
}

  handleSearch() {
    console.log('🔍 Ejecutando búsqueda');
    this.applyFilters();
  }

  private debugFilterState() {
  console.log('🔍 ESTADO ACTUAL DE FILTROS:');
  console.log('📍 Ciudad:', this.filters.city);
  console.log('📅 Check-in:', this.filters.checkIn);
  console.log('📅 Check-out:', this.filters.checkOut);
  console.log('💰 Precio min/max:', this.filters.minPrice, '-', this.filters.maxPrice);
  console.log('👥 Huéspedes:', this.filters.guestsCount);
  console.log('🔧 Servicios:', this.filters.services);
  console.log('📄 Paginación:', this.currentPage, '/', this.totalPages);
}

hasActiveFilters(): boolean {
  return !!this.filters.city || 
         this.filters.guestsCount > 1 || 
         this.filters.services.length > 0 ||
         this.filters.minPrice > 0 || 
         this.filters.maxPrice < 1000000;
}

}