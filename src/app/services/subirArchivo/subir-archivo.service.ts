import { Injectable } from '@angular/core';
import { URL_SERVICIOS } from '../../../environments/environment';
import { FileItem } from '../../models/file-item.models';
import swal from 'sweetalert';
import { Observable} from 'rxjs';
import { map} from 'rxjs/operators';
import { HttpClient , HttpEventType} from '@angular/common/http';

@Injectable()
export class SubirArchivoService {
  constructor(public http: HttpClient) { }


  subirArchivoBucketTemporal(archivo: File): Observable<any> {
    if (!archivo) {
    return;
  }
  const formData = new FormData();
  formData.append('file', archivo, archivo.name);
  const url = URL_SERVICIOS + '/uploadBucketTemp';
  return this.http.put( url, formData )
  .pipe(map( (resp: any) => {
    swal('Archivo Cargado', resp.nombreArchivo, 'success');
    return resp.nombreArchivo;
  }));
}

  cargarFotosLavadoReparacion(imagenes: FileItem[], tipo: string, id: string) {
    return new Promise((resolve, reject) => {
      let j = 0;
      for (const item of imagenes) {
        const formData = new FormData();
        formData.append('file', item.archivo, item.nombreArchivo);
        const url = URL_SERVICIOS + '/maniobras/maniobra/' + id + '/addimg/' + tipo + '/';
        this.http.put( url, formData, {reportProgress: true, observe: 'events'} )
        .subscribe(event => {
          if (event.type === HttpEventType.UploadProgress) {
            item.progreso = Math.round( (event.loaded / event.total * 100) - 20);
          } else if (event.type === HttpEventType.Response) {
            j++;
            item.progreso = 100;
            if (j >= imagenes.length) {
              resolve(true);
            }
          }
        });
      }
    });
  }
}
