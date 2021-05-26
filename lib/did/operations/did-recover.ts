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
import { Cryptography, OperationKeyPairInput, TyronPrivateKeys } from '../util/did-keys';
import { TransitionValue } from '../../blockchain/tyronzil';
import { PrivateKeyModel } from '../protocols/models/verification-method-models';
import { InputModel } from './did-create';

/** Generates a `Tyron DID-Recover` operation */
export default class DidRecover {
	public readonly type = OperationType.Recover;
	public readonly did: string;
	public readonly newDocument: TransitionValue[];
	public readonly docHash: string;
	public readonly signature: string;
	public readonly newUpdateKey: string;
	public readonly newRecoveryKey: string;
	public readonly privateKeys: TyronPrivateKeys;

	private constructor (
		operation: RecoverOperationModel
	) {
		this.did = operation.did;
		this.newDocument = operation.newDocument;
		this.docHash = "0x"+ operation.docHash;
		this.signature = "0x"+ operation.signature;
		this.newUpdateKey = "0x"+ operation.newUpdateKey;
		this.newRecoveryKey = "0x"+ operation.newRecoveryKey;
		this.privateKeys = operation.privateKeys;
	}

	/** Generates a `Tyron DID-Recover` operation */
	public static async execute(recover: RecoverOperationInput): Promise<DidRecover> {
		const verification_methods: TransitionValue[] = [];
		const private_key_model: PrivateKeyModel[] = [];

		const PUBLIC_KEY_INPUT = recover.input.publicKeyInput;
		for(const key_input of PUBLIC_KEY_INPUT) {
			// Creates the cryptographic key pair
			const KEY_PAIR_INPUT: OperationKeyPairInput = {
				id: key_input.id
			}
			const [VERIFICATION_METHOD, PRIVATE_KEY] = await Cryptography.operationKeyPair(KEY_PAIR_INPUT);
			verification_methods.push(VERIFICATION_METHOD);
			private_key_model.push(PRIVATE_KEY);
		}
		
		const document = verification_methods.concat(recover.input.services);
		const doc_object = Object.assign({}, document);
		const doc_buffer = Buffer.from(JSON.stringify(doc_object));
		const doc_hash = require("crypto").createHash("sha256").update(doc_buffer).digest('hex');
		
		const previous_recovery_key = zcrypto.getPubKeyFromPrivateKey(recover.recoveryPrivateKey);
		const signature = zcrypto.sign(Buffer.from(doc_hash, 'hex'), recover.recoveryPrivateKey!, previous_recovery_key);
		
		/** Key-pair for the next DID-Upate operation */
		const [update_key, update_private_key] = await Cryptography.keyPair("update");
		private_key_model.push(update_private_key);

		/** Key-pair for the next DID-Recover or Deactivate operation */
		const [recovery_key, recovery_private_key] = await Cryptography.keyPair("recovery");
		private_key_model.push(recovery_private_key);

		const private_keys = await Cryptography.processKeys(private_key_model);
		
		/** Output data from a Tyron `DID-Recover` operation */
		const operation_output: RecoverOperationModel = {
			did: recover.did,
			newDocument: document,
			docHash: doc_hash,
			signature: signature,
			newUpdateKey: update_key,
			newRecoveryKey: recovery_key,
			privateKeys: private_keys 
		};
		return new DidRecover(operation_output);
	}
}

/** Defines input data for a `Tyron DID-Recover` operation */
export interface RecoverOperationInput {
	did: string;
	recoveryPrivateKey: string;
	input: InputModel;
}

/** Defines output data from a `Tyron DID-Recover` operation */
interface RecoverOperationModel {
	did: string;
	newDocument: TransitionValue[];
	docHash: string;
	signature: string;
	newUpdateKey: string;
	newRecoveryKey: string;
	privateKeys: TyronPrivateKeys;
}
