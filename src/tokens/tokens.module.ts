
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TokensService } from './tokens.service';
import { TokensController } from './tokens.controller';
import { Preorder, PreorderSchema } from '../schemas/preorder.schema';


@Module({
  imports: [MongooseModule.forFeature([{ name: Preorder.name, schema: PreorderSchema }])],
  providers: [TokensService],
  exports: [TokensService],
  controllers: [TokensController]
})
export class TokensModule {}