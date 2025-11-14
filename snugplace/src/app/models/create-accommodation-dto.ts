export interface CreateAccommodationDTO {
  host: HostDTO;                    // ✅ Agregar host
  title: string;
  description: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  priceDay: number;
  guestsCount: number;
  averageRating: number;            // ✅ Agregar
  status: string;                   // ✅ Agregar
  services: string[];
  images: any[];                    // ✅ Mantener como any[]
  comments?: any[];                 // ✅ Agregar opcional
}

export interface HostDTO {
  id: number;  // ✅ Cambiar a number
  name: string; // ✅ Agregar name
  email: string; // ✅ Agregar email
}

// Las demás interfaces (ImageDTO, SearchFilters, etc.) SE MANTIENEN IGUAL
export interface ImageDTO {
  url: string;
  cloudinaryId: string;
  isMainImage: boolean;
}