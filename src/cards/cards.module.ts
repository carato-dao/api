
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { Preorder, PreorderSchema } from '../schemas/preorder.schema';


@Module({
  imports: [MongooseModule.forFeature([{ name: Preorder.name, schema: PreorderSchema }])],
  providers: [CardsService],
  exports: [CardsService],
  controllers: [CardsController]
})
export class CardsModule {}