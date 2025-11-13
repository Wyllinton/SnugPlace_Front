import { Component } from '@angular/core';
import { PlaceDTO } from '../../models/place-dto';
import Swal from 'sweetalert2';
import { RouterModule } from '@angular/router'; 
import { PlacesService } from '../../services/accommodations-service';

@Component({
  selector: 'app-my-places',
  imports: [RouterModule],
  templateUrl: './my-places.html',
  styleUrl: './my-places.css'
})
export class MyPlaces {

  places: PlaceDTO[];

  constructor(private placesService: PlacesService) {
    this.places = this.placesService.getAll();
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