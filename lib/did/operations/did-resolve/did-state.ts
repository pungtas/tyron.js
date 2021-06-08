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

import { NetworkNamespace } from '../../tyronzil-schemes/did-scheme';
import DidUrlScheme from '../../tyronzil-schemes/did-url-scheme';
import { OperationType } from '../../protocols/sidetree';
import State from '../../../blockchain/state';

/** The Tyron DID-State */
export default class DidState {
	public readonly did: string;
    public readonly did_status: OperationType;
    public readonly admin: string;
	public readonly verification_methods: Map<string, string>;
	public readonly services: Map<string, [string, string]>;
	
	private constructor(
		state: DidStateModel
	) {
		this.did = state.did;
        this.did_status = state.did_status as OperationType;
        this.admin = state.admin;
		this.verification_methods = state.verification_methods;
		this.services = state.services;
	}

	/** Fetches the current DID State for the given address */
	public static async fetch(network: NetworkNamespace, addr: string): Promise<DidState> {
		const did_state = await State.fetch(network, addr)
		.then(async (state: { did: string; did_status: any; admin: any; verification_methods: any; services: any; }) => {
			// Validates the Tyron DID Scheme
			await DidUrlScheme.validate(state.did);
			
			const this_state: DidStateModel = {
				did: state.did,
				did_status: state.did_status,
				admin: state.admin,
				verification_methods: state.verification_methods,
				services: state.services,
				did_recovery_key: state.verification_methods.get("recovery"),
				did_update_key: state.verification_methods.get("update")
			};
			return new DidState(this_state);
		})
		.catch((err: any) => { throw err })
		return did_state;
	}
}

/** The state model of a Tyron Decentralized Identifier */
export interface DidStateModel {
	did: string;
	did_status: OperationType;
	admin: string;
	verification_methods: Map<string, string>;
	services: Map<string, [string, string]>;
	did_recovery_key: string;
	did_update_key: string;
}
