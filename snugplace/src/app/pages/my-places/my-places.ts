import { Component, OnInit } from '@angular/core';
import { PlaceCardDTO, PlaceDTO } from '../../models/place-dto';
import Swal from 'sweetalert2';
import { RouterModule } from '@angular/router'; 
import { AccommodationService } from '../../services/accommodations-service';
import { ResponseListDTO } from '../../models/response-list-dto';

@Component({
  selector: 'app-my-places',
  imports: [RouterModule],
  templateUrl: './my-places.html',
  styleUrl: './my-places.css'
})
export class MyPlaces implements OnInit {

  places: PlaceDTO[] = [];

  constructor(private placesService: AccommodationService) {
  }

  ngOnInit(): void {
    this.placesService.getAll().subscribe((resp: ResponseListDTO<PlaceCardDTO[]>) => {
      // adapt depending on your API shape:
      // common case: resp.data is the array
      this.places = (resp as any).data ?? (resp as unknown as PlaceDTO[]);
    }, err => {
      // handle error (optional)
      console.error(err);
    });
  }

  public onDelete(placeId: number) {

    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción cambiará el estado de los alojamientos a Eliminados.",
      icon: "error",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.placesService.delete(placeId);
        this.places = this.places.filter(p => p.id !== placeId);
        Swal.fire("Eliminado!", "El alojamiento ha sido eliminado correctamente.", "success");
      }
    });

  }

}