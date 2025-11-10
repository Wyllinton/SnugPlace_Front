import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { PlacesService } from '../../services/places-service';
import { PlaceDTO } from '../../models/place-dto';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-accommodation-detail',
  imports: [CommonModule, RouterModule, DecimalPipe],
  templateUrl: './accommodation-detail.html',
  styleUrl: './accommodation-detail.css'
})
export class AccommodationDetail {

  placeId: string = "";
  place: PlaceDTO | undefined;
  selectedImage: string | null = null;

  constructor(
    private route: ActivatedRoute, 
    private placesServices: PlacesService,
    private router: Router
  ){
    this.route.params.subscribe( (params) => {
      this.placeId = params["id"];
      this.get(this.placeId);
    });
  }

  public get(placeID: string){
    // El id que se recibe por la url es de tipo string, pero en el servicio es de tipo number por eso se hace el parseInt
    const selectedPlace = this.placesServices.get(parseInt(placeID));
    if(selectedPlace != undefined){
      this.place = selectedPlace;
    }
  }

  public onDelete(placeId: number) {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará permanentemente el alojamiento.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
    }).then((result) => {
      if (result.isConfirmed) {
        this.placesServices.delete(placeId);
        Swal.fire({
          title: "¡Eliminado!",
          text: "El alojamiento ha sido eliminado correctamente.",
          icon: "success",
          confirmButtonText: "Aceptar"
        }).then(() => {
          this.router.navigate(['/my-places']);
        });
      }
    });
  }
}