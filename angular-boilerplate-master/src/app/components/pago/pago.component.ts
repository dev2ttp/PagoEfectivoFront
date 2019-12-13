import { Component, OnInit } from '@angular/core';
import { PagoServiceService } from '../../services/service/pago-service.service';
import { Router } from '@angular/router';
import { SweetAlertService } from '../../services/sweet-alert/sweet-alert.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pago',
  templateUrl: './pago.component.html',
  styleUrls: ['./pago.component.css']
})
export class PagoComponent implements OnInit {
  constructor(private PagoService: PagoServiceService, private router: Router, private sweetAlertService: SweetAlertService) { }

  ngOnInit() {
  }
  async inicioPago() {
    this.sweetAlertService.swalLoading("Iniciando");
    let response = await this.PagoService.iniciarPago();
    Swal.close();
    if (response) {
      this.router.navigate(['/efectivo']);
      this.sweetAlertService.swalSuccess("Ingrese dinero");
    }
    else {
      this.sweetAlertService.swalError();
    }
  }
}
