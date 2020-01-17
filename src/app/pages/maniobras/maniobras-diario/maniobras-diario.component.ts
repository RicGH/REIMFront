import { Component, OnInit, ViewChild } from '@angular/core';
import { ManiobraService, ViajeService } from '../../../services/service.index';
import { ExcelService } from '../../../services/service.index';
import * as jspdf from 'jspdf';
import html2canvas from 'html2canvas';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
// Depending on whether rollup is used, moment needs to be imported differently.
// Since Moment.js doesn't have a default export, we normally need to import using the `* as`
// syntax. However, rollup creates a synthetic default module and we thus need to import it using
// the `default as` syntax.
import * as _moment from 'moment';
// tslint:disable-next-line:no-duplicate-imports
// import * as Moment from 'moment';
import swal from 'sweetalert';
import { MatPaginator, MatSort, MatTableDataSource, MatDialog } from '@angular/material';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';



const moment = _moment;

export const MY_FORMATS = {
  parse: {
    dateInput: ['l', 'L'],
  },
  display: {
    dateInput: 'L',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-facturacion-maniobras',
  templateUrl: './maniobras-diario.component.html',
  styleUrls: ['./maniobras-diario.component.css'],
  providers: [DatePipe,
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
    {provide: MAT_DATE_LOCALE, useValue: 'es-mx' },
  ],
})
export class ManiobrasDiarioComponent implements OnInit {
  maniobrasVacios: any[] = [];
  ManiobrasExcel = [];

  data: any = { fechaCreado: '' };
  cargando = false;
  totalRegistros = 0;
  fIniLlegada = moment().local().startOf('day');
  fFinLlegada = moment().local().startOf('day');

  displayedColumns = ['actions', 'fechaingreso', 'cargaDescarga', 'contenedor','viaje.naviera.nombreComercial','solicitud.blBooking', 'grado', 'tipo',  
    'operador', 'placa', 'transportista', 'lavado', 'reparaciones', 'viaje',
    'viaje.buque.nombre', 'peso', 'cliente', 'agencia', 'estatus', 'hDescarga',];
  dataSource: any;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  checkedVacios = false;

  constructor(public _maniobraService: ManiobraService, public _viajeService: ViajeService,
    public _excelService: ExcelService, public matDialog: MatDialog, private router: Router) { }

  ngOnInit() {
    this.consultaManiobras().then((value: { ok: Boolean, mensaje: String }) => { });
  }

  consultaManiobras() {
    this.cargando = true;
    return new Promise((resolve, reject) => {
      this._maniobraService.getManiobras(null, null, null, null, null, null,null, null, null, null,
        this.fIniLlegada ? this.fIniLlegada.utc().format('DD-MM-YYYY') : '',
        this.fFinLlegada ? this.fFinLlegada.utc().format('DD-MM-YYYY') : '')
        .subscribe(maniobras => {
          this.dataSource = new MatTableDataSource(maniobras.maniobras);
          this.dataSource.sort = this.sort;
          this.dataSource.paginator = this.paginator;
          this.totalRegistros = maniobras.total;
          resolve({ ok: true, mensaje: 'Termine' })
        },
          () => {
            reject('Failed!!');
          });
      this.cargando = false;
    });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
    this.totalRegistros = this.dataSource.filteredData.length;
  }

  filtraManiobrasVacios(vacios: boolean) {
    this.maniobrasVacios = [];
    this.checkedVacios = vacios;
    if (vacios) {
      //console.log("Filtro sin factura")
      this.dataSource.data.forEach(m => {
        if (m.peso === 'VACIO') {
          this.maniobrasVacios.push(m);
        }
      });
      this.dataSource = new MatTableDataSource(this.maniobrasVacios);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.totalRegistros = this.dataSource.data.length;
    } else {
      //console.log("Recargo todo")
      this.consultaManiobras().then((value: { ok: Boolean, mensaje: String }) => {
      }).catch((error) => {
        console.log(error.mensaje)
      });
    }
  }

  // cargarViajes(anio: string) {
  //   this.cargando = true;
  //   this._viajeService.getViajesA(anio)
  //     .subscribe(viajes => {
  //       this.viajes = viajes.viajes;
  //       this.cargando = false;
  //     });
  // }

  public exportpdf() {
    const data = document.getElementById('contentToConvert');
    html2canvas(data).then(canvas => {
      const imgWidth = 208;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      const contentDataURL = canvas.toDataURL('image/png');
      const pdf = new jspdf('p', 'mm', 'a4'); // A4 size page of PDF
      const position = 0;
      pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
      pdf.save('MYPdf.pdf'); // Generated PDF
    });
  }

