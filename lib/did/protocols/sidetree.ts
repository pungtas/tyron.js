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
GNU General Public License for more details.*/

import { PatchModel, PatchAction, Action, DocumentElement, ServiceModel, DocumentConstructor } from './models/document-model';
import { PrivateKeyModel, PublicKeyInput, PublicKeyModel, PublicKeyPurpose } from './models/verification-method-models';
import { Cryptography, OperationKeyPairInput } from '../util/did-keys';
import ErrorCode from '../util/ErrorCode';
import TyronZIL, { TransitionValue } from '../../blockchain/tyronzil';
import tyronzil from '../../blockchain/tyronzil';

/** Operation types */
export enum OperationType {
	Create = 'Created',
	Recover = 'Recovered',
	Update = 'Updated',
	Deactivate = 'Deactivated',
	Lock = 'Locked'
}

export class Sidetree {
	public static async processPatches(addr: string, patches: PatchModel[])
	: Promise<{documentElements: DocumentElement[], updateDocument: TransitionValue[], privateKeys: PrivateKeyModel[]}>{
		let doc_elements: DocumentElement[] = [];
		let update_document = [];
		let private_keys: PrivateKeyModel[] = [];
	
		// Generate new DID Update key pair:
		const key_pair_input: OperationKeyPairInput = { id: PublicKeyPurpose.Update, addr: addr };
		const [doc_element, verification_method, private_key] = await Cryptography.operationKeyPair(key_pair_input);
		doc_elements.push(doc_element);
		update_document.push(verification_method);
		private_keys.push(private_key);
		
		for(const patch of patches){
			switch (patch.action) {
				case PatchAction.AddKeys: 
					if(patch.keyInput !== undefined){
						await this.addKeys(addr, patch.keyInput)
						.then(async new_keys => {
							for(const doc_element of new_keys.docElements){
								doc_elements.push(doc_element);
							}
							for(const did_method of new_keys.verificationMethods){
								update_document.push(did_method);
							}
							for(const key of new_keys.privateKeys){
								private_keys.push(key)
							}
						})
						.catch(err => { throw err })
					} else {
						throw new ErrorCode('Missing', 'No key in AddKeys patch')
					}
					break;
				case PatchAction.RemoveKeys:
					if( patch.ids !== undefined ) {
						for( const id of patch.ids ) {
							const key_: PublicKeyModel = {
								id: id
							};
							const doc_element: DocumentElement = {
								constructor: DocumentConstructor.VerificationMethod,
								action: Action.Remove,
								key: key_
							};
							doc_elements.push(doc_element);
							const doc_parameter = await TyronZIL.documentParameter(addr, doc_element);
							update_document.push(doc_parameter);
						}
					}
					break;
				case PatchAction.AddServices: 
					if(patch.services !== undefined){
						for(const service of patch.services){
							const doc_element: DocumentElement = {
								constructor: DocumentConstructor.Service,
								action: Action.Add,
								service: service
							};
							doc_elements.push(doc_element);
							const doc_parameter = await tyronzil.documentParameter(addr, doc_element);
							update_document.push(doc_parameter);
						}
					} else {
						throw new ErrorCode('Missing', 'No services given to add')
					}
					break;
				case PatchAction.RemoveServices:
					if(patch.ids !== undefined){
						for(const id of patch.ids){
							const service: ServiceModel = { id: id };
							const doc_element: DocumentElement = {
								constructor: DocumentConstructor.Service,
								action: Action.Remove,
								service
							};
							doc_elements.push(doc_element);
							const doc_parameter = await TyronZIL.documentParameter(addr, doc_element);
							update_document.push(doc_parameter);
						}
					} else {
						throw new ErrorCode('Missing', 'No service ID given to remove')
					}
					break;
				default:
					throw new ErrorCode('CodeIncorrectPatchAction', 'The chosen action is not valid');
			}
		}
		return {
			documentElements: doc_elements,
			updateDocument: update_document,
			privateKeys: private_keys,
		}
	}

	private static async addKeys(addr: string, input: PublicKeyInput[]): Promise<NewKeys> {
		const doc_elements = [];
		const verification_methods = [];
		const private_keys = [];

		for(const key_input of input) {
			/** To create the DID public key */
			const key_pair_input: OperationKeyPairInput = { id: key_input.id, addr: addr }
			
			// Creates the key pair:
			const [doc_element, verification_method, private_key] = await Cryptography.operationKeyPair(key_pair_input);
			doc_elements.push(doc_element);
			verification_methods.push(verification_method);
			private_keys.push(private_key);
		}
		const new_keys: NewKeys = {
			docElements: doc_elements,
			verificationMethods: verification_methods,
			privateKeys: private_keys
		}
		return new_keys;
		}
}

/** Keys generated by the `DID Update` operation */
interface NewKeys {
	docElements: DocumentElement[];
	verificationMethods: TransitionValue[];
	privateKeys: PrivateKeyModel[];
}
