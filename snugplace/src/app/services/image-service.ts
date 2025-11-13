import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Interfaz para la respuesta de Cloudinary
export interface CloudinaryResponse {
  url: string;
  cloudinaryId: string;
}

// Interfaz para la respuesta del backend
export interface ImageUploadResponse {
  error: boolean;
  content: CloudinaryResponse;
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private apiUrl = 'http://localhost:8080/images';

  constructor(private http: HttpClient) {}

  /**
   * Sube una imagen a Cloudinary a través del backend
   * @param file Archivo de imagen a subir
   * @returns Observable con la respuesta conteniendo URL y ID de Cloudinary
   */
  uploadImage(file: File): Observable<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ImageUploadResponse>(this.apiUrl, formData);
  }

  /**
   * Sube múltiples imágenes de forma secuencial
   * @param files Array de archivos a subir
   * @returns Promise con array de respuestas
   */
  async uploadMultipleImages(files: File[]): Promise<CloudinaryResponse[]> {
    const uploadPromises = files.map(file => 
      this.uploadImage(file).toPromise()
    );

    try {
      const responses = await Promise.all(uploadPromises);
      return responses.map(response => response!.content);
    } catch (error) {
      console.error('Error al subir imágenes:', error);
      throw error;
    }
  }

  /**
   * Elimina una imagen de Cloudinary
   * @param cloudinaryId ID de la imagen en Cloudinary
   * @returns Observable con la respuesta
   */
  deleteImage(cloudinaryId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}?id=${cloudinaryId}`);
  }

  /**
   * Valida el tamaño y tipo de archivo antes de subirlo
   * @param file Archivo a validar
   * @returns true si es válido, false en caso contrario
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      return { valid: false, error: 'La imagen no debe superar los 5MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Formato no permitido. Use JPG, PNG o WEBP' };
    }

    return { valid: true };
  }

  /**
   * Valida múltiples archivos
   * @param files Array de archivos a validar
   * @returns Resultado de la validación
   */
  validateMultipleFiles(files: File[]): { valid: boolean; error?: string } {
    if (files.length === 0) {
      return { valid: false, error: 'Debe seleccionar al menos una imagen' };
    }

    if (files.length > 10) {
      return { valid: false, error: 'No puede subir más de 10 imágenes' };
    }

    for (let file of files) {
      const validation = this.validateImageFile(file);
      if (!validation.valid) {
        return validation;
      }
    }

    return { valid: true };
  }
}