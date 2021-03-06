import { Component, OnInit, ViewChild } from '@angular/core';
import * as _moment from 'moment';
import swal from 'sweetalert';
import {
  MatPaginator, MatSort, MatTableDataSource, MatDialog, MatDialogConfig,
  MatTabChangeEvent, MatTabGroup, MatSnackBar
} from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Router } from '@angular/router';
import { UsuarioService, FacturacionService } from 'src/app/services/service.index';
import { Usuario } from 'src/app/pages/usuarios/usuario.model';
import { ROLES, ESTADOS_CONTENEDOR } from 'src/app/config/config';
import { Complemento } from '../../models/complemento.models';

const moment = _moment;

// See the Moment.js docs for the meaning of these formats:
// https://momentjs.com/docs/#/displaying/format/
export const MY_FORMATS = {
  parse: {
    dateInput: 'YYYY-MM-DD'
  },
  display: {
    dateInput: 'YYYY-MM-DD',
    monthYearLabel: 'YYYY MMM DD',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY MMMM DD'
  }
};

@Component({
  selector: 'app-facturas-ppd',
  templateUrl: './facturas-ppd.component.html',
  styleUrls: ['./facturas-ppd.component.css'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE]
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }
  ]
})
export class FacturasPpdComponent implements OnInit {

  cargando = true;
  totalRegistros = 0;
  usuarioLogueado = new Usuario();

  displayedColumns = ['select', 'folio', 'fecha', 'metodoPago', 'total'];

