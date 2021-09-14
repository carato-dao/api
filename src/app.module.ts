import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CardsModule } from './cards/cards.module';
import { TokensModule } from './tokens/tokens.module';
import { MongooseModule } from '@nestjs/mongoose';
require('dotenv').config()

@Module({
  imports: [
    CardsModule, TokensModule,
    MongooseModule.forRoot(process.env.MONGO_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
    useCreateIndex: true,
    retryWrites: true
  })],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
