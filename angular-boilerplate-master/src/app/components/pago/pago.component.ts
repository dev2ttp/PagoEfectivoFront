import { Component, OnInit } from '@angular/core';
import { PagoServiceService } from '../../services/service/pago-service.service';
import { Router } from '@angular/router';
import { SweetAlertService } from '../../services/sweet-alert/sweet-alert.service';
import Swal from 'sweetalert2';
import { NgxToastrService } from '../../services/ngx-toastr/ngx-toastr.service';
import { interval, Subscription, from } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TRANSITION_DURATIONS } from 'ngx-bootstrap/modal/modal-options.class';
import { $ } from 'protractor';
import { Pago } from '../../models/pago/pago';

@Component({
  selector: 'app-pago',
  templateUrl: './pago.component.html',
  styleUrls: ['./pago.component.css']
})
export class PagoComponent implements OnInit {

  subConsultaEST: Subscription;
  flagMensajeEST: boolean = false;
  flagMensajeFloat: boolean = false;

  //Datos Front
  StatusFront: string = "false";
  CodigoFront: string = "";
  DatosFront: string = "";
  DatosRuta: string = "no ha llegado";

  pago: Pago = {
    montoAPagar: 0,
    dineroIngresado: 0,
    dineroFaltante: 0
  };

  constructor(private PagoService: PagoServiceService, private router: Router, private sweetAlertService: SweetAlertService, private ngxToastrService: NgxToastrService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.DatosRuta = this.route.snapshot.queryParams.monto;
    localStorage.setItem("monto", this.DatosRuta);
    if (this.DatosRuta == undefined) {
    }
    else {
      this.timerInicio();
    }
    this.CodigoFront = localStorage.getItem("codigo");
    this.StatusFront = localStorage.getItem("status");
    (<HTMLInputElement>document.getElementById("Status")).value = this.StatusFront;
    (<HTMLInputElement>document.getElementById("Codigo")).value = this.CodigoFront;
    localStorage.setItem("status", "false");
    localStorage.setItem("codigo", "1");
  }  
  async inicioEstado() {
    var response = await this.PagoService.estadSalud();
    console.log("estado salud:" + JSON.stringify(response));
    if (response['statusMaquina'].floating) {
      if (!this.flagMensajeFloat) {
        this.sweetAlertService.CalcularOperacion("Por favor espere unos segundos");
        this.flagMensajeFloat = true;
      }
    }
    else {
      if (this.flagMensajeFloat) {
        Swal.close();
      }
      this.flagMensajeFloat = false;
      if (this.subConsultaEST) this.subConsultaEST.unsubscribe();
      this.inicioPago();
    }
  }
  async inicioPago() {
    this.sweetAlertService.swalLoading("Iniciando");
    var response = await this.PagoService.iniciarPago(this.pago.montoAPagar);
    Swal.close();
    console.log("estadoInicio: " + JSON.stringify(response));
    if (response['bloqueoEfectivo']) {
      this.PagoService.finalizarPago();
      this.flagMensajeEST = true;
      this.sweetAlertService.CalcularOperacion("Temporalmente fuera de servicio");
      setTimeout( () => {
        this.CodigoFront = "1";
        localStorage.setItem("codigo", this.CodigoFront);
        localStorage.setItem("status", "true");
        (<HTMLInputElement>document.getElementById("Status")).value = localStorage.getItem("status");
        (<HTMLInputElement>document.getElementById("Codigo")).value = localStorage.getItem("codigo");
      }, 6000 );
    }
    else {
      if (response['status']) {
        if (response['statusMaquina'] == false && response['nivelBloqueo'] == true) {
          this.sweetAlertService.swalErrorM(response['mensajeAmostrar']);
        }
        else if (response['statusMaquina'] == false && response['nivelBloqueo'] == false) {
          this.ngxToastrService.warn(response['mensajeAmostrar']);
          this.router.navigate(['/efectivo']);
        }
        else {
          this.router.navigate(['/efectivo']);
          this.sweetAlertService.swalSuccess("Ingrese dinero");
        }
      }
      else {
        this.sweetAlertService.swalErrorM("No tenemos vuelto");
        setTimeout( () => {
          this.CodigoFront = "1";
          localStorage.setItem("codigo", this.CodigoFront);
          localStorage.setItem("status", "true");
          (<HTMLInputElement>document.getElementById("Status")).value = localStorage.getItem("status");
          (<HTMLInputElement>document.getElementById("Codigo")).value = localStorage.getItem("codigo");
          
        }, 6000 );
        this.router.navigate(['/pago']); 
      }
    }
  }
  timerInicio() {
    const source = interval(1000);
    this.subConsultaEST = source.subscribe(val => this.inicioEstado());
  }
  ngOnDestroy() {
    if (this.subConsultaEST)this.subConsultaEST.unsubscribe();
  }
}
