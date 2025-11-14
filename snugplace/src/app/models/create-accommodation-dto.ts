// En accommodations-service.ts - ACTUALIZAR PARA COINCIDIR EXACTAMENTE
export interface CreateAccommodationDTO {
  host: HostDTO;                    // ✅ Objeto HostDTO
  title: string;
  description: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  priceDay: number;
  guestsCount: number;
  averageRating: number;            // ✅ Requerido
  status: string;                   // ✅ Requerido - "ACTIVE", "INACTIVE", etc.
  services: string[];               // ✅ Lista de servicios (WIFI, PARKING, etc.)
  images: any[];                    // ✅ Set en backend, pero array en frontend
  comments?: any[];                 // ✅ Opcional
}

export interface HostDTO {
  id: string;                       // ✅ Solo necesita el ID según tu prueba HTTP
}

export interface ImageDTO {
  url: string;
  cloudinaryId: string;
  isMainImage: boolean;
}