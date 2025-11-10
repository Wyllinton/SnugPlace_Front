import { Injectable } from '@angular/core';
import mapboxgl, { LngLatLike, Map, Marker, MapMouseEvent } from 'mapbox-gl';
import { Observable, Subject } from 'rxjs';
import { MarkerDTO } from '../models/marker-dto';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map: mapboxgl.Map | null = null;

  // Configuración inicial del mapa
  private readonly style = 'mapbox://styles/mapbox/streets-v12';
  private readonly defaultCenter: [number, number] = [-75.1667, 6.2333];
  private readonly defaultZoom = 12;
  private readonly MAPBOX_TOKEN = 'pk.eyJ1Ijoid3lsbGludG9uMDQiLCJhIjoiY21oc2p4dTRzMWJmODJqcWN3eTBzc2VtMSJ9.AJSk-GNk_JWO4tbnep4P-A';

  constructor() {
    //Token configurado globalmente al inicializar el servicio
    mapboxgl.accessToken = this.MAPBOX_TOKEN;
  }

  public buildMap(containerId: string = 'map'): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(` Error: el contenedor '${containerId}' no existe aún en el DOM.`);
      return;
    }

    try {
      // Elimina mapa anterior si ya existe
      if (this.map) {
        this.map.remove();
      }

      // Crear instancia del mapa
      this.map = new mapboxgl.Map({
        container: container,
        style: this.style,
        center: this.defaultCenter,
        zoom: this.defaultZoom,
      });

      // Agregar controles
      this.map.addControl(new mapboxgl.NavigationControl());

      // Evento de carga
      this.map.on('load', () => {
        console.log('Mapa cargado correctamente');
        this.map!.resize();
      });

      // Manejo de errores
      this.map.on('error', (e) => {
        console.error(' Error al cargar el mapa:', e);
      });
    } catch (error) {
      console.error('Error al crear el mapa:', error);
    }
  }

  // También puedes usar este nombre alternativo
  initializeMap(container: string = 'map'): void {
    this.buildMap(container);
  }

  private addMapEvents(): void {
    if (!this.map) return;

    this.map.on('load', () => {
      console.log('Mapa cargado correctamente');
    });

    this.map.on('error', (e) => {
      console.error('Error al cargar el mapa:', e);
    });
  }

  setCenter(lng: number, lat: number): void {
    if (this.map) {
      this.map.setCenter([lng, lat]);
    }
  }

  setZoom(zoom: number): void {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  public getMap(): mapboxgl.Map | null {
    return this.map;
  }
/**
   * Añade un marcador opcional con popup.
   */
  public addMarker(lng: number, lat: number, title?: string): void {
    if (!this.map) return;

    new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>${title || 'Ubicación'}</strong>`))
      .addTo(this.map);
  }
}