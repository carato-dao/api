import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
const bip39 = require('bip39');
require('dotenv').config()
import { Preorder, PreorderDocument } from '../schemas/preorder.schema';
import { getaddressbyhash } from '../libs/did'
import { mint, getbalance, lock, unlock, gettransactions } from '../libs/erc20'

@Injectable()
export class TokensService {
  constructor(
    @InjectModel(Preorder.name) private preorder: Model<PreorderDocument>
  ) { }

  async mintTokens(req): Promise<any> {
    if (req.body.to !== undefined && req.body.amount !== undefined) {
      const passphrase = req.body.passphrase
      if (passphrase === process.env.UNLOCK_PASSPHRASE) {
        const hash = req.body.to
        const amount = req.body.amount
        const check = await getaddressbyhash(hash)
        if (check !== "0x0000000000000000000000000000000000000000") {
          const fixedAmount = parseFloat(amount) * 100
          let minted = await mint(check, fixedAmount)
          return { minted: minted, error: false }
        } else {
          return { message: "This hash was never been registered", error: true }
        }
      } else {
        return { message: "Nah, passphrase is wrong!", error: true }
      }
    } else {
      return { message: "Please provide `to` and `amount` field", error: true }
    }
  }

  async addLockTokens(req): Promise<any> {
    if (req.body.to !== undefined && req.body.amount !== undefined) {
      const passphrase = req.body.passphrase
      if (passphrase === process.env.UNLOCK_PASSPHRASE) {
        const hash = req.body.to
        const amount = req.body.amount
        const check = await getaddressbyhash(hash)
        if (check !== "0x0000000000000000000000000000000000000000") {
          const fixedAmount = parseFloat(amount) * 100
          let locked = await lock(check, fixedAmount)
          return { locked, error: false }
        } else {
          return { message: "This hash was never been registered", error: true }
        }
      } else {
        return { message: "Nah, passphrase is wrong!", error: true }
      }
    } else {
      return { message: "Please provide `to` and `amount` field", error: true }
    }
  }

  async unlockTokens(req): Promise<any> {
    if (req.body.to !== undefined && req.body.passphrase !== undefined) {
      const hash = req.body.to
      const passphrase = req.body.passphrase
      if (passphrase === process.env.UNLOCK_PASSPHRASE) {
        const address = await getaddressbyhash(hash)
        if (address !== "0x0000000000000000000000000000000000000000") {
          let balance = await getbalance(address)
          if (balance['locked'] > 0) {
            let unlocked = await unlock(address)
            if (unlocked !== false) {
              balance = await getbalance(address)
              return { unlocked: unlocked, balance: balance, error: false }
            } else {
              return { message: "Error while unlocking tokens, maybe there's nothing to unlock", error: true }
            }
          } else {
            return { message: "Nothing to unlock", balance: balance, error: true }
          }
        } else {
          return { message: "This hash was never been registered", error: true }
        }
      } else {
        return { message: "Nah, passphrase is wrong!", error: true }
      }
    } else {
      return { message: "Please provide `to` and `passphrase` field", error: true }
    }
  }

  async getBalanceTokens(req): Promise<any> {
    const hash = req.params.hash
    const address = await getaddressbyhash(hash)
    if (address !== "0x0000000000000000000000000000000000000000") {
      let balance = await getbalance(address)
      return { balance, error: false }
    } else {
      return { message: "This hash was never been registered", error: true }
    }
  }

  async getTransactionsTokens(req): Promise<any> {
    const hash = req.params.hash
    const address = await getaddressbyhash(hash)
    if (address !== "0x0000000000000000000000000000000000000000") {
      let transactions = await gettransactions(address)
      return { transactions, error: false }
    } else {
      return { message: "This hash was never been registered", error: true }
    }
  }

  async preorderTokens(req): Promise<any> {
    if (req.body.to !== undefined && req.body.amount !== undefined) {
      const passphrase = req.body.passphrase
      if (passphrase === process.env.UNLOCK_PASSPHRASE) {
        const check = await getaddressbyhash(req.body.to)
        if (check === "0x0000000000000000000000000000000000000000") {
          const fixedAmount = parseFloat(req.body.amount) * 100
          let fixedLocked = 0
          let txidLock = '-'
          if (req.body.locked !== undefined) {
            fixedLocked = parseFloat(req.body.locked) * 100
            txidLock = 'PENDING'
          }
          const newPreorder = new this.preorder({
            card_hash: req.body.to,
            amount: fixedAmount,
            locked: fixedLocked,
            txidMint: 'PENDING',
            txidLock: txidLock
          });
          await newPreorder.save()
          return { message: "Preorder queued correctly", error: false }
        } else {
          return { message: "This card is registered yet, please mint tokens directly", error: true }
        }
      } else {
        return { message: "Nah, passphrase is wrong!", error: true }
      }
    } else {
      return { message: "Please provide `to` and `amount` field", error: true }
    }
  }

  async getPreorders(req): Promise<any> {
    let preorders = await this.preorder.find({ card_hash: req.params.hash })
    return preorders
  }
}