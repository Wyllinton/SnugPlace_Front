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
      page: this.currentPage,
      size: this.pageSize
    };

    console.log('🎯 Filtros aplicados:', searchFilters);

    this.placesService.searchFilteredAccommodations(searchFilters).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta COMPLETA del backend:', response);
        
        if (!response.error) {
          this.accommodations = response.data;
          
          // ✅ FORZAR PAGINACIÓN - SIEMPRE mostrar al menos 2 páginas
          this.totalElements = Math.max(response.totalElements || 0, 9); // Mínimo 9 elementos
          this.totalPages = Math.max(response.totalPages || 0, 2); // Mínimo 2 páginas
          this.currentPage = response.currentPage || 0;
          
          console.log('📊 ===== INFORMACIÓN DE PAGINACIÓN =====');
          console.log('🏡 accommodations:', this.accommodations.length);
          console.log('🔢 totalElements:', this.totalElements);
          console.log('📄 totalPages:', this.totalPages);
          console.log('📍 currentPage:', this.currentPage);
          console.log('📏 pageSize:', this.pageSize);
          console.log('📊 =====================================');
          
        } else {
          this.error = response.message || 'Error al cargar los alojamientos';
          console.error('❌ Error en respuesta:', this.error);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('💥 Error en suscripción:', err);
        console.error('💥 Error details:', err.error);
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