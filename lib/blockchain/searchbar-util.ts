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
import Util from './util'
import ZilliqaInit from './zilliqa-init'

export default class SearchBarUtil {
    public static async fetchAddr(
        net: string,
        tld: string,
        domain: string,
        subdomain?: string
    ): Promise<string> {
        let domain_hash = '0x' + (await Util.HashString(domain))
        let network
        let DNS_address
        switch (net) {
            case 'testnet':
                network = NetworkNamespace.Testnet
                switch (tld) {
                    case 'zlp':
                        DNS_address =
                            '0xbf6792015d6b2f8ba9dfbd59b4fe690b61663e28'
                        break
                    default:
                        DNS_address =
                            '0xb36fbf7ec4f2ede66343f7e64914846024560595'
                        break
                }
                break
            default:
                network = NetworkNamespace.Mainnet
                switch (tld) {
                    case 'zlp':
                        DNS_address =
                            '0xb36fbf7ec4f2ede66343f7e64914846024560595' //@todo update
                        break
                    default:
                        DNS_address =
                            '0xdfe5e46db3c01fd9a4a012c999d581f69fcacc61'
                        break
                }
                break
        }
        const addr = await Resolver.resolveDns(
            network,
            tld,
            DNS_address.toLowerCase(),
            domain_hash,
            subdomain
        ).catch((err: any) => {
            throw new Error(`Fetch DNS address: ${err}`)
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
        (/^[\u3000\u3400-\u4DBF\u4E00-\u9FFF\w\d_]+$/.test(username) &&
            username.length > 4) ||
        username === 'init' ||
        username === 'tyron' ||
        username === 'wfp'

    public static isAdminUsername = (username: string) =>
        username === 'init' || username === 'tyron' || username === 'wfp'
}
