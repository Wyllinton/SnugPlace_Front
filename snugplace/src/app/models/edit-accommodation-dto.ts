export interface EditAccommodationDTO {
  title: string;
  description: string;
  priceDay: number;
  guestsCount: number;
  services: string[]; 
  images: ImageDTO[];
}

export interface ImageDTO {
  id?: number;
  url: string;
  altText?: string;
}