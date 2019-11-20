import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators, AbstractControl, FormArray } from '@angular/forms';
import { Observable } from 'rxjs';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { TipoContenedorService } from '../../services/tipoContenedor/tipoContenedor.service';

declare var swal: any;

@Component({
  selector: 'app-tipos-contenedores',
  templateUrl: './tipos-contenedores.component.html',
  styles: ['']
})
export class TiposContenedoresComponent implements OnInit {
  cargando: boolean = true;
  totalRegistros: number = 0;

  displayedColumns = ['actions', 'tipo', 'descripcion', 'pies', 'codigoISO'];
  dataSource: any;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;



  constructor(private tipoContenedorService: TipoContenedorService) { }



  ngOnInit() {
    this.cargarTiposContenedor();
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
    this.totalRegistros = this.dataSource.filteredData.length;
  }

  cargarTiposContenedor(){
    this.cargando = true;

    this.tipoContenedorService.getTiposContenedor().subscribe((tipo) => {
      this.dataSource = new MatTableDataSource(tipo.tiposContenedor);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.totalRegistros = tipo.tiposContenedor.length;
    });
    this.cargando = false;
  }

  borrarTipo(tipoContenedor) {
    swal({
      title: '¿Esta seguro?',
      text: 'Esta apunto de borrar a ' + tipoContenedor.tipo,
      icon: 'warning',
      buttons: true,
      dangerMode: true,
    })
      .then(borrar => {
        if (borrar) {
          this.tipoContenedorService.borrarTipoContenedor(tipoContenedor._id)
            .subscribe(() => this.cargarTiposContenedor());
        }
      });
  }
}
