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

import { TransitionParams, TransitionValue } from './tyronzil'

export default class Defi {
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
}
