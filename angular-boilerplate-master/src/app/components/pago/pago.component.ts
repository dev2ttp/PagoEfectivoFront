import { Component, OnInit } from '@angular/core';
import { PagoServiceService } from '../../services/service/pago-service.service';
import { Router } from '@angular/router';
import { SweetAlertService } from '../../services/sweet-alert/sweet-alert.service';
import Swal from 'sweetalert2';
import { NgxToastrService } from '../../services/ngx-toastr/ngx-toastr.service';

@Component({
  selector: 'app-pago',
  templateUrl: './pago.component.html',
  styleUrls: ['./pago.component.css'] 
})
export class PagoComponent implements OnInit {
  constructor(private PagoService: PagoServiceService, private router: Router, private sweetAlertService: SweetAlertService, private ngxToastrService: NgxToastrService) { }

  ngOnInit() {
    this.PagoService.floatByDenomination();
  }
  async inicioPago() {    
    this.sweetAlertService.swalLoading("Iniciando");
    let response = await this.PagoService.iniciarPago();
    Swal.close();
    console.log("estadoInicio: " + JSON.stringify(response));
    if (response) {
      if (response['statusMaquina'] == false && response['nivelBloqueo']== true) {
        this.sweetAlertService.swalErrorM(response['mensajeAmostrar']);
      }
      else if(response['statusMaquina'] == false && response['nivelBloqueo']== false) {
        this.ngxToastrService.warn(response['mensajeAmostrar']);
        this.router.navigate(['/efectivo']);
      }
      else {
        this.router.navigate(['/efectivo']);
        this.sweetAlertService.swalSuccess("Ingrese dinero");
      }
    }
    else {
      this.sweetAlertService.swalError();
    }
  }
}
