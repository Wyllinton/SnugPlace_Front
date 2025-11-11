// Interfaces basadas en los DTOs del backend
export interface MetricAccommodationDTO {
  idAccommodation: number;
  title: string;
  startDate: Date;
  endDate: Date;
  countBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  averageRating: number;
  totalIncomes: number;
}

export interface MetricRequestDTO {
  firstDate: Date;
  lastDate: Date;
}