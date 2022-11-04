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

import { TyronZil } from '..'

export default class Beneficiary {
    public static async generate(
        version: number,
        addr?: string,
        username?: string,
        domain?: string
    ) {
        let res
        if (version < 6) {
            res = {
                constructor: TyronZil.BeneficiaryConstructor.Recipient,
                addr: addr,
            }
        } else {
            res = {
                constructor: TyronZil.BeneficiaryConstructor.NftUsername,
                username: username,
                domain: domain,
            }
        }
        return res
    }
}
