import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { Usuario } from '../pages/usuarios/usuario.model';
import { UsuarioService } from '../pages/usuarios/usuario.service';
import {URL_SERVICIOS} from '../config/config';


declare function init_plugins();
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email: string;
  // tslint:disable-next-line:no-inferrable-types
  recuerdame: boolean = false;

  urlWithoutLogin: string;
  ruta: string;

  constructor(public router: Router, public _usuarioService: UsuarioService) { }

  ngOnInit() {
    init_plugins();
    this.email = localStorage.getItem('email') || '';
    if (this.email.length > 1) {
      this.recuerdame = true;
    }  

    if (localStorage.getItem('urlMain')) {
      this.urlWithoutLogin = localStorage.getItem('urlMain');
    }
    this.ruta= URL_SERVICIOS + '/forgot_password';
  }

  ingresar(forma: NgForm) {
    if (forma.invalid) {
      return;
    }
    // tslint:disable-next-line:prefer-const
    let usuario = new Usuario(null, forma.value.email, forma.value.password);
    this._usuarioService.login(usuario, forma.value.recuerdame, this.urlWithoutLogin)
      .subscribe(correcto => {
        if (localStorage.getItem('urlMain')) {
          window.location.href = localStorage.getItem('urlMain');
          localStorage.removeItem('urlMain');
        } else {
          this.router.navigate(['/dashboard']);
        }
      });
  }
}
