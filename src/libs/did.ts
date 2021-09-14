import { encrypt, decrypt, returnaddress } from './crypto'
const crypto = require('crypto')
const bip39 = require('bip39')
const HDWalletProvider = require("@truffle/hdwallet-provider")
const web3 = require("web3")
require('dotenv').config()
const ABI = require('../../abi_did.json')

const TESTNET_CONTRACT_ADDRESS_DID = process.env.TESTNET_CONTRACT_ADDRESS_DID
const TESTNET_OWNER_ADDRESS_DID = process.env.TESTNET_OWNER_ADDRESS_DID
const TESTNET_MNEMONIC_DID = process.env.TESTNET_MNEMONIC_DID
const TESTNET_PROVIDER_DID = process.env.TESTNET_PROVIDER_DID
const TESTNET_CHAIN_ID_DID = process.env.TESTNET_CHAIN_ID_DID
const TESTNET_GAS_PRICE_DID = process.env.TESTNET_GAS_PRICE_DID

const MAINNET_CONTRACT_ADDRESS_DID = process.env.MAINNET_CONTRACT_ADDRESS_DID
const MAINNET_OWNER_ADDRESS_DID = process.env.MAINNET_OWNER_ADDRESS_DID
const MAINNET_MNEMONIC_DID = process.env.MAINNET_MNEMONIC_DID
const MAINNET_PROVIDER_DID = process.env.MAINNET_PROVIDER_DID
const MAINNET_CHAIN_ID_DID = process.env.MAINNET_CHAIN_ID_DID
const MAINNET_GAS_PRICE_DID = process.env.MAINNET_GAS_PRICE_DID

const BLOCKCHAIN = process.env.BLOCKCHAIN

let MNEMONIC = ""
let OWNER_ADDRESS = ""
let CONTRACT_ADDRESS = ""
let WEB3_PROVIDER = ""
let CHAIN_ID = ""
let GAS_PRICE = ""

if (BLOCKCHAIN === 'mainnet') {
    console.log('Using mainnet blockchain')
    MNEMONIC = MAINNET_MNEMONIC_DID
    OWNER_ADDRESS = MAINNET_OWNER_ADDRESS_DID
    CONTRACT_ADDRESS = MAINNET_CONTRACT_ADDRESS_DID
    WEB3_PROVIDER = MAINNET_PROVIDER_DID
    CHAIN_ID = MAINNET_CHAIN_ID_DID
    GAS_PRICE = MAINNET_GAS_PRICE_DID
} else {
    console.log('Using testnet blockchain')
    MNEMONIC = TESTNET_MNEMONIC_DID
    OWNER_ADDRESS = TESTNET_OWNER_ADDRESS_DID
    CONTRACT_ADDRESS = TESTNET_CONTRACT_ADDRESS_DID
    WEB3_PROVIDER = TESTNET_PROVIDER_DID
    CHAIN_ID = TESTNET_CHAIN_ID_DID
    GAS_PRICE = TESTNET_GAS_PRICE_DID
}

const register = (async (card_hash, pin) => {
    return new Promise(async response => {
        const provider = new HDWalletProvider({
            mnemonic: MNEMONIC,
            providerOrUrl: WEB3_PROVIDER,
            shareNonce: false
        });
        const web3Instance = new web3(provider);

        const contract = new web3Instance.eth.Contract(
            ABI,
            CONTRACT_ADDRESS,
            { gasLimit: "5000000", gasPrice: GAS_PRICE }
        );

        try {
            // Calculate the public hash, which is an hash of the printed one.
            const public_hash = crypto.createHash('sha256').update(card_hash).digest('hex')
            // Then merge the hash with the user pin, to create a new unique hash.
            const mnemonic_hash = crypto.createHash('sha256').update(card_hash + '*' + pin).digest('hex')
            // Generate and print the mnemonic, this will be always the same.
            const mnemonic = bip39.entropyToMnemonic(mnemonic_hash)
            // Calculate the IV by the original qr-code.
            const iv = card_hash.substr(0, 8) + card_hash.substr(-8)
            // Then encrypt the mnemonic (or whathever you want) with the pin of the user and the IV derived from the printed qr-code.
            const identity = encrypt(mnemonic, iv, pin)
            // Finally return the public address.
            const address = await returnaddress(mnemonic)
            console.log('Derived address is ' + address.pub + ', registering..')
            let transaction = await contract.methods.setIdentity(identity, address.pub, public_hash).send({ from: OWNER_ADDRESS })
            console.log('TRANSACTION SENT, TXID IS: ' + transaction['transactionHash'])
            // Now checking if eID is stored correctly
            const stored = await contract.methods.returnEid(public_hash).call({ from: OWNER_ADDRESS })
            if (identity === stored) {
                provider.engine.stop();
                console.log('Identity added successfully!', identity, stored)
                response({
                    mnemonic: mnemonic,
                    address: address.pub,
                    eid: iv + '*' + identity,
                    transaction: transaction
                })
            } else {
                console.log('Something goes wrong')
                response(false)
            }
        } catch (e) {
            console.log("--")
            console.log(e.message)
            console.log("--")
            provider.engine.stop();
            response(false)
        }
    })
})

