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
// DTO para crear alojamiento
export interface CreateAccommodationDTO {
  title: string;
  description: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  pricePerNight: number;
  maxGuests: number;
  services: string[];
  images: File[];
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
// Función helper para convertir FormData a DTO
export function formDataToAccommodationDTO(formValue: any, location: LocationDTO, files: File[]): CreateAccommodationDTO {
  return {
    title: formValue.title,
    description: formValue.description,
    city: formValue.city,
    address: formValue.address,
    latitude: location.latitude,
    longitude: location.longitude,
    pricePerNight: parseFloat(formValue.priceDay),
    maxGuests: parseInt(formValue.guestsCount),
    services: formValue.services || [],
    images: files
  };
}