import { writeFileSync } from 'fs'
import { OrdinalMarketplace } from '../src/contracts/ordinalMarketplaceApp'
import { privateKey } from './privateKey'
import { bsv, TestWallet, DefaultProvider, sha256, Addr } from 'scrypt-ts'
import { OrdiNFTP2PKH, OrdinalNFT } from 'scrypt-ord'

function getScriptHash(scriptPubKeyHex: string) {
    const res = sha256(scriptPubKeyHex).match(/.{2}/g)
    if (!res) {
        throw new Error('scriptPubKeyHex is not of even length')
    }
    return res.reverse().join('')
}

async function main() {
    await OrdinalMarketplace.loadArtifact()

    // Prepare signer. 
    // See https://scrypt.io/docs/how-to-deploy-and-call-a-contract/#prepare-a-signer-and-provider
    const signer = new TestWallet(privateKey, new DefaultProvider({
        network: bsv.Networks.testnet
    }))

    // Adjust the amount of satoshis locked in the smart contract:
    const amount = 1

    const instance = new OrdinalMarketplace()

    // Connect to a signer.
    await instance.connect(signer)

    // Contract deployment.
    const deployTx = await instance.deploy(amount)

    // Save deployed contracts script hash.
    const scriptHash = getScriptHash(instance.lockingScript.toHex())
    const shFile = `.scriptHash`;
    writeFileSync(shFile, scriptHash);

    console.log('OrdinalMarketplaceApp contract was successfully deployed!')
    console.log(`TXID: ${deployTx.id}`)
    console.log(`scriptHash: ${scriptHash}`)
    
    for (let i = 0; i < 3; i++) {
        const ord = new OrdiNFTP2PKH(Addr(privateKey.toAddress().toByteString()))
        await ord.connect(signer)
        
        const ordTx = await ord.inscribeText(`Hello, sCrypt! ${i}`)
        console.log(`Deployed NFT: ${ordTx.id}`)
    }
}

main()
