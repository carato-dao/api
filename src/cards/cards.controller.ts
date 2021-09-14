
import { Controller, Post, Get, Request } from '@nestjs/common';
import { CardsService } from './cards.service';
let isProcessing = false

@Controller('cards')
export class CardsController {
    constructor(private CardsService: CardsService) {
        const app = this
        setInterval(async function () {
            if (!isProcessing) {
                isProcessing = true
                try {
                    await app.CardsService.processPreorders()
                    isProcessing = false
                } catch (e) {
                    isProcessing = false
                }
            }
        }, 180000)
        setTimeout(async function () {
            if (!isProcessing) {
                isProcessing = true
                try {
                    await app.CardsService.processPreorders()
                    isProcessing = false
                } catch (e) {
                    isProcessing = false
                }
            }
        }, 3000)
    }

    @Post('register')
    registerCard(@Request() req) {
        return this.CardsService.registerCard(req)
    }

    @Post('recover')
    recoverCard(@Request() req) {
        return this.CardsService.recoverCard(req)
    }

    @Get('address/:hash')
    getCardAddress(@Request() req) {
        return this.CardsService.getCardAddress(req)
    }

    @Get('check/:hash')
    checkCardBalance(@Request() req) {
        return this.CardsService.checkCardBalance(req)
    }
}
