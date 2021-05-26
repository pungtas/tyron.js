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
import TyronZIL, { TransitionValue } from '../../blockchain/tyronzil';
import { Action, DocumentElement } from '../protocols/models/document-model';
import { PrivateKeyModel, PublicKeyModel, PublicKeyPurpose } from '../protocols/models/verification-method-models';
import ErrorCode from './ErrorCode';

/** Defines input data to generate a cryptographic key pair */
export interface OperationKeyPairInput {
	id: string        //the key purpose      
}

/** Generates cryptographic operations */
export class Cryptography {
  	/** Asymmetric cryptography to generate the key pair using the KEY_ALGORITHM (secp256k1)
    * @returns [publicKey, privateKey] */
  	public static async operationKeyPair(input: OperationKeyPairInput): Promise<[TransitionValue, PrivateKeyModel]> {
		const private_key = zcrypto.schnorr.generatePrivateKey();
		const public_key = "0x"+ zcrypto.getPubKeyFromPrivateKey(private_key);
		const verification_method: PublicKeyModel = {
			id: input.id,
			key: public_key
		};
		const doc_element = await TyronZIL.documentElement(
			DocumentElement.VerificationMethod,
			Action.Adding,
			verification_method
		);
		const private_key_model: PrivateKeyModel = {
			id: input.id,
			key: private_key
		};

		return [doc_element, private_key_model];
	}

	/** Generates a secp256k1 key pair
	 * @returns [publicKey, privateKey] */
	public static async keyPair(id: string): Promise< [string, PrivateKeyModel] > {
		const private_key = zcrypto.schnorr.generatePrivateKey();
		const public_key = zcrypto.getPubKeyFromPrivateKey(private_key);
		const private_key_model = {
			id: id,
			key: private_key
		}
		return [public_key, private_key_model];
	}

	public static async processKeys( input: PublicKeyModel[]|PrivateKeyModel[] ): Promise< TyronPublicKeys|TyronPrivateKeys > {
		const key_id_set: Set<string> = new Set();
		let keys = {};
		let new_key;
		for(const key of input) {
			// IDs must be unique
			if( !key_id_set.has(key.id) ) {
			key_id_set.add(key.id);
			} else {
			throw new ErrorCode("KeyDuplicated", "The key ID must be unique");
			}
			switch (key.id) {
				case PublicKeyPurpose.General:
					new_key = {
					general: "0x"+ key.key
					};
					Object.assign(keys, new_key)             
					break;
				case PublicKeyPurpose.Auth:
					new_key = {
					authentication: "0x"+ key.key
					};
					Object.assign(keys, new_key)  
					break;
				case PublicKeyPurpose.Assertion:
					new_key = {
					assertion: "0x"+ key.key
					};
					Object.assign(keys, new_key);                
					break;
				case PublicKeyPurpose.Agreement:
					new_key = {
					agreement: "0x"+ key.key
					};
					Object.assign(keys, new_key);
					break;
				case PublicKeyPurpose.Invocation:
					new_key = {
					invocation: "0x"+ key.key
					};
					Object.assign(keys, new_key);
					break;
				case PublicKeyPurpose.Delegation:
					new_key = {
					delegation: "0x"+ key.key
					};
					Object.assign(keys, new_key);
					break;
				case PublicKeyPurpose.XSGD:
					new_key = {
					xsgd: "0x"+ key.key
					};
					Object.assign(keys, new_key);
					break;
				case "update":
					new_key = {
					did_update: key.key
					};
					Object.assign(keys, new_key);
					break;  
				case "recovery":
					new_key = {
					did_recovery: key.key
					};
					Object.assign(keys, new_key);
					break;               
				default:
					throw new ErrorCode("InvalidID", `The client detected an invalid key ID`);
			}
		}
		return keys;      
	}
}

export interface TyronPublicKeys {
	general?: string;
	authentication?: string;
	assertion?: string;
	agreement?: string;
	invocation?: string;
	delegation?: string;
	xsgd?: string;
}

export interface TyronPrivateKeys extends TyronPublicKeys {
	did_update?: string;
	did_recovery?: string;
}
