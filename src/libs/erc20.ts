import { encrypt, decrypt, returnaddress } from './crypto'
const bip39 = require('bip39')
const HDWalletProvider = require("@truffle/hdwallet-provider")
const web3 = require("web3")
require('dotenv').config()
const ABI = require('../../abi_erc20.json')
const MongoClient = require('mongodb').MongoClient;

const TESTNET_CONTRACT_ADDRESS_ERC20 = process.env.TESTNET_CONTRACT_ADDRESS_ERC20
const TESTNET_OWNER_ADDRESS_ERC20 = process.env.TESTNET_OWNER_ADDRESS_ERC20
const TESTNET_MNEMONIC_ERC20 = process.env.TESTNET_MNEMONIC_ERC20
const TESTNET_PROVIDER_ERC20 = process.env.TESTNET_PROVIDER_ERC20
const TESTNET_CHAIN_ID_ERC20 = process.env.TESTNET_CHAIN_ID_ERC20
const TESTNET_GAS_PRICE_ERC20 = process.env.TESTNET_GAS_PRICE_ERC20

const MAINNET_CONTRACT_ADDRESS_ERC20 = process.env.MAINNET_CONTRACT_ADDRESS_ERC20
const MAINNET_OWNER_ADDRESS_ERC20 = process.env.MAINNET_OWNER_ADDRESS_ERC20
const MAINNET_MNEMONIC_ERC20 = process.env.MAINNET_MNEMONIC_ERC20
const MAINNET_PROVIDER_ERC20 = process.env.MAINNET_PROVIDER_ERC20
const MAINNET_CHAIN_ID_ERC20 = process.env.MAINNET_CHAIN_ID_ERC20
const MAINNET_GAS_PRICE_ERC20 = process.env.MAINNET_GAS_PRICE_ERC20

const BLOCKCHAIN = process.env.BLOCKCHAIN

let MNEMONIC = ""
let OWNER_ADDRESS = ""
let CONTRACT_ADDRESS = ""
let WEB3_PROVIDER = ""
let CHAIN_ID = ""
let GAS_PRICE = ""

if (BLOCKCHAIN === 'mainnet') {
    MNEMONIC = MAINNET_MNEMONIC_ERC20
    OWNER_ADDRESS = MAINNET_OWNER_ADDRESS_ERC20
    CONTRACT_ADDRESS = MAINNET_CONTRACT_ADDRESS_ERC20
    WEB3_PROVIDER = MAINNET_PROVIDER_ERC20
    CHAIN_ID = MAINNET_CHAIN_ID_ERC20
    GAS_PRICE = MAINNET_GAS_PRICE_ERC20
} else {
    MNEMONIC = TESTNET_MNEMONIC_ERC20
    OWNER_ADDRESS = TESTNET_OWNER_ADDRESS_ERC20
    CONTRACT_ADDRESS = TESTNET_CONTRACT_ADDRESS_ERC20
    WEB3_PROVIDER = TESTNET_PROVIDER_ERC20
    CHAIN_ID = TESTNET_CHAIN_ID_ERC20
    GAS_PRICE = TESTNET_GAS_PRICE_ERC20
}

let daemonProcessing = false

console.log('Owner:', OWNER_ADDRESS)
console.log('Contract:', CONTRACT_ADDRESS)
console.log('Provider:', WEB3_PROVIDER)
console.log('Chain_Id:', CHAIN_ID)
console.log('Gas Price:', GAS_PRICE)

const getbalance = ((address) => {
    return new Promise(async response => {

        const mnemonic = bip39.generateMnemonic()
        const provider = new HDWalletProvider({
            mnemonic: mnemonic,
            providerOrUrl: WEB3_PROVIDER,
            shareNonce: false
        });

        const web3Instance = new web3(provider)
        const contract = new web3Instance.eth.Contract(
            ABI,
            CONTRACT_ADDRESS,
            { gasLimit: "10000000", gasPrice: GAS_PRICE }
        )
        let res = false
        let balance = 0
        let retries = 0
        let error = false
        while (!res) {
            try {
                const req = await contract.methods.balanceOf(address).call()
                res = true
                balance = req / 100
            } catch (e) {
                retries++
                if (retries > 5) {
                    res = true
                    error = true
                }
                console.log('Blockchain errored, retry.', e.message)
            }
        }
        let locked
        res = false
        retries = 0
        while (!res) {
            try {
                let req = await contract.methods.locks(address).call()
                locked = req / 100
                res = true
            } catch (e) {
                retries++
                if (retries > 5) {
                    res = true
                    error = true
                }
                console.log('Blockchain errored, retry.', e.message)
            }
        }
        provider.engine.stop();
        if (!error) {
            response({
                confirmed: balance,
                locked: locked
            })
        } else {
            response("Can't access blockchain data, retry.")
        }
    })
})

