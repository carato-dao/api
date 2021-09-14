import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
const bip39 = require('bip39');
require('dotenv').config()
import { Preorder, PreorderDocument } from '../schemas/preorder.schema';
import { fundaddress, getgasbalance } from '../libs/crypto'
import { register, getaddressbyhash, recover, vault } from '../libs/did'
import { mint, lock } from '../libs/erc20'

@Injectable()
export class CardsService {
  constructor(
    @InjectModel(Preorder.name) private preorder: Model<PreorderDocument>
  ) { }

  async registerCard(req): Promise<any> {
    if (req.body.hash !== undefined && req.body.pin !== undefined) {
      const hash = req.body.hash
      const pin = req.body.pin
      const check = await getaddressbyhash(hash)
      if (check === "0x0000000000000000000000000000000000000000") {
        const registered = await register(hash, pin)
        if (registered !== false) {
          return { message: "Registration processed", error: false, registered: registered }
        } else {
          return { message: "Registration errored, please retry", error: true }
        }
      } else {
        return { message: "This hash exists yet", error: true }
      }
    } else {
      return { message: "Please provide a `hash` and a `pin` field", error: true }
    }
  }

  processPreorders(): Promise<any> {
    return new Promise(async response => {
      let preorders = await this.preorder.find({ txidLock: 'PENDING' })
      console.log('Checking preorders..')
      if (preorders.length > 0) {
        for (let k in preorders) {
          let preorder = preorders[k]
          const registered = await getaddressbyhash(preorder.card_hash)
          if (registered !== "0x0000000000000000000000000000000000000000") {
            console.log('Funding address for with initial funds..')
            await fundaddress(registered)
            if (preorder.amount > 0) {
              console.log('Minting ' + preorder.amount + ' tokens..')
              let tx = await mint(registered, preorder.amount)
              if (tx['transactionHash'] !== undefined) {
                preorder.txidMint = tx['transactionHash']
                await preorder.save()
              }
            } else {
              console.log('Nothing preordered..')
            }
            if (preorder.locked !== undefined && preorder.locked > 0) {
              console.log('Locking ' + preorder.locked + ' tokens..')
              let tx = await lock(registered, preorder.locked)
              if (tx['transactionHash'] !== undefined) {
                preorder.txidLock = tx['transactionHash']
                await preorder.save()
              }
            } else {
              console.log('Nothing locked..')
            }
          } else {
            console.log('Card is not active!')
          }
          response(true)
        }
        response(true)
      } else {
        response(false)
      }
    })
  }

  async recoverCard(req): Promise<any> {
    if (req.body.hash !== undefined) {
      const hash = req.body.hash
      const pin = req.body.pin
      const check = await getaddressbyhash(hash)
      if (check !== "0x0000000000000000000000000000000000000000") {
        if (pin !== undefined) {
          const recovered = await recover(hash, pin)
          if (recovered !== false) {
            return { message: "Card recovered", wallet: recovered, error: false }
          } else {
            return { message: "Recover process errored, pin can be wrong", error: true }
          }
        } else {
          const eid = await vault(hash)
          return { message: "eID recovered", eid: eid, error: false }
        }
      } else {
        return { message: "This hash was never been registered", error: true }
      }
    } else {
      return { message: "Please provide `hash` field", error: true }
    }
  }

  async getCardAddress(req): Promise<any> {
    const hash = req.params.hash
    const address = await getaddressbyhash(hash)
    return { address }
  }

  async checkCardBalance(req): Promise<any> {
    const hash = req.params.hash
    const address = await getaddressbyhash(hash)
    if (address !== "0x0000000000000000000000000000000000000000") {
      let balance = await getgasbalance(address)
      if (balance < 0.001) {
        await fundaddress(address)
        balance = await getgasbalance(address)
      }
      return { balance: balance, error: false }
    } else {
      return { message: 'Card not exists', error: true }
    }
  }

}