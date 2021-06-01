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

import { Cryptography, OperationKeyPairInput, TyronPrivateKeys } from '../util/did-keys';
import * as tyronzil from '../../blockchain/tyronzil';
import { PrivateKeyModel, PublicKeyInput } from '../protocols/models/verification-method-models';
import * as zcrypto from '@zilliqa-js/crypto';
import { Sidetree } from '../protocols/sidetree';
import { PatchModel } from '../protocols/models/document-model';
import DidState from './did-resolve/did-state';

/** Generates a `DID Create` operation
 *  which produces the `DID Document` & metadata */
export default class DidCrud {
	public readonly txParams: tyronzil.TransitionParams[];
	public readonly privateKeys?: TyronPrivateKeys;

	private constructor (
		operation: CrudOperationModel
	) {
		this.txParams = operation.txParams;
		this.privateKeys = operation.privateKeys;
	}

	public static async create(input: InputModel): Promise<DidCrud> {
		const verification_methods: tyronzil.TransitionValue[] = [];
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
		
		const tx_params = await tyronzil.default.CrudParams(
			tyronzil.default.OptionParam(tyronzil.Option.some, "String", input.username),
			tyronzil.default.OptionParam(tyronzil.Option.some, "List Document", document),
			tyronzil.default.OptionParam(tyronzil.Option.some, "ByStr33", "0x"+recovery_key),
			tyronzil.default.OptionParam(tyronzil.Option.some, "ByStr33", "0x"+update_key),
			tyronzil.default.OptionParam(tyronzil.Option.none, "ByStr64"),
		);

		const operation_output: CrudOperationModel = {
			txParams: tx_params,
			privateKeys: private_keys
		};
		return new DidCrud(operation_output);
	}

	public static async recover(input: InputModel): Promise<DidCrud> {
		const verification_methods: tyronzil.TransitionValue[] = [];
		const private_key_model: PrivateKeyModel[] = [];

		const public_key_input = input.publicKeyInput;
		for(const key_input of public_key_input) {
			// Creates the cryptographic key pair
			const key_pair_input: OperationKeyPairInput = {
				id: key_input.id
			}
			const [verification_method, private_key] = await Cryptography.operationKeyPair(key_pair_input);
			verification_methods.push(verification_method);
			private_key_model.push(private_key);
		}
		
		const document = verification_methods.concat(input.services);
		const doc_object = Object.assign({}, document);
		const doc_buffer = Buffer.from(JSON.stringify(doc_object));
		const doc_hash = require("crypto").createHash("sha256").update(doc_buffer).digest('hex');
		
		const previous_recovery_key = zcrypto.getPubKeyFromPrivateKey(input.recoveryPrivateKey!);
		const signature = zcrypto.sign(Buffer.from(doc_hash, 'hex'), input.recoveryPrivateKey!, previous_recovery_key);
		
		/** Key-pair for the next DID Update operation */
		const [update_key, update_private_key] = await Cryptography.keyPair("update");
		private_key_model.push(update_private_key);

		/** Key-pair for the next DID Recover or Deactivate operation */
		const [recovery_key, recovery_private_key] = await Cryptography.keyPair("recovery");
		private_key_model.push(recovery_private_key);

		const private_keys = await Cryptography.processKeys(private_key_model);
		
		const tx_params = await tyronzil.default.CrudParams(
			tyronzil.default.OptionParam(tyronzil.Option.none, "String"),
			tyronzil.default.OptionParam(tyronzil.Option.some, "List Document", document),
			tyronzil.default.OptionParam(tyronzil.Option.some, "ByStr33", "0x"+recovery_key),
			tyronzil.default.OptionParam(tyronzil.Option.some, "ByStr33", "0x"+update_key),
			tyronzil.default.OptionParam(tyronzil.Option.none, "ByStr64", "0x"+signature),
		);

		const operation_output: CrudOperationModel = {
			txParams: tx_params,
			privateKeys: private_keys
		};
		return new DidCrud(operation_output);
	}

	public static async update(input: UpdateInputModel): Promise<DidCrud> {
		const operation = await Sidetree.processPatches( input.patches )
		.then( async update => {
			const doc_object = Object.assign({}, update.updateDocument);
			const doc_buffer = Buffer.from(JSON.stringify(doc_object));
			const doc_hash = require("crypto").createHash("sha256").update(doc_buffer).digest('hex');

			const previous_update_key = zcrypto.getPubKeyFromPrivateKey(input.updatePrivateKey);
			const signature = zcrypto.sign(Buffer.from(doc_hash, 'hex'), input.updatePrivateKey, previous_update_key);
			
			// Generates key-pair for the next DID Update operation
			const [new_update_key, new_update_private_key] = await Cryptography.keyPair("update");
			update.privateKeys.push(new_update_private_key);

			const private_keys = await Cryptography.processKeys(update.privateKeys);

			const tx_params = await tyronzil.default.CrudParams(
				tyronzil.default.OptionParam(tyronzil.Option.none, "String"),
				tyronzil.default.OptionParam(tyronzil.Option.some, "List Document", document),
				tyronzil.default.OptionParam(tyronzil.Option.none, "ByStr33"),
				tyronzil.default.OptionParam(tyronzil.Option.some, "ByStr33", "0x"+new_update_key),
				tyronzil.default.OptionParam(tyronzil.Option.none, "ByStr64", "0x"+signature),
			);

			const operation_output: CrudOperationModel = {
				txParams: tx_params,
				privateKeys: private_keys
			};
			return new DidCrud(operation_output);
		})
		.catch(err => { throw err })
		return operation;
	}

	public static async deactivate(input: DeactivateInputModel): Promise<DidCrud> {
		const previous_recovery_key = zcrypto.getPubKeyFromPrivateKey(input.recoveryPrivateKey);

		const signature = zcrypto.sign(Buffer.from(input.state.did), input.recoveryPrivateKey, previous_recovery_key);
		
		const tx_params = await tyronzil.default.CrudParams(
			tyronzil.default.OptionParam(tyronzil.Option.none, "String"),
			tyronzil.default.OptionParam(tyronzil.Option.some, "List Document", document),
			tyronzil.default.OptionParam(tyronzil.Option.none, "ByStr33"),
			tyronzil.default.OptionParam(tyronzil.Option.none, "ByStr33"),
			tyronzil.default.OptionParam(tyronzil.Option.none, "ByStr64", "0x"+signature),
		);

		const operation_output: CrudOperationModel = {
			txParams: tx_params
		};
		return new DidCrud(operation_output);
	}
}

/** Defines output data for a DID CRUD operation */
interface CrudOperationModel {
	txParams: tyronzil.TransitionParams[];
	privateKeys?: TyronPrivateKeys;
}

// @TODO verify username
export interface InputModel {
	username: string;
	publicKeyInput: PublicKeyInput[];
	services: tyronzil.TransitionValue[];
	recoveryPrivateKey?: string;
}

/** Defines input data for a `DID Update` operation */
export interface UpdateInputModel {
	state: DidState;
	updatePrivateKey: string;
	patches: PatchModel[];
}

/** Defines input data for a `DID Deactivate` operation */
export interface DeactivateInputModel {
	state: DidState;
	recoveryPrivateKey: string;
}
