/*
    tyronzil-js: Tyron Self-Sovereign Identity Library
    Copyright (C) 2021 Tyron Pungtas Open Association

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
*/

import { NetworkNamespace } from '../did/tyronZIL-schemes/did-scheme';
import ZilliqaInit from './zilliqa-init';

export default class SsiState {
    public readonly owner: string;
    public readonly ssi: string;
    public readonly solana_addr: string;

    private constructor(
        state: any
    ) {
        this.owner = state.owner;
        this.ssi = state.ssi;
        this.solana_addr = state.solana_addr;
    }

    /** Fetches the current state from the blockchain 
     * @params addr: the user's Zilliqa
    */
    public static async fetch(network: NetworkNamespace, addr: string): Promise<SsiState> {
        const ZIL_INIT = new ZilliqaInit(network);
        const ssi_state = await ZIL_INIT.API.blockchain.getSmartContractState(addr)
        .then(async contract_state => {
            const STATE = {
                    owner: String(contract_state.result.owner),
                    ssi: String(contract_state.result.ssi),
                    solana_addr: String()
                };
            return new SsiState(STATE);
        })
        .catch((err: any) => { throw err });
        return ssi_state;
    }
}
