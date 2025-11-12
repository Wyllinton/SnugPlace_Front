import { Injectable } from '@angular/core';
import mapboxgl, { LngLatLike, Map, Marker, MapMouseEvent } from 'mapbox-gl';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map: mapboxgl.Map | null = null;
  private marker: mapboxgl.Marker | null = null;

  // Subject para emitir las coordenadas seleccionadas
  private selectedLocationSubject = new BehaviorSubject<LocationCoordinates | null>(null);
  public selectedLocation$: Observable<LocationCoordinates | null> = this.selectedLocationSubject.asObservable();

  // Configuración inicial del mapa
  private readonly style = 'mapbox://styles/mapbox/streets-v12';
  private readonly defaultCenter: [number, number] = [-75.6967, 4.5389]; // Armenia, Colombia
  private readonly defaultZoom = 12;
  private readonly MAPBOX_TOKEN = 'pk.eyJ1Ijoid3lsbGludG9uMDQiLCJhIjoiY21oc2p4dTRzMWJmODJqcWN3eTBzc2VtMSJ9.AJSk-GNk_JWO4tbnep4P-A';

  constructor() {
    mapboxgl.accessToken = this.MAPBOX_TOKEN;
  }

  /**
   * Construir mapa con opción de modo interactivo (para seleccionar ubicación)
   */
  public buildMap(containerId: string = 'map', interactive: boolean = false): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ Error: el contenedor '${containerId}' no existe aún en el DOM.`);
      return;
    }

    try {
      // Elimina mapa anterior si ya existe
      if (this.map) {
        this.map.remove();
        this.map = null;
      }

      // Limpiar marcador anterior
      if (this.marker) {
        this.marker.remove();
        this.marker = null;
      }

      // Crear instancia del mapa
      this.map = new mapboxgl.Map({
        container: container,
        style: this.style,
        center: this.defaultCenter,
        zoom: this.defaultZoom,
      });

      // Agregar controles
      this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Evento de carga - AQUÍ OCULTAMOS EL MENSAJE DE CARGA
      this.map.on('load', () => {
        console.log('✅ Mapa cargado correctamente');
        
        // CRÍTICO: Ocultar el mensaje de carga
        this.hideLoadingMessage(containerId);
        
        // Redimensionar el mapa
        this.map!.resize();
      });

      // Si es modo interactivo, agregar evento de click
      if (interactive) {
        this.setupInteractiveMode();
      }

      // Manejo de errores
      this.map.on('error', (e) => {
        console.error('❌ Error al cargar el mapa:', e);
        this.hideLoadingMessage(containerId);
      });
    } catch (error) {
      console.error('Error al crear el mapa:', error);
    }
  }

  /**
   * Ocultar mensaje de carga
   */
  private hideLoadingMessage(containerId: string): void {
    const loadingElement = document.querySelector(`#${containerId} .map-loading`);
    if (loadingElement) {
      (loadingElement as HTMLElement).style.display = 'none';
      console.log('✅ Mensaje de carga ocultado');
    }
  }

  /**
   * Configurar modo interactivo para selección de ubicación
   */
  private setupInteractiveMode(): void {
    if (!this.map) return;

    this.map.on('click', (e: MapMouseEvent) => {
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;
      
      this.updateMarker(lng, lat);
      this.emitSelectedLocation(lat, lng);
    });

    // Cambiar cursor a pointer
    this.map.getCanvas().style.cursor = 'pointer';
  }

  /**
   * Actualizar o crear marcador en el mapa
   */
  private updateMarker(lng: number, lat: number): void {
    if (!this.map) return;

    // Si ya existe un marcador, moverlo
    if (this.marker) {
      this.marker.setLngLat([lng, lat]);
    } else {
      // Crear nuevo marcador (arrastrable)
      this.marker = new mapboxgl.Marker({
        draggable: true,
        color: '#2e8b57' // Verde que coincide con tu tema
      })
      .setLngLat([lng, lat])
      .addTo(this.map);

      // Evento cuando el marcador se arrastra
      this.marker.on('dragend', () => {
        const position = this.marker!.getLngLat();
        this.emitSelectedLocation(position.lat, position.lng);
      });
    }
  }

  /**
   * Emitir coordenadas seleccionadas
   */
  private emitSelectedLocation(lat: number, lng: number): void {
    const location: LocationCoordinates = {
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6))
    };
    this.selectedLocationSubject.next(location);
  }

  /**
   * Añadir un marcador no interactivo (para visualización)
   */
  public addMarker(lng: number, lat: number, title?: string): void {
    if (!this.map) return;

    const marker = new mapboxgl.Marker({ color: '#2e8b57' })
      .setLngLat([lng, lat])
      .addTo(this.map);

    if (title) {
      marker.setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<strong>${title}</strong>`)
      );
    }
  }

  /**
   * Establecer marcador en una ubicación específica
   */
  public setMarkerAt(lng: number, lat: number): void {
    this.updateMarker(lng, lat);
    this.emitSelectedLocation(lat, lng);
  }

  /**
   * Centrar el mapa en coordenadas específicas
   */
  public setCenter(lng: number, lat: number): void {
    if (this.map) {
      this.map.setCenter([lng, lat]);
    }
  }

  /**
   * Establecer nivel de zoom
   */
  public setZoom(zoom: number): void {
    if (this.map) {
      this.map.setZoom(zoom);
    }
  }

  /**
   * Obtener la ubicación seleccionada actual
   */
  public getSelectedLocation(): LocationCoordinates | null {
    return this.selectedLocationSubject.value;
  }

  /**
   * Limpiar la ubicación seleccionada
   */
  public clearSelectedLocation(): void {
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
    this.selectedLocationSubject.next(null);
  }

  /**
   * Destruir el mapa y limpiar recursos
   */
  public destroyMap(): void {
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.selectedLocationSubject.next(null);
  }

  /**
   * Obtener instancia del mapa
   */
  public getMap(): mapboxgl.Map | null {
    return this.map;
  }

  /**
   * Redimensionar el mapa (útil después de cambios de layout)
   */
  public resizeMap(): void {
    if (this.map) {
      setTimeout(() => this.map!.resize(), 100);
    }
  }
}