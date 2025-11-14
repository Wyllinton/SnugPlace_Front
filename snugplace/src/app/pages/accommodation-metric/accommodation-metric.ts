import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MetricService, MetricAccommodationDTO } from '../../services/metric-accommodation-service';
import Swal from 'sweetalert2';

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
  accommodationTitle: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private metricService: MetricService
  ) {
    this.metricForm = this.formBuilder.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.accommodationId = +params['id'];
      console.log('🏠 ID del alojamiento:', this.accommodationId);
      
      if (isNaN(this.accommodationId) || this.accommodationId <= 0) {
        console.error('❌ ID de alojamiento inválido');
        Swal.fire('Error', 'ID de alojamiento no válido', 'error');
        this.router.navigate(['/my-places']);
        return;
      }

      // Establecer fechas por defecto (últimos 30 días hasta hoy)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      this.metricForm.patchValue({
        startDate: this.formatDateForInput(startDate),
        endDate: this.formatDateForInput(endDate)
      });

      // Cargar métricas automáticamente al inicio
      this.loadMetrics();
    });
  }

  onFilter(): void {
    if (this.metricForm.invalid) {
      Swal.fire('Error', 'Por favor completa ambas fechas', 'error');
      return;
    }

    this.loadMetrics();
  }

  private loadMetrics(): void {
    const startDate = this.metricForm.value.startDate;
    const endDate = this.metricForm.value.endDate;

    // Validación básica de fechas
    const validation = this.metricService.validateDateRange(startDate, endDate);
    if (!validation.valid) {
      Swal.fire('Error', validation.message, 'error');
      return;
    }

    this.isLoading = true;
    this.hasSearched = true;

    console.log('🔍 Solicitando métricas...');
    
    this.metricService.getAccommodationMetric(this.accommodationId, startDate, endDate)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          
          if (!response.error && response.content) {
            // Verificar si el content es un string (error) o un objeto (éxito)
            if (typeof response.content === 'string') {
              console.error('❌ El backend retornó un error:', response.content);
              Swal.fire('Error', response.content, 'error');
              this.currentMetric = null;
            } else {
              this.currentMetric = response.content as MetricAccommodationDTO;
              this.accommodationTitle = this.currentMetric.title;
              console.log('✅ Métricas cargadas correctamente:', this.currentMetric);
              
              Swal.fire({
                title: '¡Éxito!',
                text: 'Métricas cargadas correctamente',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
              });
            }
          } else {
            console.error('❌ Error en la respuesta del backend');
            const errorMessage = typeof response.content === 'string' 
              ? response.content 
              : 'No se pudieron cargar las métricas';
            
            Swal.fire('Error', errorMessage, 'error');
            this.currentMetric = null;
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Error en la petición:', error);
          Swal.fire('Error', 'Error de conexión al servidor', 'error');
          this.currentMetric = null;
        }
      });
  }

  // Formatear fecha para input date (YYYY-MM-DD)
  private formatDateForInput(date: Date): string {
    return this.metricService.formatDateForBackend(date);
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

  // Calcular ingreso promedio por reserva
  getAverageIncomePerBooking(): number {
    if (!this.currentMetric || this.currentMetric.countBookings === 0) return 0;
    return this.currentMetric.totalIncomes / this.currentMetric.countBookings;
  }

  // Calcular ingreso por reserva confirmada
  getIncomePerConfirmedBooking(): number {
    if (!this.currentMetric || this.currentMetric.confirmedBookings === 0) return 0;
    return this.currentMetric.totalIncomes / this.currentMetric.confirmedBookings;
  }

  // Calcular tasa de ocupación estimada (basada en días del período)
  getEstimatedOccupancyRate(): number {
    if (!this.currentMetric) return 0;
    
    const startDate = new Date(this.currentMetric.startDate);
    const endDate = new Date(this.currentMetric.endDate);
    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Asumir que cada reserva confirmada ocupa en promedio 3 días
    const estimatedOccupiedDays = this.currentMetric.confirmedBookings * 3;
    
    return Number(((estimatedOccupiedDays / daysInPeriod) * 100).toFixed(1));
  }
}