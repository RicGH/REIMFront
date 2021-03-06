import { NgModule } from '@angular/core';
import { ImagenPipe } from './imagen.pipe';
import { FotosPipe } from './fotos.pipe';
import { ZipPipePipe } from './zip-pipe.pipe';
import { IvaPipe } from '../pages/facturacion/pipes/iva.pipe';
import { DecimalRightPadPipe } from './../pages/facturacion/pipes/decimal-rightpad.pipe';
import { NgCapitalizePipeModule } from 'angular-pipes';
import { NgAbsPipeModule } from 'angular-pipes';
import { NgLeftPadPipeModule } from 'angular-pipes';
import { ComaPipe } from '../pages/facturacion/pipes/coma.pipe';


@NgModule({
  imports: [],
  declarations: [
    ImagenPipe,
    FotosPipe,
    ZipPipePipe,
    IvaPipe,
    DecimalRightPadPipe,
    ComaPipe
  ],
  exports: [
    ImagenPipe,
    FotosPipe,
    DecimalRightPadPipe,
    NgCapitalizePipeModule,
    NgAbsPipeModule,
    NgLeftPadPipeModule,
    ComaPipe
  ],
  providers: [
    FotosPipe
  ]
})
export class PipesModule { }