  dataSource: any;
  selectionComplementos = new SelectionModel<Complemento>(true, []);
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  constructor(public matDialog: MatDialog,
    private router: Router,
    public facturacionService: FacturacionService,
    private usuarioService: UsuarioService,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.usuarioLogueado = this.usuarioService.usuario;
    this.cargaCFDIS();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelectedVacios() {
    const numSelected = this.selectionComplementos.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggleVacios() {
    this.isAllSelectedVacios()
      ? this.selectionComplementos.clear()
      : this.dataSource.data.forEach(row =>
        this.selectionComplementos.select(row)
      );
  }

  cargaCFDIS() {
    this.cargando = true;
    const cargaDescarga = 'D';
    this.facturacionService.getCFDIS('PPD').subscribe(cfdis => {
      this.dataSource = new MatTableDataSource(cfdis.cfdis);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.totalRegistros = cfdis.total;
    });
    this.cargando = false;
  }

  agregarFacturas(maniobras, idProdServ) {
    let aAgregar = [];
    if (maniobras.length > 0) {
      if (this.validaClienteViajeXManiobras(maniobras)) {
        if (idProdServ !== undefined) {
          maniobras.forEach(ma => {
            if (this.facturacionService.aFacturarV.length > 0) {
              const res = this.facturacionService.aFacturarV.filter(function (concept) {
                return concept.idProdServ === idProdServ;
              });

              if (res.length > 0) {
                res.forEach(r => {
                  // r.maniobras.forEach(m => {

                  const resM = r.maniobras.filter(function (man) {
                    return man._id === ma._id;
                  });

                  if (resM.length > 0) {
                    aAgregar = [];
                    swal('El contenedor ' + ma.contenedor + ' ya se agrego con este concepto', '', 'error');
                  } else {
                    aAgregar.push(ma);
                  }
                  // });
                });
              } else {
                aAgregar.push(ma);
              }
            } else {
              aAgregar.push(ma);
            }
          });
        } else {
          aAgregar = [];
          swal('Debes seleccionar un Producto o Servicio!', '', 'error');
        }
      } else {
        aAgregar = [];
        swal('Las maniobras seleccionadas son de diferente NAVIERA o distinto VIAJE', '', 'error');
      }
    } else {
      aAgregar = [];
      swal('Debes seleccionar por lo menos una maniobra!', '', 'error');
    }

    if (aAgregar.length > 0) {
      const c = this.facturacionService.aFacturarV.filter(function (concept) {
        return concept.idProdServ === idProdServ;
      });
      if (c.length > 0) {
        aAgregar.forEach(x => {
          const pos = this.facturacionService.aFacturarV.findIndex(a => a.idProdServ === idProdServ);
          this.facturacionService.aFacturarV[pos].maniobras.push(x);
          aAgregar = [];
          this.openSnackBar('Maniobras agregadas para facturar!', 'Facturar');
          // this.selectionComplementos.clear();
          // this.selectionLavadoVacios.clear();
          // this.selectionReparacionVacios.clear();
          // swal('Maniobras agregadas', 'Tienes ' + this.facturacionService.aFacturarV.length + ' concepto (s) por facturar', 'success');
        });
      } else {
        const concepto = {
          idProdServ: idProdServ,
          maniobras: aAgregar
        };
        this.facturacionService.aFacturarV.push(concepto);
        aAgregar = [];
        this.openSnackBar('Maniobras agregadas para facturar!', 'Facturar');
        // this.selectionComplementos.clear();
        // this.selectionLavadoVacios.clear();
        // this.selectionReparacionVacios.clear();
        // swal('Maniobras agregadas', 'Tienes ' + this.facturacionService.aFacturarV.length + ' concepto (s) por facturar', 'success');
      }
    }
    // console.log(this.facturacionService.aFacturarV);
  }

  facturar() {
    if (this.facturacionService.aFacturarV.length > 0) {
      if (this.validaClienteViajeXConceptos(this.facturacionService.aFacturarV)) {
        //////////////// DATOS GENERALES ////////////////
        // Serie (default)
        // Folio (default)
        // Sucursal (default)
        // Forma de Pago (default)
        // Moneda (default)
        this.facturacionService.IE = 'I';
        // Fecha (default)
        /////////////////////////////////////////////////

        /////////////////// RECEPTOR ////////////////////
        this.facturacionService.peso = ESTADOS_CONTENEDOR.VACIO;
        this.facturacionService.receptor = this.facturacionService.aFacturarV[0].maniobras[0].naviera;
        // this.facturacionService.tipo = 'Descarga';
        /////////////////////////////////////////////////

        /////////////////// CONCEPTOS ///////////////////
        // Producto Servicio (por cada concepto en array aFacturarV)
        // this.facturacionService.aFacturarV.forEach(c => {
        //   c.maniobras.forEach(m => {
        //     this.facturacionService.maniobras.push(m._id);
        //   });
        // });
        // this.facturacionService.maniobras = this.selectionComplementos.selected;
        /////////////////////////////////////////////////
        this.router.navigate(['/cfdi/nuevo']);
      } else {
        swal('Las maniobras seleccionadas son de diferente NAVIERA o distinto VIAJE', '', 'error');
      }
    } else {
      swal('Debes tener alguna maniobra seleccionada para facturar', '', 'error');
    }
  }

  validaClienteViajeXConceptos(conceptos) {
    let naviera;
    let viaje;
    let ok = true;

    conceptos.forEach(c => {
      c.maniobras.forEach(m => {
        if (naviera === undefined) {
          naviera = m.naviera;
        } else {
          if (naviera !== m.naviera) {
            ok = false;
          }
        }

        if (viaje === undefined) {
          viaje = m.viaje._id;
        } else {
          if (viaje !== m.viaje._id) {
            ok = false;
          }
        }
      });
    });
    return ok;
  }

  validaClienteViajeXManiobras(maniobras) {
    let naviera;
    let viaje;
    let ok = true;

    if (this.facturacionService.aFacturarV.length > 0) {
      naviera = this.facturacionService.aFacturarV[0].maniobras[0].naviera;

      if (this.facturacionService.aFacturarV[0].maniobras[0].viaje._id) {
        viaje = this.facturacionService.aFacturarV[0].maniobras[0].viaje._id;
      } else {
        viaje = this.facturacionService.aFacturarV[0].maniobras[0].viaje;
      }
    }

    maniobras.forEach(m => {
      if (naviera === undefined) {
        naviera = m.naviera;
      } else {
        if (naviera !== m.naviera) {
          ok = false;
        }
      }

      if (viaje === undefined) {
        viaje = m.viaje._id;
      } else {
        if (viaje !== m.viaje._id) {
          ok = false;
        }
      }
    });
    return ok;
  }

  // consultaProdServ() {
  //   this.facturacionService.getProductosServicios().subscribe(productos => {
  //     this.productos = productos.productos_servicios;
  //   });
  // }

  soyAdmin() {
    if (
      this.usuarioLogueado.role === ROLES.ADMIN_ROLE ||
      this.usuarioLogueado.role === ROLES.PATIOADMIN_ROLE
    ) {
      return true;
    } else {
      return false;
    }
  }

  openSnackBar(message: string, action: string) {
    const snackBarRef = this.snackBar.open(message, action, {
      duration: 3500,
    });

    snackBarRef.afterDismissed().subscribe(facturar => {
      if (facturar.dismissedByAction === true) {
        this.facturar();
      }
    });

    // snackBarRef.onAction().subscribe(() => {
    //   console.log('action was explicitly clicked');
    // });
    // snackBarRef.afterDismissed().subscribe(() => {
    //   console.log('regardless of how the snackbar has been dismissed');
    // });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    if (this.dataSource && this.dataSource.data.length > 0) {
      this.dataSource.filter = filterValue;
      this.totalRegistros = this.dataSource.filteredData.length;
    } else {
      console.error('Error al filtrar el dataSource de CFDIs PPD');
    }
  }

}
