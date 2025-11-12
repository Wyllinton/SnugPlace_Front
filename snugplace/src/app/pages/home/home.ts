import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  
  showFilters = false;
  
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
    this.updatePriceDisplay();
  }

  applyFilters() {
    console.log('Aplicando filtros:', this.filters);
    this.handleSearch();
    this.closeFilters();
  }

  handleSearch() {
    const searchData = {
      ...this.filters,
      minPrice: this.filters.minPrice > 0 ? this.filters.minPrice : null,
      maxPrice: this.filters.maxPrice < 1000000 ? this.filters.maxPrice : null,
      services: this.filters.services.length > 0 ? this.filters.services : null
    };

    console.log('Búsqueda con filtros:', searchData);
    alert('¡Búsqueda iniciada! Revisa la consola para ver los filtros aplicados.');
  }
}