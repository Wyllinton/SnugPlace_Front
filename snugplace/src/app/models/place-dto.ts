import { HostDTO, ImageDTO } from "./create-accommodation-dto";

export interface PlaceDTO {
  id: number;
  title: string;
  description: string;
  images: ImageDTO[];  // ✅ Cambiar a array de ImageDTO, no strings
  services: string[];
  guestsCount: number;  // ✅ Cambiar de maxGuests a guestsCount para coincidir con backend
  priceDay: number;     // ✅ Cambiar de pricePerNight a priceDay para coincidir con backend
  host: HostDTO;        // ✅ Agregar host object
  address: AddressDTO;
  averageRating?: number;
  reviewsCount?: number;
}

export interface AddressDTO{
    city: string;
    address: string;
    location: LocationDTO;
}

export interface LocationDTO{
    latitude: number;
    longitude: number;
}
// DTO simplificado para el listado en el home
export interface PlaceCardDTO {
  id: number;
  title: string;
  city: string;
  pricePerNight: number;
  mainImage: string; // Primera imagen de Cloudinary
  averageRating: number;
  reviewsCount: number;
}