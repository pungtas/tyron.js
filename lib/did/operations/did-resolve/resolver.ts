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

import * as zcrypto from '@zilliqa-js/crypto'
import SmartUtil from '../../../blockchain/smart-util'
import ZilliqaInit from '../../../blockchain/zilliqa-init'
import { NetworkNamespace } from '../../tyronzil-schemes/did-scheme'

export default class Resolver {
    public static async resolveDns(
        network: NetworkNamespace,
        tld: string, // top-level domain, the domain extension
        DNS_address: string,
        domain_hash: string,
        subdomain?: string
    ): Promise<string> {
        const zil_init = new ZilliqaInit(network)
        let dns
        const addr = await zil_init.API.blockchain
            .getSmartContractState(DNS_address)
            .then(async (state) => {
                switch (tld) {
                    case 'zlp':
                        dns = state.result.nft_dns
                        return await SmartUtil.getValuefromMap(dns, domain_hash)
                    case '' || 'ssi':
                        dns = state.result.dns
                        return await SmartUtil.getValuefromMap(dns, domain_hash)
                    default: // .did and subdomains
                        dns = state.result.did_dns
                        const did_addr = await SmartUtil.getValuefromMap(
                            dns,
                            domain_hash
                        )
                        if (subdomain) {
                            const subdomains_dns = (
                                await zil_init.API.blockchain.getSmartContractState(
                                    did_addr
                                )
                            ).result.did_domain_dns
                            return await SmartUtil.getValuefromMap(
                                subdomains_dns,
                                subdomain
                            )
                        } else {
                            return did_addr
                        }
                }
            })
            .catch((err: any) => {
                throw new Error(`Resolve DNS: ${err}`)
            })
        return zcrypto.toChecksumAddress(addr)
    }
}
