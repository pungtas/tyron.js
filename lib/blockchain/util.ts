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

import hash from 'hash.js'
import { TransitionParams, TransitionValue } from './tyronzil'
import * as zutil from '@zilliqa-js/util'

export default class Util {
    public static async HashDexOrder(elements: any[]) {
        let hash_
        for (const element of elements) {
            const h = hash.sha256().update(element).digest('hex')

            if (hash_ === undefined) {
                hash_ = h
            } else {
                hash_ = hash_ + h
            }
        }
        return hash_
    }

    public static async HashGuardians(elements: any[]) {
        let h_ = '0000000000000000000000000000000000000000'
        const hash_ = Array()
        for (const element of elements) {
            const h = hash.sha256().update(element).digest('hex')
            hash_.push('0x' + h)
            h_ = h_ + h
        }
        return [hash_, h_]
    }

    public static async AddLiquidity(
        signature: any,
        id: string,
        amount: string,
        tyron: TransitionValue
    ) {
        const params = Array()

        const sig: TransitionParams = {
            vname: 'signature',
            type: 'Option ByStr64',
            value: signature,
        }
        params.push(sig)

        const id_: TransitionParams = {
            vname: 'addrID',
            type: 'String',
            value: id,
        }
        params.push(id_)

        const amount_: TransitionParams = {
            vname: 'amount',
            type: 'Uint128',
            value: amount,
        }
        params.push(amount_)

        const tyron_: TransitionParams = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron,
        }
        params.push(tyron_)
        return params
    }

    public static async RemoveLiquidity(
        signature: any,
        id: string,
        amount: string,
        minZil: string,
        minToken: string,
        tyron: TransitionValue
    ) {
        const params = Array()

        const sig: TransitionParams = {
            vname: 'signature',
            type: 'Option ByStr64',
            value: signature,
        }
        params.push(sig)

        const id_: TransitionParams = {
            vname: 'addrID',
            type: 'String',
            value: id,
        }
        params.push(id_)

        const amount_: TransitionParams = {
            vname: 'amount',
            type: 'Uint128',
            value: amount,
        }
        params.push(amount_)

        const minzil: TransitionParams = {
            vname: 'minZilAmount',
            type: 'Uint128',
            value: minZil,
        }
        params.push(minzil)

        const mintoken: TransitionParams = {
            vname: 'minTokenAmount',
            type: 'Uint128',
            value: minToken,
        }
        params.push(mintoken)

        const tyron_: TransitionParams = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron,
        }
        params.push(tyron_)
        return params
    }

    public static async HashString(s: string) {
        const h = hash.sha256().update(s).digest('hex')
        return h
    }

    public static async HashAddress(addr: string) {
        const h = hash
            .sha256()
            .update(zutil.bytes.hexToByteArray(addr.substring(2)))
            .digest('hex')
        return h
    }
}
