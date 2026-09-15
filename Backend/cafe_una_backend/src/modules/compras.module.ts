import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComprasController } from '../controllers/compras.controller';
import { CompraItem } from '../entities/compra-item.entity';
import { Compra } from '../entities/compra.entity';
import { InventarioStockUbicacion } from '../entities/inventario-stock-ubicacion.entity';
import { InventarioUbicacion } from '../entities/inventario-ubicacion.entity';
import { Producto } from '../entities/producto.entity';
import { ComprasService } from '../services/compras.service';
import { ProformasService } from '../services/proformas.service';
import { AuthModule } from './auth.module';
import { UsuariosModule } from './usuarios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Compra,
      CompraItem,
      Producto,
      InventarioUbicacion,
      InventarioStockUbicacion,
    ]),
    AuthModule,
    UsuariosModule,
  ],
  controllers: [ComprasController],
  providers: [ComprasService, ProformasService],
  exports: [ComprasService],
})
export class ComprasModule {}