const gettransactions = ((address) => {
    return new Promise(async response => {
        const mnemonic = bip39.generateMnemonic()
        const provider = new HDWalletProvider({
            mnemonic: mnemonic,
            providerOrUrl: WEB3_PROVIDER,
            shareNonce: false
        });

        const web3Instance = new web3(provider)
        const contract = new web3Instance.eth.Contract(
            ABI,
            CONTRACT_ADDRESS)
        let transactions = []
        contract.getPastEvents('Transfer', {
            fromBlock: 0,
            toBlock: "latest"
        }, async function (error, events) {
            for (let k in events) {
                let event = events[k]
                if (event !== undefined && event.returnValues !== undefined && event.returnValues['to'] !== undefined && (event.returnValues['to'] === address || event.returnValues['from'] === address)) {
                    const blockData = await web3Instance.eth.getBlock(event.blockNumber)
                    transactions.push({
                        amount: parseFloat((parseInt(event.returnValues['value']) / 100).toFixed(2)),
                        from: event.returnValues['from'],
                        to: event.returnValues['to'],
                        txid: event.transactionHash,
                        time: blockData.timestamp
                    })
                }
            }
            provider.engine.stop();
            response(transactions)
        })
    })
})

const mint = ((address, amount) => {
    return new Promise(async response => {
        const provider = new HDWalletProvider({
            mnemonic: MNEMONIC,
            providerOrUrl: WEB3_PROVIDER,
            shareNonce: false
        });
        const web3Instance = new web3(provider)
        const contract = new web3Instance.eth.Contract(
            ABI,
            CONTRACT_ADDRESS,
            { gasLimit: "5000000", gasPrice: GAS_PRICE }
        )
        let transaction
        let retries = 0
        let res = false
        let error = false
        while (!res) {
            try {
                console.log('TRYING MINTING TOKENS..')
                const req = await contract.methods.mint(address, amount).send({ from: OWNER_ADDRESS, chain_Id: parseInt(CHAIN_ID) })
                console.log('TRANSACTION SENT, TXID IS', req['transactionHash'])
                res = true
                transaction = req
            } catch (e) {
                retries++
                if (retries > 5) {
                    res = true
                    error = true
                }
                console.log(e)
            }
        }
        provider.engine.stop();
        if (!error) {
            response(transaction)
        } else {
            response(false)
        }
    })

})

const lock = ((address, amount) => {
    return new Promise(async response => {
        const provider = new HDWalletProvider({
            mnemonic: MNEMONIC,
            providerOrUrl: WEB3_PROVIDER,
            shareNonce: false
        });
        const web3Instance = new web3(provider)
        const contract = new web3Instance.eth.Contract(
            ABI,
            CONTRACT_ADDRESS,
            { gasLimit: "5000000", gasPrice: GAS_PRICE }
        )
        let res = false
        let transaction
        let retries = 0
        let error = false
        while (!res) {
            try {
                console.log('TRYING LOCKING ' + amount + ' TOKENS TO ' + address)
                const req = await contract.methods.addlock(address, amount).send({ from: OWNER_ADDRESS, chain_Id: parseInt(CHAIN_ID) })
                console.log('TRANSACTION SENT, TXID IS', req['transactionHash'])
                res = true
                transaction = req
            } catch (e) {
                retries++
                if (retries > 5) {
                    res = true
                    error = true
                }
                console.log(e)
            }
        }
        provider.engine.stop();
        if (!error) {
            response(transaction)
        } else {
            response(false)
        }
    })

})

const unlock = ((address) => {
    return new Promise(async response => {
        const provider = new HDWalletProvider({
            mnemonic: MNEMONIC,
            providerOrUrl: WEB3_PROVIDER,
            shareNonce: false
        });
        const web3Instance = new web3(provider)
        const contract = new web3Instance.eth.Contract(
            ABI,
            CONTRACT_ADDRESS,
            { gasLimit: "5000000", gasPrice: GAS_PRICE }
        )
        let transaction
        try {
            console.log('TRYING UNLOCKING TOKENS FOR ' + address)
            const req = await contract.methods.mintlock(address).send({ from: OWNER_ADDRESS, chain_Id: parseInt(CHAIN_ID) })
            console.log('TRANSACTION SENT, TXID IS', req['transactionHash'])
            transaction = req
            provider.engine.stop();
            response(transaction)
        } catch (e) {
            console.log(e)
            response(false)
        }
    })

})

export { getbalance, mint, lock, unlock, gettransactions }