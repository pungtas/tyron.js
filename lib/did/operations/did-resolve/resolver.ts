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

import * as zcrypto from "@zilliqa-js/crypto";
import SmartUtil from "../../../blockchain/smart-util";
import ZilliqaInit from "../../../blockchain/zilliqa-init";
import { NetworkNamespace } from "../../tyronzil-schemes/did-scheme";

export default class Resolver {
  public static async resolveDns(
    network: NetworkNamespace,
    initTyron: string,
    username: string,
    domain: string
  ): Promise<string> {
    const zil_init = new ZilliqaInit(network);
    const addr = await zil_init.API.blockchain
      .getSmartContractState(initTyron)
      .then(async (state) => {
        const dns = state.result.dns;
        return await SmartUtil.getValuefromMap(dns, username);
      })
      .then(async (addr) => {
        if (domain === "did") {
          return addr;
        } else {
          const nft_dns = (
            await zil_init.API.blockchain.getSmartContractState(addr)
          ).result.dns;
          return await SmartUtil.getValuefromMap(nft_dns, domain);
        }
      })
      .catch((err: any) => {
        throw err;
      });
    return zcrypto.toChecksumAddress(addr);
  }
}
