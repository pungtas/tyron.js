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

import * as zcrypto from '@zilliqa-js/crypto';
import { OperationType } from '../protocols/sidetree';
import DidState from './did-resolve/did-state';

/** Generates a `Tyron DID-Deactivate` operation */
export default class DidDeactivate {
	public readonly type = OperationType.Deactivate;
	public readonly did: string;
	public readonly signature: string;

	private constructor (
		operation: DeactivateOperationModel
	) {
	   this.did = operation.did;
		this.signature = "0x"+ operation.signature;
	}

	/** Generates a Sidetree-based `DID-Deactivate` operation */
	public static async execute(input: DeactivateOperationInput): Promise<DidDeactivate> {
		const previous_recovery_key = zcrypto.getPubKeyFromPrivateKey(input.recoveryPrivateKey);

		const signature = zcrypto.sign(Buffer.from(input.state.did), input.recoveryPrivateKey, previous_recovery_key);
		
		/** Output data from a Tyron `DID-Deactivate` operation */
		const operation_output: DeactivateOperationModel = {
			did: input.state.did,
			signature: signature 
		};
		return new DidDeactivate(operation_output);
	}
}

/** Defines input data for a `Tyron DID-Deactivate` operation */
export interface DeactivateOperationInput {
	state: DidState;
	recoveryPrivateKey: string;
}

/** Defines output data from a `Tyron DID-Deactivate` operation */
interface DeactivateOperationModel {
	did: string;
	signature: string;
}
