
import { Controller, Post, Get, Request } from '@nestjs/common';
import { TokensService } from './tokens.service';

@Controller('tokens')
export class TokensController {
    constructor(private TokensService: TokensService) { }

    @Post('mint')
    mintTokens(@Request() req) {
        return this.TokensService.mintTokens(req)
    }

    @Post('preorder')
    preorderTokens(@Request() req) {
        return this.TokensService.preorderTokens(req)
    }

    @Post('lock')
    addLockTokens(@Request() req) {
        return this.TokensService.addLockTokens(req)
    }

    @Post('unlock')
    unlockTokens(@Request() req) {
        return this.TokensService.unlockTokens(req)
    }

    @Get('preorders/:hash')
    getPreorders(@Request() req) {
        return this.TokensService.getPreorders(req)
    }

    @Get('balance/:hash')
    getBalanceTokens(@Request() req) {
        return this.TokensService.getBalanceTokens(req)
    }

    @Get('transactions/:hash')
    getTransactionsTokens(@Request() req) {
        return this.TokensService.getTransactionsTokens(req)
    }
}
