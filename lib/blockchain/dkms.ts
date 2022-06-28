/*
tyron.js: SSI Protocol's JavaScript/TypeScript library
Self-Sovereign Identity Protocol.
Copyright (C) Tyron Pungtas and its affiliates.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.*/

import Arweave from 'arweave'
import * as zcrypto from '@zilliqa-js/crypto'
import { Action, DocumentConstructor } from '../did/protocols/models/document-model'
import tyronzil from './tyronzil'
import CryptoUtil from './crypto-util'
const { subtle } = require('crypto').webcrypto

export default class DKMS {
    public static async operationKeyPair(
        arConnect: any,
        id: any,
        addr: string
    ) {
        const private_key = zcrypto.schnorr.generatePrivateKey()
        const public_key = '0x' + zcrypto.getPubKeyFromPrivateKey(private_key)
        const encrypted_key = await DKMS.encryptKey(arConnect, private_key)
        const verification_method = {
            id: id,
            key: public_key,
            encrypted: encrypted_key,
        }
        const doc_element = {
            constructor: DocumentConstructor.VerificationMethod,
            action: Action.Add,
            key: verification_method,
        }
        const doc_parameter = await tyronzil.documentParameter(
            addr,
            doc_element
        )

        return {
            element: doc_element,
            parameter: doc_parameter,
        }
    }

    public static async generatePublicEncryption(privKey: any) {
        let privateKey = Object.create(privKey)
        const algo = { name: 'RSA-OAEP', hash: { name: 'SHA-256' } }
        const keyData = {
            kty: 'RSA',
            e: 'AQAB',
            n: privateKey.n,
            alg: 'RSA-OAEP-256',
            ext: true,
        }
        const publicKey = await subtle.importKey(
            'jwk',
            keyData,
            algo,
            false,
            ['encrypt']
        )
        const keyBuf = await CryptoUtil.generateRandomBytes(256)
        const encryptedPublicKey = await subtle.encrypt(
            { name: 'RSA-OAEP' },
            publicKey,
            keyBuf
        )
        let publicEncryption: any = Arweave.utils.concatBuffers([
            encryptedPublicKey,
            keyBuf,
        ])
        publicEncryption = Arweave.utils.bufferTob64Url(publicEncryption)
        return publicEncryption
    }

    public static async generateSsiKeys(arweave: any) {
        const privateKey = await arweave.wallets.generate()
        const keyData = {
            kty: privateKey.kty,
            e: privateKey.e,
            n: privateKey.n,
            alg: 'RSA-OAEP-256',
            ext: true,
        }
        const algo = { name: 'RSA-OAEP', hash: { name: 'SHA-256' } }
        const publicKey = await subtle.importKey(
            'jwk',
            keyData,
            algo,
            false,
            ['encrypt']
        )
        const keyBuf = await CryptoUtil.generateRandomBytes(256)
        const encryptedPublicKey = await subtle.encrypt(
            { name: 'RSA-OAEP' },
            publicKey,
            keyBuf
        )
        let publicEncryption: any = Arweave.utils.concatBuffers([
            encryptedPublicKey,
            keyBuf,
        ])
        publicEncryption = Arweave.utils.bufferTob64Url(publicEncryption)

        return {
            privateKey: privateKey,
            publicEncryption: publicEncryption,
        }
    }

    public static async encryptKey(arConnect: any, key: any) {
        let encryptedKey = await arConnect.encrypt(key, {
            algorithm: 'RSA-OAEP',
            hash: 'SHA-256',
        })
        encryptedKey = Arweave.utils.bufferTob64Url(encryptedKey)
        return encryptedKey
    }

    public static async decryptKey(arConnect: any, encryptedKey: any) {
        const encryptedArray = Arweave.utils.b64UrlToBuffer(encryptedKey)
        const decryptedKey = await arConnect.decrypt(encryptedArray, {
            algorithm: 'RSA-OAEP',
            hash: 'SHA-256',
        })
        return decryptedKey
    }

    public static async encryptData(data: any, publicEncryption: any) {
        const publicEnc = Arweave.utils.b64UrlToBuffer(publicEncryption)
        const encKey = new Uint8Array(publicEnc.slice(0, 512))
        const keyBuf = new Uint8Array(publicEnc.slice(512))

        const contentBuf = new TextEncoder().encode(JSON.stringify(data))

        const encryptedContent = await Arweave.crypto.encrypt(
            contentBuf,
            keyBuf
        )
        let encryptedData: any = Arweave.utils.concatBuffers([
            encKey,
            encryptedContent,
        ])
        encryptedData = Arweave.utils.bufferTob64Url(encryptedData)

        return encryptedData
    }

    public static async decryptData(data: any, decKey: any) {
        const encryptedArray = Arweave.utils.b64UrlToBuffer(data)
        let encryptedBuffer = encryptedArray.buffer
        const encKey = new Uint8Array(encryptedBuffer.slice(0, 512))
        const encryptedData = new Uint8Array(encryptedBuffer.slice(512))

        let key = Object.create(decKey)
        key.alg = 'RSA-OAEP-256'
        key.ext = true
        const algo = { name: 'RSA-OAEP', hash: { name: 'SHA-256' } }
        key = await subtle.importKey('jwk', key, algo, false, [
            'decrypt',
        ])
        const symmetricKey = await subtle.decrypt(
            { name: 'RSA-OAEP' },
            key,
            encKey
        )

        let decryptedData: any = await Arweave.crypto.decrypt(
            encryptedData,
            symmetricKey
        )
        decryptedData = Arweave.utils.bufferToString(decryptedData)
        return decryptedData
    }
}
