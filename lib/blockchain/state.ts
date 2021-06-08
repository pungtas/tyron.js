/*
    tyron.js: SSI Protocol's JavaScript/TypeScipt library
    Self-Sovereign Identity Protocol.
    Copyright (C) Tyron Pungtas and its affiliates.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
*/

import { NetworkNamespace } from '../did/tyronzil-schemes/did-scheme';
import ZilliqaInit from './zilliqa-init';
import SmartUtil from './smart-util';
import { OperationType } from '../did/protocols/sidetree';
import ErrorCode from '../did/util/ErrorCode';

export default class TyronState {
    public readonly did: string;
    public readonly did_status: OperationType;
    public readonly admin: string;
    public readonly verification_methods: Map<string, string>;
    public readonly services: Map<string, [string, string]>;

    private constructor(
        state: TyronStateModel
    ) {
        this.did = state.did;
        this.did_status = state.did_status as OperationType;
        this.admin = state.admin;
        this.verification_methods = state.verification_methods;
        this.services = state.services;
    }

    /** Fetches the current state from the blockchain 
     * @params addr: the Zilliqa address of the user's smart-contract
    */
    public static async fetch(network: NetworkNamespace, addr: string): Promise<TyronState> {
        const ZIL_INIT = new ZilliqaInit(network);
        const tyron_state = await ZIL_INIT.API.blockchain.getSmartContractState(addr)
        .then(async didc_state => {
            const STATUS = await SmartUtil.getStatus(didc_state.result.did_status);
            switch (STATUS) {
                case OperationType.Deactivate:
                    throw new ErrorCode("DidDeactivated", "The requested DID is deactivated");
                default:
                    const STATE: TyronStateModel = {
                        admin: String(didc_state.result.admin),
                        did: String(didc_state.result.did),
                        did_status: STATUS,
                        verification_methods: await SmartUtil.intoMap(didc_state.result.verification_methods),
                        services: await SmartUtil.fromServices(didc_state.result.services)
                    };
                    return new TyronState(STATE);
            }
        })
        .catch((err: any) => { throw err });
        return tyron_state;
    }
}

/** The Tyron State Model */
export interface TyronStateModel {
    did: string;
    did_status: string;
    admin: string;
    verification_methods: Map<string, string>;
    services: Map<string, [string, string]>;
}
