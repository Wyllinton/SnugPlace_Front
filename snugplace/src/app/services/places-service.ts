import { Injectable } from '@angular/core';
import { PlaceDTO } from '../models/place-dto';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  places: PlaceDTO[];
  
  constructor(){
    this.places = this.createTestPlaces();
  }

  public getAll() {
    return this.places;
  }

  public save(newPlace: PlaceDTO) {
    newPlace.id = Math.floor(Math.random() * (5000 + 1)); // Genera un ID aleatorio entre 0 y 5000
    this.places.push(newPlace);
  }

  public get(id: number): PlaceDTO | undefined {
    return this.places.find(place => place.id == id); 
  }

  public delete(id: number) {
    this.places = this.places.filter(place => place.id != id);
  }

  public update(id: number, updatedPlace: PlaceDTO) {
    const indice = this.places.findIndex(place => place.id == id);
    if (indice != -1) {
      this.places[indice] = updatedPlace;
    }
  }

  private createTestPlaces(){

  return [
    {
      id: 1,
      title: 'Casa de Campo El Roble',
      description: 'Hermosa casa campestre con vista a las montañas y chimenea.',
      images: [
        'https://example.com/images/campo1.jpg',
        'https://example.com/images/campo2.jpg'
      ],
      services: ['WiFi', 'Parqueadero', 'Chimenea', 'Zona BBQ'],
      maxGuests: 6,
      pricePerNight: 250000,
      hostId: 'host_001',
      address: {
        city: 'Manizales',
        address: 'Vereda El Rosario, km 5 vía Neira',
        location: { latitude: 5.0703, longitude: -75.5138 }
      }
    },
    {
      id: 2,
      title: 'Apartamento Moderno en el Centro',
      description: 'Apartamento completamente amoblado, ideal para estancias cortas.',
      images: [
        'https://example.com/images/apto1.jpg',
        'https://example.com/images/apto2.jpg'
      ],
      services: ['WiFi', 'Ascensor', 'Aire acondicionado'],
      maxGuests: 3,
      pricePerNight: 180000,
      hostId: 'host_002',
      address: {
        city: 'Bogotá',
        address: 'Carrera 7 #45-20, Chapinero',
        location: { latitude: 4.6486, longitude: -74.0635 }
      }
    },
    {
      id: 3,
      title: 'Cabaña en el Lago Azul',
      description: 'Relájate en una cabaña frente al lago con acceso directo al muelle.',
      images: [
        'https://res.cloudinary.com/ddm5k1z0t/image/upload/v1760159810/app_name/k95km5l1guvyscl6byvs.png',
        'https://example.com/images/lago2.jpg'
      ],
      services: ['WiFi', 'Kayaks', 'Fogata', 'Restaurante'],
      maxGuests: 4,
      pricePerNight: 300000,
      hostId: 'host_003',
      address: {
        city: 'Guatapé',
        address: 'Orilla del embalse, sector El Peñol',
        location: { latitude: 6.2333, longitude: -75.1667 }
      }
    }
  ];

}
}