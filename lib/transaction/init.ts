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

import { HTTPProvider } from "@zilliqa-js/core";
import { Transaction } from "@zilliqa-js/account";
import { BN, Long } from "@zilliqa-js/util";
import { randomBytes, toChecksumAddress } from "@zilliqa-js/crypto";

export default class Init {
  public static async transaction(net: String) {
    const generateChecksumAddress = () => toChecksumAddress(randomBytes(20));
    let endpoint = "https://api.zilliqa.com/";
    if (net === "testnet") {
      endpoint = "https://dev-api.zilliqa.com/";
    }
    let tx = new Transaction(
      {
        version: 0,
        toAddr: generateChecksumAddress(),
        amount: new BN(0),
        gasPrice: new BN(1000),
        gasLimit: Long.fromNumber(1000),
      },
      new HTTPProvider(endpoint)
    );
    return tx;
  }
}
