export interface ResponseListDTO<T> {
  error: boolean;
  message: string;
  data: T;
}