  CreaDatosExcel(datos) {
    this.ManiobrasExcel = [];
    datos.forEach(m => {

      var reparaciones = '';

      m.reparaciones.forEach(r => {
        reparaciones += r.reparacion + ", ";
      });

      reparaciones = reparaciones.substring(0, reparaciones.length - 2);

      var maniobra = {
        CargaDescarga: m.cargaDescarga,
        Contenedor: m.contenedor,
        Tipo: m.tipo,
        Lavado: m.lavado,
        LavadoObservacion: m.lavadoObservacion,
        Grado: m.grado,
        FLlegada: m.fLlegada != undefined ? m.fLlegada.substring(0, 10) : '',
        Operador: m.operador && m.operador.nombre && m.operador.nombre != undefined && m.operador.nombre && m.operador.nombre != ''? m.operador.nombre: '' && m.operador.nombre,
        Placa: m.camion != undefined ? m.camion.placa : '',
        Transportista: m.transportista && m.transportista.nombreComercial && m.transportista.nombreComercial != undefined && m.transportista.nombreComercial != '' ? m.transportista.nombreComercial: '' && m.transportista.nombreComercial,
        Reparaciones: reparaciones,
        ReparacionesObservacion: m.reparacionesObservacion,
        FacturaManiobra: m.facturaManiobra,
        Viaje: m.viaje && m.viaje.viaje && m.viaje.viaje != undefined && m.viaje.viaje != ''? m.viaje.viaje: '' && m.viaje.viaje,
        Buque: m.viaje && m.viaje.buque.nombre && m.viaje.buque.nombre != undefined && m.viaje.buque.nombre != '' ? m.viaje.buque.nombre: '' && m.viaje.buque.nombre,
        Peso: m.peso,
        Naviera: m.viaje && m.viaje.naviera.nombreComercial && m.viaje.naviera.nombreComercial != undefined && m.viaje.naviera.nombreComercial != '' ? m.viaje.naviera.nombreComercial: '' && m.viaje.naviera.nombreComercial,
        Cliente: m.cliente && m.cliente.nombreComercial && m.cliente.nombreComercial != undefined && m.cliente.nombreComercial != '' && m.cliente.nombreComercial,
        Agencia: m.agencia && m.agencia.nombreComercial && m.agencia.nombreComercial != undefined && m.agencia.nombreComercial != '' && m.agencia.nombreComercial,
        Estatus: m.estatus,
        HDescarga: m.hDescarga,
        FAlta: m.fAlta.substring(0, 10)

        // folio: m.folio,
        // camion: m.camion,
        // destinatario: m.destinatario,
        // hLlegada: m.hLlegada,
        // hEntrada: m.hEntrada,
        // facturarA: m.facturarA,
        // correoFac: m.correoFac,
        // correoOp: m.correoOp,
        // solicitud: m.solicitud,
        // hSalida: m.hSalida,
        // descargaAutorizada: m.descargaAutorizada,
        // fTerminacionLavado: m.fTerminacionLavado,
        // hTerminacionLavado: m.hTerminacionLavado,
        // fTerminacionReparacion: m.fTerminacionReparacion,
        // hTerminacionReparacion: m.hTerminacionReparacion,
        // maniobraAsociada: m.maniobraAsociada,
        // fAsignacionPapeleta: m.fAsignacionPapeleta,
        // fExpiracionPapeleta: m.fExpiracionPapeleta,
        // usuarioAlta: m.usuarioAlta,
      };
      this.ManiobrasExcel.push(maniobra);
    });
  }

  exportAsXLSX(): void {
    this.CreaDatosExcel(this.dataSource.data);
    if (this.ManiobrasExcel) {
      this._excelService.exportAsExcelFile(this.ManiobrasExcel, 'Maniobras Diarias');
    } else {
      swal('No se puede exportar un excel vacio', '', 'error');
    }
  }

  // detalle(id: string) {
  //   localStorage.setItem('history', '/maniobras_diario');

  //   this.router.navigate(['/maniobras/maniobra/' + id + '/detalle']);
  // }

  open(id: string) {
    var history;
    var array = [];
    //Si tengo algo en localStorage en la variable history lo obtengo       
    if (localStorage.getItem('historyArray')) {
      //asigno a mi variable history lo que obtengo de localStorage (historyArray)
      history = JSON.parse(localStorage.getItem('historyArray'));

      //realizo este ciclo para asignar los valores del JSON al Array
      for (var i in history) {
        array.push(history[i]);
      }
    }    
    //Agrego mi nueva ruta al array
    array.push("maniobras_diario");


    ////sobreescribo la variable historyArray de localStorage con el nuevo JSON que incluye ya, la nueva ruta.
    localStorage.setItem('historyArray', JSON.stringify(array));

    //Voy a pagina.
    this.router.navigate(['/maniobras/maniobra/' + id + '/detalle']);
  }
}
