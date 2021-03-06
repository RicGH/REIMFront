import { Component, OnInit, ViewChild } from '@angular/core';

import {
  SolicitudService,
  ExcelService,
  UsuarioService
} from '../../services/service.index';
import {
  MatTabGroup,
  MatTabChangeEvent,
  MatPaginator,
  MatSort,
  MatTableDataSource
} from '@angular/material';
import * as _moment from 'moment';
import { DatePipe } from '@angular/common';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE
} from '@angular/material/core';
import { Liberacion } from './liberacion.models';
import { ROLES } from 'src/app/config/config';
import { LiberacionBLService } from './liberacion-bl.service';

declare const swal: any;

const moment = _moment;

export const MY_FORMATS = {
  parse: {
    dateInput: ['l', 'L']
  },
  display: {
    dateInput: 'L',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};

@Component({
  selector: 'app-liberaciones-bl',
  templateUrl: './liberaciones-bl.component.html',
  styleUrls: ['./liberaciones-bl.component.css'],
  providers: [
    DatePipe,
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE]
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-mx' }
  ]
})
export class LiberacionesBLComponent implements OnInit {
  fIni = moment()
    .local()
    .startOf('day')
    .subtract(1, 'month');
  fFin = moment()
    .local()
    .startOf('day');
  SolicitudesExcel = [];
  @ViewChild(MatPaginator) paginator: MatPaginator; // descargas
  @ViewChild(MatSort) sort: MatSort; // descargas
  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
  @ViewChild('pagCargas', { read: MatPaginator }) pagCargas: MatPaginator; // cargas
  @ViewChild('sortCargas') sortCargas: MatSort; // cargas

  cargando = true;
  displayedColumnsCarga = [
    'actions',
    'blBooking',
    'naviera.nombreComercial',
    'cliente.nombreComercial',
    'observaciones',
    'solicitado',
    'estatus',
    'fAlta'
  ];

  dtCargas: any;
  totalRegistrosDescargas = 0;
  totalRegistrosCargas = 0;
  usuarioLogueado: any;
  agencias: string = null;

  constructor(
    private _usuarioService: UsuarioService,
    private excelService: ExcelService,
    private liberacionService: LiberacionBLService
  ) {}
  ngOnInit() {
    this.usuarioLogueado = this._usuarioService.usuario;
    this.cargarSolicitudes('C');
    const indexTAB = localStorage.getItem('AprobSolicitudes');
    if (indexTAB) {
      // tslint:disable-next-line: radix
      this.tabGroup.selectedIndex = Number.parseInt(indexTAB);
    }
  }

  cargarSolicitudes(CD: string) {
    this.cargando = true;
    if (
      this.usuarioLogueado.role === ROLES.ADMIN_ROLE ||
      this.usuarioLogueado.role === ROLES.PATIOADMIN_ROLE
    ) {
      if (CD === 'C') {
        this.liberacionService
          .getLiberacion(
            'C',
            null,
            this.fIni ? this.fIni.utc().format('DD-MM-YYYY') : '',
            this.fFin ? this.fFin.utc().format('DD-MM-YYYY') : '',
            null
          )
          .subscribe(res => {
            this.totalRegistrosCargas = res.total;
            this.dtCargas = new MatTableDataSource(res.liberacion);
            this.dtCargas.sort = this.sortCargas;
            this.dtCargas.paginator = this.pagCargas;
            this.cargando = false;
          });
      }
    } else {
      let navieras = '';
      this.usuarioLogueado.empresas.forEach(emp => {
        navieras = navieras + emp._id;
      });
      if (CD === 'C') {
        this.liberacionService
          .getLiberacion(
            'C',
            null,
            this.fIni ? this.fIni.utc().format('DD-MM-YYYY') : '',
            this.fFin ? this.fFin.utc().format('DD-MM-YYYY') : '',
            navieras
          )
          .subscribe(res => {
            this.totalRegistrosCargas = res.total;
            this.dtCargas = new MatTableDataSource(res.liberacion);
            this.dtCargas.sort = this.sortCargas;
            this.dtCargas.paginator = this.pagCargas;
            this.cargando = false;
          });
      }
    }
  }

