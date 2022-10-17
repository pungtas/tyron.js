/*
tyron.js: SSI Protocol's JavaScript/TypeScript library
Self-Sovereign Identity Protocol
Copyright (C) Tyron Mapu Community Interest Company and its affiliates.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.*/

/** Tools to manage smart contracts */
import Resolver from '../did/operations/did-resolve/resolver'
import { NetworkNamespace } from '../did/tyronzil-schemes/did-scheme'
import State from './state'
import ZilliqaInit from './zilliqa-init'

export default class SearchBarUtil {
    public static async fetchAddr(
        net: string,
        _username: string,
        _domain: string
    ): Promise<string> {
        let network = NetworkNamespace.Mainnet
        let init_tyron = '0xdfc81a41a7a1ce6ed99e27f9aa1ede4f6d97c7d0' //@todo-x
        if (net === 'testnet') {
            network = NetworkNamespace.Testnet
            init_tyron = '0x26193045954FFdf23859c679c29ad164932ADdA1'
        }
        const addr = await Resolver.resolveDns(
            network,
            init_tyron.toLowerCase(),
            _username,
            _domain
        ).catch((err: any) => {
            throw err
        })
        return addr
    }

    public static async Resolve(net: string, addr: string): Promise<object> {
        let network = NetworkNamespace.Mainnet
        if (net === 'testnet') {
            network = NetworkNamespace.Testnet
        }
        const did_doc: any[] = []
        const state = await State.fetch(network, addr)

        let did: string
        if (state.did == '') {
            did = 'Not activated yet'
        } else {
            did = state.did
        }
        did_doc.push(['Decentralized identifier', did])

        const controller = state.controller

        if (state.services_ && state.services_?.size !== 0) {
            const services = Array()
            for (const id of state.services_.keys()) {
                const result: any = state.services_.get(id)
                if (result && result[1] !== undefined) {
                    services.push([id, result])
                } else if (result && result[1] === undefined) {
                    let val: {
                        argtypes: any
                        arguments: any[]
                        constructor: any
                    }
                    val = result[0]
                    services.push([id, val.arguments[0]])
                }
            }
            did_doc.push(['DID services', services])
        }

        if (state.verification_methods) {
            const arrKey = Array.from(state.verification_methods.keys())
            const arrVal = Array.from(state.verification_methods.values())
            for (let i = 0; i < arrKey.length; i += 1) {
                did_doc.push([arrKey[i], [arrVal[i]]])
            }
        }

        const init = new ZilliqaInit(network)

        let guardians: any[] = []
        try {
            const social_recovery =
                await init.API.blockchain.getSmartContractSubState(
                    addr,
                    'social_guardians'
                )
            guardians = await this.resolveSubState(
                social_recovery.result.social_guardians
            )
        } catch (error) {
            throw error
        }

        let version: any = '0'
        await init.API.blockchain
            .getSmartContractSubState(addr, 'version')
            .then((substate) => {
                if (substate.result !== null) {
                    version = substate.result.version as string
                    if (
                        version.slice(0, 10) === 'DIDxWALLET' ||
                        Number(version.slice(8, 9)) >= 4 ||
                        version.slice(0, 4) === 'init' ||
                        version.slice(0, 3) === 'dao'
                    ) {
                        console.log(`DID Document version: ${version}`)
                        console.log(`Address: ${addr}`)
                    } else {
                        throw new Error('Upgrade required: deploy a new SSI.')
                    }
                } else {
                    throw new Error('Upgrade required: deploy a new SSI.')
                }
            })
            .catch((error) => {
                throw error
            })

        return {
            did: did,
            version: version,
            status: state.did_status,
            controller: controller,
            doc: did_doc,
            dkms: state.dkms,
            guardians: guardians,
        }
    }

    public static async resolveSubState(object: any): Promise<any[]> {
        const entries = Object.entries(object)
        const result: any[] = []
        entries.forEach((value: [string, unknown]) => {
            result.push(value[0])
        })
        return result
    }

    public static isValidUsername = (username: string) =>
        (/^[\w\d_]+$/.test(username) && username.length > 5) ||
        username === 'init' ||
        username === 'tyron' ||
        username === 'wfp'

    public static isAdminUsername = (username: string) =>
        username === 'init' || username === 'tyron' || username === 'wfp'
}
