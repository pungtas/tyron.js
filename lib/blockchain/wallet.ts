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

import Arweave from "arweave"
import * as zcrypto from "@zilliqa-js/zilliqa"

export default class Wallet {
    public static async generateArweave() {
        const arweave = Arweave.init({
            host: "arweave.net",
            port: 443,
            protocol: "https"
        });
        arweave.wallets.generate().then((key: any) => {
            return key
        });
    }
    public static async generateZilliqa() {
        const private_key = zcrypto.schnorr.generatePrivateKey()
        return private_key
    }
}
