import ethWallet, { hdkey as ethHdKey } from 'ethereumjs-wallet';
const HDWalletProvider = require("@truffle/hdwallet-provider")
const web3 = require("web3")
const bip39 = require('bip39')
const ETH_DERIVATION_PATH = 'm/44\'/60\'/0\'/0';
const crypto = require('crypto')
require('dotenv').config()

const TESTNET_CONTRACT_ADDRESS_ERC20 = process.env.TESTNET_CONTRACT_ADDRESS_ERC20
const TESTNET_OWNER_ADDRESS_ERC20 = process.env.TESTNET_OWNER_ADDRESS_ERC20
const TESTNET_MNEMONIC_ERC20 = process.env.TESTNET_MNEMONIC_ERC20
const TESTNET_PROVIDER_ERC20 = process.env.TESTNET_PROVIDER_ERC20
const TESTNET_CHAINID_ERC20 = process.env.TESTNET_CHAINID_ERC20
const TESTNET_GAS_PRICE_ERC20 = process.env.TESTNET_GAS_PRICE_ERC20

const MAINNET_CONTRACT_ADDRESS_ERC20 = process.env.MAINNET_CONTRACT_ADDRESS_ERC20
const MAINNET_OWNER_ADDRESS_ERC20 = process.env.MAINNET_OWNER_ADDRESS_ERC20
const MAINNET_MNEMONIC_ERC20 = process.env.MAINNET_MNEMONIC_ERC20
const MAINNET_PROVIDER_ERC20 = process.env.MAINNET_PROVIDER_ERC20
const MAINNET_CHAINID_ERC20 = process.env.MAINNET_CHAINID_ERC20
const MAINNET_GAS_PRICE_ERC20 = process.env.MAINNET_GAS_PRICE_ERC20

const BLOCKCHAIN = process.env.BLOCKCHAIN

let MNEMONIC = ""
let OWNER_ADDRESS = ""
let CONTRACT_ADDRESS = ""
let WEB3_PROVIDER = ""
let CHAINID = ""
let GAS_PRICE = ""

if (BLOCKCHAIN === 'mainnet') {
    MNEMONIC = MAINNET_MNEMONIC_ERC20
    OWNER_ADDRESS = MAINNET_OWNER_ADDRESS_ERC20
    CONTRACT_ADDRESS = MAINNET_CONTRACT_ADDRESS_ERC20
    WEB3_PROVIDER = MAINNET_PROVIDER_ERC20
    CHAINID = MAINNET_CHAINID_ERC20
    GAS_PRICE = MAINNET_GAS_PRICE_ERC20
} else {
    MNEMONIC = TESTNET_MNEMONIC_ERC20
    OWNER_ADDRESS = TESTNET_OWNER_ADDRESS_ERC20
    CONTRACT_ADDRESS = TESTNET_CONTRACT_ADDRESS_ERC20
    WEB3_PROVIDER = TESTNET_PROVIDER_ERC20
    CHAINID = TESTNET_CHAINID_ERC20
    GAS_PRICE = TESTNET_GAS_PRICE_ERC20
}

const encrypt = ((val, iv, password) => {
    let pwd = crypto.createHash('sha256').update(String(password)).digest('base64').substr(0, 32)
    let cipher = crypto.createCipheriv('aes-256-cbc', pwd, iv)
    let encrypted = cipher.update(val, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
})

const decrypt = ((encrypted, password) => {
    try {
        let parts = encrypted.split('*')
        let pwd = crypto.createHash('sha256').update(String(password)).digest('base64').substr(0, 32)
        let decipher = crypto.createDecipheriv('aes-256-cbc', pwd, parts[0])
        let decrypted = decipher.update(parts[1], 'hex', 'utf8')
        let mnemonic = decrypted + decipher.final('utf8')
        let doublecheck = mnemonic.split(' ')
        if (doublecheck.length === 24) {
            return mnemonic
        } else {
            return false
        }
    } catch (e) {
        return false
    }
})

const hash = ((text) => {
    let buf = Buffer.from(text)
    var sha = crypto.createHash('sha256').update(buf).digest()
    return sha.toString('hex')
})

const returnaddress = (async (mnemonic) => {
    const hdwallet = ethHdKey.fromMasterSeed(await bip39.mnemonicToSeed(mnemonic));
    const derivePath = hdwallet.derivePath(ETH_DERIVATION_PATH).deriveChild(0);
    const privkey = derivePath.getWallet().getPrivateKeyString();
    const wallet = ethWallet.fromPrivateKey(Buffer.from(privkey.replace('0x', ''), 'hex'));
    const address = wallet.getAddressString()
    return {
        pub: address,
        prv: privkey
    }
})

const fundaddress = (async (address, amount = 0.001) => {
    const provider = new HDWalletProvider({
        mnemonic: MNEMONIC,
        providerOrUrl: WEB3_PROVIDER,
        shareNonce: false
    });
    let success
    const web3Instance = new web3(provider)
    const gasPrice = await web3Instance.eth.getGasPrice()
    console.log('Gas Price is: ' + gasPrice)
    let balance = await web3Instance.eth.getBalance(OWNER_ADDRESS)
    balance = web3Instance.utils.fromWei(balance, "ether");
    console.log('Owner balance is:', balance)

    if (balance > (amount + 0.0001)) {
        success = true
        let wei = web3Instance.utils.toWei(amount.toString(), "ether");
        let tx = await web3Instance.eth.sendTransaction({ from: OWNER_ADDRESS, to: address, value: wei, chainId: parseInt(CHAINID), gasPrice: gasPrice })
        if (tx['transactionHash'] !== undefined) {
            success = true
        } else {
            success = false
        }
    } else {
        success = false
    }

    provider.engine.stop();
    return success
})

const getgasbalance = (async (address) => {
    const provider = new HDWalletProvider({
        mnemonic: MNEMONIC,
        providerOrUrl: WEB3_PROVIDER,
        shareNonce: false
    });
    const web3Instance = new web3(provider)
    let balance = await web3Instance.eth.getBalance(address)
    balance = web3Instance.utils.fromWei(balance, "ether");
    provider.engine.stop();
    return balance
})

export { encrypt, decrypt, hash, returnaddress, fundaddress, getgasbalance }