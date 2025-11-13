import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface CloudinaryResponse {
  url: string;
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
}

interface ApiResponse<T> {
  error: boolean;
  content: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  private readonly API_URL = 'http://localhost:8080/api/images';

  constructor(private http: HttpClient) { }

  /**
   * Sube una imagen de perfil
   * @param file Archivo de imagen
   * @returns Observable con la respuesta de Cloudinary
   */
  uploadProfileImage(file: File): Observable<CloudinaryResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<CloudinaryResponse>>(
      `${this.API_URL}/profile`,
      formData
    ).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.message || 'Error al subir imagen de perfil');
        }
        return response.content;
      })
    );
  }

  /**
   * Sube múltiples imágenes de alojamiento
   * @param files Array de archivos de imagen
   * @returns Observable con array de respuestas de Cloudinary
   */
  uploadAccommodationImages(files: File[]): Observable<CloudinaryResponse[]> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('files', file);
    });

    return this.http.post<ApiResponse<CloudinaryResponse[]>>(
      `${this.API_URL}/accommodation/multiple`,
      formData
    ).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.message || 'Error al subir imágenes de alojamiento');
        }
        return response.content;
      })
    );
  }

  /**
   * Sube una sola imagen de alojamiento
   * @param file Archivo de imagen
   * @returns Observable con la respuesta de Cloudinary
   */
  uploadAccommodationImage(file: File): Observable<CloudinaryResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<CloudinaryResponse>>(
      `${this.API_URL}/accommodation`,
      formData
    ).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.message || 'Error al subir imagen de alojamiento');
        }
        return response.content;
      })
    );
  }

  /**
   * Elimina una imagen de Cloudinary
   * @param publicId El public_id de la imagen en Cloudinary
   * @returns Observable con el resultado
   */
  deleteImage(publicId: string): Observable<string> {
    return this.http.delete<ApiResponse<string>>(
      `${this.API_URL}`,
      { params: { publicId } }
    ).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.message || 'Error al eliminar imagen');
        }
        return response.content;
      })
    );
  }

  /**
   * Elimina múltiples imágenes de Cloudinary
   * @param publicIds Array de public_ids
   * @returns Observable con el resultado
   */
  deleteMultipleImages(publicIds: string[]): Observable<string> {
    return this.http.delete<ApiResponse<string>>(
      `${this.API_URL}/multiple`,
      { body: publicIds }
    ).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.message || 'Error al eliminar imágenes');
        }
        return response.content;
      })
    );
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