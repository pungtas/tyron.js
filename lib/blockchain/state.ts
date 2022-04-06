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

import { NetworkNamespace } from "../did/tyronzil-schemes/did-scheme";
import ZilliqaInit from "./zilliqa-init";
import SmartUtil from "./smart-util";
import { DIDStatus } from "../did/protocols/sidetree";
import ErrorCode from "../did/util/ErrorCode";

export default class State {
  public readonly did: string;
  public readonly controller: string;
  public readonly did_status: DIDStatus;
  public readonly verification_methods?: Map<string, string>;
  public readonly dkms?: Map<string, string>;
  public readonly services?: Map<string, string>;
  public readonly services_?: Map<string, [string, string]>;

  private constructor(state: StateModel) {
    this.did = state.did;
    this.controller = state.controller;
    this.did_status = state.did_status as DIDStatus;
    this.verification_methods = state.verification_methods;
    this.dkms = state.dkms;
    this.services = state.services;
    this.services_ = state.services_;
  }

  /** Fetches the current state from the blockchain
   * @params addr: the Zilliqa address of the user's smart-contract
   */
  public static async fetch(
    network: NetworkNamespace,
    addr: string
  ): Promise<State> {
    const ZIL_INIT = new ZilliqaInit(network);
    const state = await ZIL_INIT.API.blockchain
      .getSmartContractState(addr)
      .then(async (state_) => {
        const STATUS = await SmartUtil.getStatus(state_.result.did_status);
        switch (STATUS) {
          case DIDStatus.Deactivated:
            throw new ErrorCode(
              "DidDeactivated",
              "The requested DID is deactivated"
            );
          default:
            let dkms = undefined;
            if (state_.result.dkms !== undefined) {
              dkms = await SmartUtil.intoMap(state_.result.dkms);
            }
            const STATE: StateModel = {
              did: String(state_.result.did),
              controller: String(state_.result.controller),
              did_status: STATUS,
              verification_methods: await SmartUtil.intoMap(
                state_.result.verification_methods
              ),
              dkms: dkms,
              services: await SmartUtil.intoMap(state_.result.services),
              services_: await SmartUtil.fromServices(state_.result.services_),
            };
            return new State(STATE);
        }
      })
      .catch((err: any) => {
        throw err;
      });
    return state;
  }
}

/** The Tyron State Model */
export interface StateModel {
  did: string;
  controller: string;
  did_status: string;
  verification_methods?: Map<string, string>;
  dkms?: Map<string, string>;
  services?: Map<string, string>;
  services_?: Map<string, [string, string]>;
}
