// accommodation-metric.component.ts - VERSIÓN CON DTOs CORRECTOS
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// Interfaces basadas en los DTOs del backend
export interface MetricAccommodationDTO {
  idAccommodation: number;
  title: string;
  startDate: string;  // LocalDate se convierte a string en formato ISO
  endDate: string;    // LocalDate se convierte a string en formato ISO
  countBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  averageRating: number;
  totalIncomes: number;
}

export interface MetricRequestDTO {
  firstDate: string;  // LocalDate en formato ISO
  lastDate: string;   // LocalDate en formato ISO
}

@Component({
  selector: 'app-accommodation-metric',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './accommodation-metric.html',
  styleUrls: ['./accommodation-metric.css']
})
export class AccommodationMetric implements OnInit {

  metricForm: FormGroup;
  currentMetric: MetricAccommodationDTO | null = null;
  accommodationId!: number;
  isLoading: boolean = false;
  hasSearched: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.metricForm = this.formBuilder.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.accommodationId = +params['id'];
      console.log('ID del alojamiento:', this.accommodationId);
      
      // Fechas por defecto (últimos 30 días) - convertidas a formato ISO
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      this.metricForm.patchValue({
        startDate: this.formatDateForInput(startDate),
        endDate: this.formatDateForInput(endDate)
      });

      // Cargar métricas automáticamente al inicio
      this.loadMockData();
    });
  }

  onFilter(): void {
    if (this.metricForm.invalid) return;
    
    this.isLoading = true;
    this.hasSearched = true;

    // Simular carga de datos
    setTimeout(() => {
      this.loadMockData();
      this.isLoading = false;
    }, 1000);
  }

  private loadMockData(): void {
    const startDate = this.metricForm.value.startDate;
    const endDate = this.metricForm.value.endDate;
    
    // Convertir a objetos Date para cálculos
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Calcular días del período para hacer datos más realistas
    const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    // Datos que varían según el período
    const baseBookings = Math.max(5, Math.floor(daysDiff / 10)); // Mínimo 5 reservas
    const randomFactor = 0.8 + Math.random() * 0.4; // Variación del 80% al 120%

    this.currentMetric = {
      idAccommodation: this.accommodationId,
      title: this.getAccommodationTitle(this.accommodationId),
      startDate: startDate, // Mantener como string en formato ISO
      endDate: endDate,     // Mantener como string en formato ISO
      countBookings: Math.floor(baseBookings * randomFactor),
      confirmedBookings: Math.floor(baseBookings * randomFactor * 0.8), // 80% confirmadas
      cancelledBookings: Math.floor(baseBookings * randomFactor * 0.1), // 10% canceladas
      completedBookings: Math.floor(baseBookings * randomFactor * 0.7), // 70% completadas
      averageRating: Number((3.5 + Math.random() * 1.5).toFixed(1)), // Rating entre 3.5 y 5.0
      totalIncomes: Math.floor(baseBookings * randomFactor * 250000) // Ingreso base $250,000 por reserva
    };

    console.log('📊 Datos mock cargados:', this.currentMetric);
  }

  // Método para preparar datos para enviar al backend
  private prepareRequestData(): MetricRequestDTO {
    return {
      firstDate: this.convertToLocalDateString(this.metricForm.value.startDate),
      lastDate: this.convertToLocalDateString(this.metricForm.value.endDate)
    };
  }

  // Convertir fecha a formato LocalDate (YYYY-MM-DD)
  private convertToLocalDateString(dateString: string): string {
    return dateString; // Ya está en formato YYYY-MM-DD desde el input date
  }

  // Formatear fecha para input date (YYYY-MM-DD)
  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Formatear fecha para mostrar (DD/MM/YYYY)
  formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private getAccommodationTitle(id: number): string {
    const titles: { [key: number]: string } = {
      1: 'Casa de Campo El Roble',
      2: 'Apartamento Moderno en el Centro', 
      3: 'Cabaña frente al Lago',
      4: 'Loft en Zona Norte',
      5: 'Penthouse con Vista al Mar'
    };
    return titles[id] || `Alojamiento #${id}`;
  }

  getConfirmationRate(): number {
    if (!this.currentMetric || this.currentMetric.countBookings === 0) return 0;
    return Number(((this.currentMetric.confirmedBookings / this.currentMetric.countBookings) * 100).toFixed(1));
  }

  getCompletionRate(): number {
    if (!this.currentMetric || this.currentMetric.confirmedBookings === 0) return 0;
    return Number(((this.currentMetric.completedBookings / this.currentMetric.confirmedBookings) * 100).toFixed(1));
  }

  getCancellationRate(): number {
    if (!this.currentMetric || this.currentMetric.countBookings === 0) return 0;
    return Number(((this.currentMetric.cancelledBookings / this.currentMetric.countBookings) * 100).toFixed(1));
  }

  formatCurrency(amount: number): string {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }
}