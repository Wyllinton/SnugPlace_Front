export interface PlaceDTO {
    id: number;
    title: string;
    description: string;
    images: string[];
    services: string[];
    maxGuests: number;
    pricePerNight: number;
    hostId: string;
    address: AddressDTO;
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