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

import { OperationType } from '../protocols/sidetree';
import { Cryptography, OperationKeyPairInput, TyronPrivateKeys } from '../util/did-keys';
import { TransitionValue } from '../../blockchain/tyronzil';
import { PrivateKeyModel, PublicKeyInput } from '../protocols/models/verification-method-models';
import { NetworkNamespace } from '../tyronzil-schemes/did-scheme';

/** Generates a `Tyron DID-Create` operation
 *  which produces the `DID-Document` & metadata */
export default class DidCreate {
	public readonly type = OperationType.Create;
	public readonly document: TransitionValue[];
	public readonly updateKey: string;
	public readonly recoveryKey: string;
	public readonly privateKeys: TyronPrivateKeys;

	private constructor (
		operation: CreateOperationModel
	) {
		this.document = operation.document;
		this.updateKey = "0x"+ operation.updateKey;
		this.recoveryKey = "0x"+ operation.recoveryKey;
		this.privateKeys = operation.privateKeys;
	}

	/** Generates a Tyron `DID-Create` operation with input from the CLI */
	public static async execute(input: InputModel): Promise<DidCreate> {
		const verification_methods: TransitionValue[] = [];
		const private_key_model: PrivateKeyModel[] = [];

		for(const key_input of input.publicKeyInput) {
			// Creates the cryptographic key pair
			const key_pair_input: OperationKeyPairInput = {
				id: key_input.id
			}
			const [verification_method, private_key] = await Cryptography.operationKeyPair(key_pair_input);
			verification_methods.push(verification_method);
			private_key_model.push(private_key);
		}

		const document = verification_methods.concat(input.services);
			
		// Creates the update key-pair (necessary for the next update operation)
		const [update_key, update_private_key] = await Cryptography.keyPair("update");
		private_key_model.push(update_private_key);

		// Creates the recovery key-pair (necessary for next recovery or deactivate operation)
		const [recovery_key, recovery_private_key] = await Cryptography.keyPair("recovery");
		private_key_model.push(recovery_private_key);

		const private_keys = await Cryptography.processKeys(private_key_model);
		
		/** Output data from a Tyron `DID-Create` operation */
		const operation_output: CreateOperationModel = {
			document: document,
			updateKey: update_key,
			recoveryKey: recovery_key,
			privateKeys: private_keys
		};
		return new DidCreate(operation_output);
	}
}

/** Defines output data for a Sidetree-based `DID-Create` operation */
interface CreateOperationModel {
	document: TransitionValue[];
	updateKey: string;
	recoveryKey: string;
	privateKeys: TyronPrivateKeys;
}

export interface InputModel {
	network: NetworkNamespace;
	publicKeyInput: PublicKeyInput[];
	services: TransitionValue[];
	userPrivateKey?: string;
}
