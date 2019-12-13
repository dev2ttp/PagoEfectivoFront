import { Component, OnInit, OnDestroy } from '@angular/core';
import { PagoServiceService } from '../../services/service/pago-service.service';
import { interval, Subscription, from } from 'rxjs';
import { Pago } from '../../models/pago/pago';
import { Vuelto } from '../../models/pago/vuelto';
import { Router } from '@angular/router';
import { log } from 'util';
import { SweetAlertService } from '../../services/sweet-alert/sweet-alert.service';
import { NgxToastrService } from '../../services/ngx-toastr/ngx-toastr.service'
import Swal from 'sweetalert2';
import { delay } from 'q';

@Component({
  selector: 'app-pago-efectivo',
  templateUrl: './pago-efectivo.component.html',
  styleUrls: ['./pago-efectivo.component.css']
})
export class PagoEfectivoComponent implements OnInit, OnDestroy {

  dineroIngresado: number;
  dinerFaltarte: number;
  montoAPagar: number;
  subEstDinero: Subscription;
  subStdVuelto: Subscription;
  subCancelacion: Subscription;
  subOutPago: Subscription;
  flagOutPago: boolean = false;
  subAlertCtn: Subscription;
  flagVuelto: boolean = false;
  flagPago: boolean = true;
  flagEstPago: boolean = false;
  flagEstVuelto: boolean = false;

  pago: Pago = {
    montoAPagar: 0,
    dineroIngresado: 0,
    dineroFaltante: 0
  };

  vuelto: Vuelto = {
    VueltoTotal: 0,
    DineroFaltante: 0,
    DineroRegresado: 0,
    VueltoFinalizado: false
  };

  constructor(private PagoService: PagoServiceService, private router: Router, private sweetAlertService: SweetAlertService, private ngxToastrService: NgxToastrService) {
  }
  ngOnInit() {
    this.timerEstadoDinero();
    //this.pago.montoAPagar = (Math.round(Math.floor(Math.random() * (2000 - 100)) + 100))*10;
    this.pago.montoAPagar = (Math.round(Math.floor(Math.random() * (100 - 10)) + 10)) * 100
  }
  async estadoDinero() {
    try {
      var response = await this.PagoService.detallesPago2(this.pago.montoAPagar)
      console.log("estadoDinero: " + JSON.stringify(response));
      if (response['status']) {
        if (response['pagoStatus'] == false) {
          if (this.pago.dineroIngresado == response['data']['dineroIngresado']) {
            if (!this.flagOutPago) {
              this.flagOutPago = true;
              this.timerOutPago();
            }
          }
          else {
            this.flagOutPago = false;
            this.subOutPago.unsubscribe();
          }
          this.pago.dineroIngresado = response['data']['dineroIngresado'];
          this.pago.dineroFaltante = response['data']['dineroFaltante'];

          if (this.pago.dineroFaltante < 0) {
            this.flagVuelto = true;
            this.flagPago = false;
            this.ngxToastrService.warn("entregando vuelto");
            this.subEstDinero.unsubscribe();
            this.vuelto.VueltoTotal = this.pago.dineroFaltante * -1;
            this.pago.dineroFaltante = 0;
            this.timerEstadoVuelto();
          }
        }
        else if (!this.flagEstPago) {
          this.router.navigate(['/pago']);
          this.sweetAlertService.swalSuccess("Pago realizado, imprimiendo ticket")
          this.flagEstPago = true;
          this.subEstDinero.unsubscribe();
        }
      }
      else if(response['status'] == false && this.flagEstPago == false)
      {
        this.sweetAlertService.swalWarning("No tenemos vuelto, le devolveremos su dinero");
        setTimeout(() => { this.cancelarOp(); }, 4000);
        this.router.navigate(['/pago']);
        this.subEstDinero.unsubscribe();
      }
    } catch (error) {
      console.log(error);
    }
  }
  async estadoVuelto() {
    try {
      var response = await this.PagoService.detallesVuelto(this.vuelto.VueltoTotal)
      console.log("estadoVuelto: " + JSON.stringify(response));
      if (response['status']) {
        if (response['pagoStatus'] == false) {
          this.vuelto.VueltoFinalizado = response['data']['vueltoFinalizado'];
          this.vuelto.DineroFaltante = response['data']['dineroFaltante'];
          this.vuelto.DineroRegresado = response['data']['dineroRegresado'];
        }
        else if(!this.flagEstVuelto)
        {
          this.router.navigate(['/pago']);
          this.sweetAlertService.swalSuccess("Pago realizado, imprimiendo ticket")
          this.subStdVuelto.unsubscribe();
          this.flagEstVuelto = true;
        }
      }
      else
      {
        this.sweetAlertService.swalError();       
        this.router.navigate(['/pago']);
        this.subStdVuelto.unsubscribe();
      }
    } catch (error) {
      console.log(error);
    }
  }
  async cancelarOp() {
    try {
      this.subEstDinero.unsubscribe();
      this.sweetAlertService.swalLoading("Cancelando operacion");
      let response = await this.PagoService.cancelarOp();

      console.log("cancelarOP: " + JSON.stringify(response));
      if (response) {
        this.timerCancelacionPago();
      }
    } catch (error) {
      console.log(error);
    }
  }
  async estadoCancelacionPago() {
    try {
      let response = await this.PagoService.estadoCancelacion();
      console.log("estadoCancelacionPago: " + JSON.stringify(response));
      
      if (response['cancelacionCompleta'] == true && response['entregandoVuelto'] == false) {
        this.router.navigate(['/pago']);
        Swal.close();
        this.subCancelacion.unsubscribe();
      }
      else if (response['cancelacionCompleta'] == false && response['entregandoVuelto'] == true) {
      }
    } catch (error) {
      console.log(error)
    }
  }
  async cancelaTimeOutPago() {
    this.subEstDinero.unsubscribe();
    this.subOutPago.unsubscribe();
    this.sweetAlertService.swalTimeOutPago();
    this.subAlertCtn = this.sweetAlertService.confirmation.subscribe(data => {
      if (data == "cancelar") {
        this.cancelarOp();
        this.subAlertCtn.unsubscribe();
      }
      else if (data == "continuar") {
        this.flagOutPago = false;
        this.timerEstadoDinero();
        this.subAlertCtn.unsubscribe();
      }
    });
  }
  timerEstadoDinero() {
    const source = interval(2000);
    this.subEstDinero = source.subscribe(val => this.estadoDinero());
  }
  timerEstadoVuelto() {
    const source = interval(2000);
    this.subStdVuelto = source.subscribe(val => this.estadoVuelto());
  }
  timerCancelacionPago() {
    const source = interval(2000);
    this.subCancelacion = source.subscribe(val => this.estadoCancelacionPago());
  }
  timerOutPago() {
    const source = interval(60000);
    this.subOutPago = source.subscribe(val => this.cancelaTimeOutPago());
  }
  ngOnDestroy() {
    this.subEstDinero.unsubscribe();
    this.subOutPago.unsubscribe();
  }
}
