import { Component, OnInit, ViewChild } from '@angular/core';
import { Usuario } from '../../../models/usuario';
import { UsuarioService } from '../../../services/service.index';
import { MatTableDataSource, MatSort, MatPaginator, MatSortable } from '@angular/material';
import { URL_SOCKET_IO } from '../../../../environments/environment';
import * as io from 'socket.io-client';
import { ROLES_ARRAY } from 'src/app/config/config';

declare var swal: any;

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css']
})
export class StatusComponent implements OnInit {
  cargando = true;
  totalOnline = 0;
  roles = ROLES_ARRAY;

  // displayedColumns = ['status', 'img', 'nombre', 'email', 'role', 'empresas'];
  displayedColumns = ['img', 'nombre', 'status'];
  dataSource: any;
  urlSocket = URL_SOCKET_IO + '/users';
  socket = io(this.urlSocket, {transports: ['websocket']});

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private usuarioService: UsuarioService
  ) { }

  ngOnInit() {
    localStorage.removeItem('historyArray');
    this.cargarUsuarios();

    this.socket.on('login-user', function (data: any) {
      this.cargarUsuarios();
    }.bind(this));

    this.socket.on('logout-user', function (data: any) {
        this.cargarUsuarios();
    }.bind(this));
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    if (this.dataSource && this.dataSource.data.length > 0) {
      this.dataSource.filter = filterValue;
      this.totalOnline = this.dataSource.filteredData.length;
    } else {
      console.error('Error al filtrar el dataSource de Status');
    }
  }

  cargarUsuarios() {
    this.cargando = true;
    this.usuarioService.getUserStatus().subscribe((usuarios: any) => {
      this.dataSource = new MatTableDataSource(usuarios);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.totalOnline = usuarios.filter(u => u.status === true).length;
    });
    this.cargando = false;
  }
}