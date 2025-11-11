// accommodation-metric.component.ts - VERSIÓN CORREGIDA
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-accommodation-metric',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './accommodation-metric.html',
  styleUrls: ['./accommodation-metric.css']
})
export class AccommodationMetric implements OnInit {

  metricForm: FormGroup;
  currentMetric: any = null;
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
      
      // Fechas por defecto (últimos 30 días)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      this.metricForm.patchValue({
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate)
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
    const startDate = new Date(this.metricForm.value.startDate);
    const endDate = new Date(this.metricForm.value.endDate);
    
    // Calcular días del período para hacer datos más realistas
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Datos que varían según el período
    const baseBookings = Math.max(5, Math.floor(daysDiff / 10)); // Mínimo 5 reservas
    const randomFactor = 0.8 + Math.random() * 0.4; // Variación del 80% al 120%

    this.currentMetric = {
      idAccommodation: this.accommodationId,
      title: this.getAccommodationTitle(this.accommodationId),
      startDate: startDate,
      endDate: endDate,
      countBookings: Math.floor(baseBookings * randomFactor),
      confirmedBookings: Math.floor(baseBookings * randomFactor * 0.8), // 80% confirmadas
      cancelledBookings: Math.floor(baseBookings * randomFactor * 0.1), // 10% canceladas
      completedBookings: Math.floor(baseBookings * randomFactor * 0.7), // 70% completadas
      averageRating: Number((3.5 + Math.random() * 1.5).toFixed(1)), // Rating entre 3.5 y 5.0
      totalIncomes: Math.floor(baseBookings * randomFactor * 250000) // Ingreso base $250,000 por reserva
    };

    console.log('📊 Datos mock cargados:', this.currentMetric);
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

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}