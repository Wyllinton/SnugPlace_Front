export interface UpdateAccommodationDTO {
  title: string;
  description: string;
  priceDay: number;
  guestsCount: number;
  services: string[];
  images: ImageDTO[];
}

export interface ImageDTO {
  url: string;
  cloudinaryId: string;
  isMainImage: boolean;
}