const recover = (async (card_hash, pin) => {
    return new Promise(async response => {
        const provider = new HDWalletProvider({
            mnemonic: MNEMONIC,
            providerOrUrl: WEB3_PROVIDER,
            shareNonce: false
        });
        const web3Instance = new web3(provider);

        const contract = new web3Instance.eth.Contract(
            ABI,
            CONTRACT_ADDRESS,
            { gasLimit: "5000000", gasPrice: GAS_PRICE }
        );

        try {
            // Calculate the public hash, which is an hash of the printed one.
            const public_hash = crypto.createHash('sha256').update(card_hash).digest('hex')
            // Derive the IV to create the final string
            const iv = card_hash.substr(0, 8) + card_hash.substr(-8)
            const vault = await contract.methods.returnEid(public_hash).call({ from: OWNER_ADDRESS })

            // Create the original encrypted string
            const eid = iv + '*' + vault
            // Try to recover the mnemonic
            const mnemonic = decrypt(eid, pin)
            if (mnemonic !== false) {
                // Finally recover the public address.
                const address = await returnaddress(mnemonic)
                response({
                    address: address.pub,
                    mnemonic: mnemonic,
                    eid: eid
                })
            } else {
                response(false)
            }
        } catch (e) {
            console.log("--")
            console.log(e.message)
            console.log("--")
            provider.engine.stop();
            response(false)
        }
    })
})

const vault = (async (card_hash) => {
    return new Promise(async response => {
        const provider = new HDWalletProvider({
            mnemonic: MNEMONIC,
            providerOrUrl: WEB3_PROVIDER,
            shareNonce: false
        });
        const web3Instance = new web3(provider);

        const contract = new web3Instance.eth.Contract(
            ABI,
            CONTRACT_ADDRESS,
            { gasLimit: "5000000", gasPrice: GAS_PRICE }
        );

        try {
            // Calculate the public hash, which is an hash of the printed one.
            const public_hash = crypto.createHash('sha256').update(card_hash).digest('hex')
            // Derive the IV to create the final string
            const iv = card_hash.substr(0, 8) + card_hash.substr(-8)
            const vault = await contract.methods.returnEid(public_hash).call({ from: OWNER_ADDRESS })

            // Create the original encrypted string
            const eid = iv.toString('hex') + '*' + vault
            response(eid)
        } catch (e) {
            console.log("--")
            console.log(e.message)
            console.log("--")
            provider.engine.stop();
            response(false)
        }
    })
})

const getaddressbyhash = (async (card_hash) => {
    const mnemonic = bip39.generateMnemonic()
    const provider = new HDWalletProvider({
        mnemonic: mnemonic,
        providerOrUrl: WEB3_PROVIDER,
        shareNonce: false
    });
    const web3Instance = new web3(provider);
    const contract = new web3Instance.eth.Contract(
        ABI,
        CONTRACT_ADDRESS,
        { gasLimit: "5000000", gasPrice: GAS_PRICE }
    );
    const public_hash = crypto.createHash('sha256').update(card_hash).digest('hex')
    const stored = await contract.methods.returnPublicAddress(public_hash).call()
    return stored
})

export { register, recover, getaddressbyhash, vault }