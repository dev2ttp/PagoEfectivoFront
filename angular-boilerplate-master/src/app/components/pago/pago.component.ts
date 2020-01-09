import { Component, OnInit } from '@angular/core';
import { PagoServiceService } from '../../services/service/pago-service.service';
import { Router } from '@angular/router';
import { SweetAlertService } from '../../services/sweet-alert/sweet-alert.service';
import Swal from 'sweetalert2';
import { NgxToastrService } from '../../services/ngx-toastr/ngx-toastr.service';
import { interval, Subscription, from } from 'rxjs';
import { TRANSITION_DURATIONS } from 'ngx-bootstrap/modal/modal-options.class';

@Component({
  selector: 'app-pago',
  templateUrl: './pago.component.html',
  styleUrls: ['./pago.component.css'] 
})
export class PagoComponent implements OnInit {

  subConsultaEST: Subscription;
  flagMensajeEST: boolean = false;

  constructor(private PagoService: PagoServiceService, private router: Router, private sweetAlertService: SweetAlertService, private ngxToastrService: NgxToastrService) { }

  ngOnInit() {
    this.PagoService.floatByDenomination();
    this.timerConsultaEST();
  }
  async inicioPago() {    
    this.sweetAlertService.swalLoading("Iniciando");
    var response = await this.PagoService.iniciarPago();
    Swal.close();
    console.log("estadoInicio: " + JSON.stringify(response));

    if (response['bloqueoEfectivo']) {
      console.log("bloqueo!!! bloqueo!!!")
      this.flagMensajeEST = true;
      this.sweetAlertService.CalcularOperacion("Temporalmente fuera de servicio");
    }else
    {
      if (response['status']) {
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
  async consultaEST() {
    var response = await this.PagoService.estadSalud();
    console.log("estado salud:"+JSON.stringify(response));
    if (response['bloqueoEfectivo']) {
      if (!this.flagMensajeEST) {
        this.sweetAlertService.CalcularOperacion("Temporalmente fuera de servicio");  
      }
      this.flagMensajeEST = true;      
    }
    else
    {
      Swal.close();
      this.flagMensajeEST = false; 
    }
  }
  timerConsultaEST() {
    const source = interval(3000);
    this.subConsultaEST = source.subscribe(val => this.consultaEST());
  }
  ngOnDestroy() {  
    this.subConsultaEST.unsubscribe();
  }
}
