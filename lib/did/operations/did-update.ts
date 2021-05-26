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
import { OperationType, Sidetree } from '../protocols/sidetree';
import { Cryptography, TyronPrivateKeys } from '../util/did-keys';
import { PatchModel } from '../protocols/models/document-model';
import DidState from './did-resolve/did-state';
import { TransitionValue } from '../../blockchain/tyronzil';

/** Generates a `Tyron DID Update` operation */
export default class DidUpdate{
	public readonly type = OperationType.Update;
	public readonly did: string;
	public readonly newDocument: TransitionValue[];
	public readonly docHash: string;
	public readonly signature: string;
	public readonly newUpdateKey: string;
	public readonly privateKeys: TyronPrivateKeys;
	
	private constructor (
		operation: UpdateOperationModel
	) {
		this.did = operation.did;
		this.newDocument = operation.newDocument;
		this.docHash = "0x"+ operation.docHash;
		this.signature = "0x"+ operation.signature;
		this.newUpdateKey = "0x"+ operation.newUpdateKey;
		this.privateKeys = operation.privateKeys;
	}

	/** Generates a `Tyron DID Update` operation with input from the CLI */
	public static async execute( input: UpdateOperationInput ): Promise< DidUpdate > {
		const operation = await Sidetree.processPatches( input.patches )
		.then( async update => {
			const doc_object = Object.assign({}, update.updateDocument);
			const doc_buffer = Buffer.from(JSON.stringify(doc_object));
			const doc_hash = require("crypto").createHash("sha256").update(doc_buffer).digest('hex');

			const previous_update_key = zcrypto.getPubKeyFromPrivateKey(input.updatePrivateKey);
			const signature = zcrypto.sign(Buffer.from(doc_hash, 'hex'), input.updatePrivateKey, previous_update_key);
			
			// Generates key-pair for the next DID-Update operation
			const [new_update_key, new_update_private_key] = await Cryptography.keyPair("update");
			update.privateKeys.push(new_update_private_key);

			const private_keys = await Cryptography.processKeys(update.privateKeys);

			/** Output data from a Tyron `DID-Update` operation */
			const operation_output: UpdateOperationModel = {
				did: input.state.did,
				newDocument: update.updateDocument,
				docHash: doc_hash,
				signature: signature,
				newUpdateKey: new_update_key,
				privateKeys: private_keys
			};
			return new DidUpdate(operation_output);
		})
		.catch(err => { throw err })
		return operation;
	}
}

/** Defines input data for a `Tyron DID-Update` operation */
export interface UpdateOperationInput {
	state: DidState;
	updatePrivateKey: string;
	patches: PatchModel[];
}

/** Defines output data from a `Tyron DID-Update` operation */
interface UpdateOperationModel {
	did: string;
	newDocument: TransitionValue[];
	docHash: string;
	signature: string;
	newUpdateKey: string;
	privateKeys: TyronPrivateKeys;
}
