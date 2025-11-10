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