  applyFilterCargas(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches

    if (this.dtCargas && this.dtCargas.data.length > 0) {
      this.dtCargas.filter = filterValue;
      this.totalRegistrosCargas = this.dtCargas.filteredData.length;
    } else {
      console.error('Error al filtrar el dataSource de Cargas');
    }

    // this.dtCargas.filter = filterValue;
    // this.totalRegistrosCargas = this.dtCargas.filteredData.length;
  }

  // applyFilterDescargas(filterValue: string) {
  //   filterValue = filterValue.trim(); // Remove whitespace
  //   filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
  //   this.dtDescargas.filter = filterValue;
  //   this.totalRegistrosDescargas = this.dtDescargas.filteredData.length;
  // }

  onLinkClick(event: MatTabChangeEvent) {
    localStorage.setItem('AprobSolicitudes', event.index.toString());
  }

  borrarSolicitud(sol: Liberacion) {
    swal({
      title: '¿Esta seguro?',
      text: 'Esta apunto de borrar la solicitud.',
      icon: 'warning',
      buttons: true,
      dangerMode: true
    }).then(borrar => {
      if (borrar) {
        this.liberacionService.borrarSolicitud(sol._id).subscribe(borrado => {
          this.cargarSolicitudes(sol.tipo);
        });
      }
    });
  }

  cargarDatosExcelD(datos) {
    this.SolicitudesExcel = [];
    datos.forEach(d => {
      let contenedoresDescarga = '';

      d.contenedores.forEach(x => {
        contenedoresDescarga +=
          'Contenedor: ' + x.contenedor + ' Tipo:' + x.tipo + '\n ,';
      });
      const solicitudes = {
        Fecha_Alta: d.fAlta.substring(0, 10),
        Agencia:
          d.agencia &&
          d.agencia.nombreComercial &&
          d.agencia.nombreComercial !== undefined &&
          d.agencia.nombreComercial !== '' &&
          d.agencia.nombreComercial,
        Cliente:
          d.cliente &&
          d.cliente.nombreComercial &&
          d.cliente.nombreComercial !== undefined &&
          d.cliente.nombreComercial !== '' &&
          d.cliente.nombreComercial,
        Viaje:
          d.viaje &&
          d.viaje.viaje &&
          d.viaje.viaje !== undefined &&
          d.viaje.viaje !== ''
            ? d.viaje.viaje
            : '' && d.viaje.viaje,
        Nombre_Buque:
          d.buque &&
          d.buque.nombre &&
          d.buque.nombre !== undefined &&
          d.buque.nombre !== ''
            ? d.buque.nombre
            : '' && d.buque.nombre,
        Observaciones: d.observaciones,
        Contenedores: contenedoresDescarga,
        Estatus: d.estatus
      };
      this.SolicitudesExcel.push(solicitudes);
    });
  }

  exportAsXLSXD(dtDescargas, nombre: string): void {
    this.cargarDatosExcelD(dtDescargas.filteredData);
    if (this.SolicitudesExcel) {
      this.excelService.exportAsExcelFile(this.SolicitudesExcel, nombre);
    } else {
      swal('No se puede exportar un excel vacio', '', 'error');
    }
  }

  cargarDatosExcelC(datos) {
    datos.forEach(d => {
      let contendoresSolicitados = '';

      d.contenedores.forEach(c => {
        contendoresSolicitados +=
          'Tipo: ' + c.tipo + ' Grado: ' + c.grado + '\n';
      });

      const solicitudes = {
        Fecha_Alta: d.fAlta.substring(0, 10),
        Agencia:
          d.agencia &&
          d.agencia.nombreComercial &&
          d.agencia.nombreComercial !== undefined &&
          d.agencia.nombreComercial !== '' &&
          d.agencia.nombreComercial,
        Cliente:
          d.cliente &&
          d.cliente.nombreComercial &&
          d.cliente.nombreComercial !== undefined &&
          d.cliente.nombreComercial !== '' &&
          d.cliente.nombreComercial,
        Observaciones: d.observaciones,
        Solicitado: contendoresSolicitados,
        Estatus: d.estatus
      };
      this.SolicitudesExcel.push(solicitudes);
    });
  }

  exportAsXLSXC(dtCargas, nombre: string): void {
    this.cargarDatosExcelC(dtCargas.filteredData);
    if (this.SolicitudesExcel) {
      this.excelService.exportAsExcelFile(this.SolicitudesExcel, nombre);
    } else {
      swal('No se puede exportar un excel vacio', '', 'error');
    }
  }
}
