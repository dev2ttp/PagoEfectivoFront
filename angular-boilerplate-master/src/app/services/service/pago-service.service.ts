import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Pago } from '../../models/pago/pago';
@Injectable({
  providedIn: 'root'
})
export class PagoServiceService {

  apiUrl: string;
  headers = new HttpHeaders().set('Content-Type', 'application/json').set('Accept', 'application/json');

  constructor(private http: HttpClient) {
    //this.apiUrl= 'https://172.16.33.121/api/Pago';
    this.apiUrl = 'http://172.16.33.121:59579/api/Pago';
  }
  async iniciarPago() {
    try {
      return await this.http.get(
        this.apiUrl + "/IniciarPago", { headers: this.headers }
      ).toPromise();
    } catch (error) {
      let resultado =
      {
        'status': false,
        'data': 'error al ejeceutar petición',
        'codeStatus': error.status
      };
      return resultado;
    }
  }
  async cancelarOp() {
    try {
      return await this.http.get(
        this.apiUrl + "/Cancelarpago", { headers: this.headers }
      ).toPromise();
    } catch (error) {
      let resultado =
      {
        'status': false,
        'data': 'error al ejeceutar petición',
        'codeStatus': error.status
      };
      return resultado;
    }
  }
  async estadoCancelacion() {
    try {
      return await this.http.get(
        this.apiUrl + "/EstadoCancelacionPago", { headers: this.headers }
      ).toPromise();
    } catch (error) {
      let resultado =
      {
        'status': false,
        'data': 'error al ejeceutar petición',
        'codeStatus': error.status
      };
      return resultado;
    }
  }
  async detallesPago2(req) {
    try {
      var request = {
        "MontoApagar": req
      };
      return await this.http.post(`${this.apiUrl}/DineroIngresado`, request, { headers: this.headers }).toPromise()

    } catch (error) {
      let resultado =
      {
        'status': false,
        'data': 'error al ejeceutar petición',
        'codeStatus': error.status
      };
      return resultado;
    }   
  }
  async detallesVuelto(req) {
    try {
      var request = {
        "VueltoTotal": req
      };
      return await this.http.post(`${this.apiUrl}/VueltoRegresado`, request, { headers: this.headers }).toPromise()
    } catch (error) {
      let resultado =
      {
        'status': false,
        'data': 'error al ejeceutar petición',
        'codeStatus': error.status
      };
      return resultado;
    }
  }
}