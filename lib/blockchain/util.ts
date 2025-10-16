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
import * as zutil from '@zilliqa-js/util'
import * as zcrypto from '@zilliqa-js/crypto'

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
        const hash_ = []
        for (const element of elements) {
            const h = hash.sha256().update(element).digest('hex')
            hash_.push('0x' + h)
            h_ = h_ + h
        }
        return [hash_, h_]
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

    public static Zutil() {
        return zutil
    }

    public static Zcrypto() {
        return zcrypto
    }
}
