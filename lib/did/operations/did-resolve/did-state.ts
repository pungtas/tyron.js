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

import State from '../../../blockchain/state';
import { NetworkNamespace } from '../../tyronzil-schemes/did-scheme';
import DidUrlScheme from '../../tyronzil-schemes/did-url-scheme';
import { OperationType } from '../../protocols/sidetree';

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
		.then(async tyron_state => {
			// Validates the Tyron DID Scheme
			await DidUrlScheme.validate(tyron_state.did);
			
			const this_state: DidStateModel = {
				did: tyron_state.did,
				did_status: tyron_state.did_status,
				admin: tyron_state.admin,
				verification_methods: tyron_state.verification_methods,
				services: tyron_state.services,
			};
			return new DidState(this_state);
		})
		.catch(err => { throw err })
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
}
