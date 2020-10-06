/*
    TyronZIL-js: Decentralized identity client for the Zilliqa blockchain platform
    Copyright (C) 2020 Julio Cesar Cabrapan Duarte

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
*/

import ZilliqaInit from './zilliqa-init';
import { NetworkNamespace } from '../decentralized-identity/tyronZIL-schemes/did-scheme';

/** The class to initialize the `Tyron DID-Smart-Contract` */
export default class TyronContract extends ZilliqaInit {
    /** The Zilliqa address where the `TyronInit smart-contract` resides */
    public readonly tyron_init: TyronInitContracts;

    /** The user's Zilliqa address */
    public readonly contract_owner: string;

    /** The client's Zilliqa address that executes the tyronZIL transaction (ByStr20) */
    public readonly client_addr: string;

    /** The minimum amount that the client MUST stake (in Qa = 10^-12 ZIL) */
    public readonly tyron_stake: number;

    constructor(
        network: NetworkNamespace,
        init: ContractInit
    ) {
        super(network);
        this.tyron_init = init.tyron_init;
        this.contract_owner = init.contract_owner;
        this.client_addr = init.client_addr;
        this.tyron_stake = init.tyron_stake;
    }
}

/***            ** interfaces **            ***/

/** The Zilliqa addresses to initialize the `Tyron DID-Smart-Contract` */
export interface ContractInit {
    tyron_init: TyronInitContracts;
    contract_owner: string;
    client_addr: string;
    tyron_stake: number;
}

/** The `TyronInit smart-contracts` */
export enum TyronInitContracts {
    Testnet = "0x08392647c23115f1d027b9d2bbcc9f532b0f003a",
    Mainnet = "0x1c8272a79b5b4920bcae80f310d638c8dd4bd8aa"
}
