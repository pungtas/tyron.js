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

import { Cryptography, OperationKeyPairInput, DIDVerificationMethods } from '../util/did-keys';
import * as tyronzil from '../../blockchain/tyronzil';
import { PrivateKeyModel, PublicKeyInput, PublicKeyPurpose } from '../protocols/models/verification-method-models';
import * as zcrypto from '@zilliqa-js/crypto';
import { Sidetree } from '../protocols/sidetree';
import { Action, DocumentConstructor, DocumentElement, PatchModel, ServiceModel } from '../protocols/models/document-model';
import DidState from './did-resolve/did-state';
import hash from 'hash.js';
import * as zutil from '@zilliqa-js/util';

/** Generates a `DID CRUD` operation
 *  which produces the `DID Document` & metadata */
export default class DidCrud{
	public readonly txParams: tyronzil.TransitionParams[];
	public readonly privateKeys?: DIDVerificationMethods;

	private constructor(
		operation: CrudOperationModel
	){
		this.txParams = operation.txParams;
		this.privateKeys = operation.privateKeys;
	}

	public static async GetServices(addr: string, services: ServiceModel[]): Promise<[DocumentElement[], tyronzil.TransitionValue[]]> {
		let doc_elements: DocumentElement[] = [];
		let doc_parameters: tyronzil.TransitionValue[] = [];

		for(const service of services){
			const doc_element: DocumentElement = {
				constructor: DocumentConstructor.Service,
				action: Action.Add,
				service: service
			};
			doc_elements.push(doc_element);
			const doc_parameter = await tyronzil.default.documentParameter(addr, doc_element);
			doc_parameters.push(doc_parameter);
		};

		return [doc_elements, doc_parameters]
	}

	public static async Create(input: InputModel): Promise<DidCrud> {
		const verification_methods: tyronzil.TransitionValue[] = [];
		const private_keys: PrivateKeyModel[] = [];
		
		input.publicKeyInput.push({id: PublicKeyPurpose.Update});
		input.publicKeyInput.push({id: PublicKeyPurpose.Recovery})
		for(const key_input of input.publicKeyInput) {
			// Creates the cryptographic key pair
			const key_pair_input: OperationKeyPairInput = { id: key_input.id, addr: input.addr};
			const key_pair = await Cryptography.operationKeyPair(key_pair_input);
			verification_methods.push(key_pair[1]);
			private_keys.push(key_pair[2]);
		}

		const services_ = await this.GetServices(input.addr, input.services!);
		const document = verification_methods.concat(services_[1]);
		const private_keys_ = await Cryptography.processKeys(private_keys);
		
		const tx_params = await tyronzil.default.CrudParams(
			input.addr,
			document,
			await tyronzil.default.OptionParam(tyronzil.Option.none, 'ByStr64'),
		);

		const operation_output: CrudOperationModel = {
			txParams: tx_params,
			privateKeys: private_keys_
		};
		return new DidCrud(operation_output);
	}

	public static async HashDocument(document: DocumentElement[]): Promise<String>{
		let hash_ = "0000000000000000000000000000000000000000";
		for(const element of document){
			let action_;
			switch (element.action) {
				case Action.Add:
					action_ = "add";
					break;
				case Action.Remove:
					action_ = "remove";					
					break;
			}
			const h1 = hash.sha256().update(action_).digest('hex');
			let h2;
			let h3;
			let hash__;
			switch (element.constructor) {
				case DocumentConstructor.VerificationMethod:
					h2 = hash.sha256().update(element.key?.id).digest('hex');
					switch (element.action) {
						case Action.Add:
							h3 = hash.sha256().update(zutil.bytes.hexToByteArray(element.key?.key!)).digest('hex');	
							hash__ = h1 + h2 + h3;			
							break;
						case Action.Remove:
							hash__ = h1 + h2;				
							break;
					};
					break;
				case DocumentConstructor.Service:
					h2 = hash.sha256().update(element.service?.id).digest('hex');
					switch (element.action) {
						case Action.Add:
							switch (element.service?.endpoint) {
								case 'Uri':
									h3 = hash.sha256().update(element.service?.uri!).digest('hex');
									break;
								case 'Address':
									h3 = hash.sha256().update(zutil.bytes.hexToByteArray(element.service?.address!)).digest('hex');
									break;
							}
							hash__ = h1 + h2 + h3;			
							break;
						case Action.Remove:
							hash__ = h1 + h2;				
							break;
					};
					break;
			};
			hash_ = hash_ + hash__;
		}
		return hash_;
	}

	public static async Recover(input: InputModel): Promise<DidCrud> {
		const verification_methods: tyronzil.TransitionValue[] = [];
		const private_keys: PrivateKeyModel[] = [];
		let doc_elements: DocumentElement[] = [];

		input.publicKeyInput.push({id: PublicKeyPurpose.Recovery})
		const public_key_input = input.publicKeyInput;
		for(const key_input of public_key_input) {
			// Creates the cryptographic key pair
			const key_pair_input: OperationKeyPairInput = {
				id: key_input.id,
				addr: input.addr
			}
			const [doc_element, verification_method, private_key] = await Cryptography.operationKeyPair(key_pair_input);
			doc_elements.push(doc_element);
			verification_methods.push(verification_method);
			private_keys.push(private_key);
		}

		const services_ = await this.GetServices(input.addr, input.services!);
		const doc_elements_ = doc_elements.concat(services_[0]);
		const hash_ = await this.HashDocument(doc_elements_);
		const document = verification_methods.concat(services_[1]);
				
		const previous_recovery_key = zcrypto.getPubKeyFromPrivateKey(input.recoveryPrivateKey!);
		const signature = zcrypto.sign(Buffer.from(hash_, 'hex'), input.recoveryPrivateKey!, previous_recovery_key);
		
		const tx_params = await tyronzil.default.CrudParams(
			input.addr,
			document,
			await tyronzil.default.OptionParam(tyronzil.Option.some, 'ByStr64', '0x'+signature),
		);
		
		const private_keys_ = await Cryptography.processKeys(private_keys);
		
		const operation_output: CrudOperationModel = {
			txParams: tx_params,
			privateKeys: private_keys_
		};
		return new DidCrud(operation_output);
	}

	public static async Update(input: UpdateInputModel): Promise<DidCrud> {
		const operation = await Sidetree.processPatches(input.addr, input.patches)
		.then( async update => {
			const hash = await this.HashDocument(update.documentElements);
			const previous_update_key = zcrypto.getPubKeyFromPrivateKey(input.updatePrivateKey);
			const signature = zcrypto.sign(Buffer.from(hash, 'hex'), input.updatePrivateKey, previous_update_key);
			const private_keys = await Cryptography.processKeys(update.privateKeys);

			const tx_params = await tyronzil.default.CrudParams(
				input.addr,
				update.updateDocument,
				await tyronzil.default.OptionParam(tyronzil.Option.some, 'ByStr64', '0x'+signature),
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

	public static async Deactivate(input: DeactivateInputModel): Promise<DidCrud> {
		const deactivate_element: DocumentElement = {
			constructor: DocumentConstructor.Service,       
			action: Action.Remove,
			service: { id: 'deactivate'}
		};
		const hash_ = await this.HashDocument([deactivate_element]);
		const document = await tyronzil.default.documentParameter(input.addr, deactivate_element) ;

		const previous_recovery_key = zcrypto.getPubKeyFromPrivateKey(input.recoveryPrivateKey);
		const signature = zcrypto.sign(Buffer.from(hash_, 'hex'), input.recoveryPrivateKey!, previous_recovery_key);
		
		const tx_params = await tyronzil.default.CrudParams(
			input.addr,
			[document],
			await tyronzil.default.OptionParam(tyronzil.Option.some, 'ByStr64', '0x'+signature),
		);

		const operation_output: CrudOperationModel = {
			txParams: tx_params
		};
		return new DidCrud(operation_output);
	}
}

/** Defines output data for a DID CRUD operation */
interface CrudOperationModel{
	txParams: tyronzil.TransitionParams[];
	privateKeys?: DIDVerificationMethods;
}

// @TODO verify username
export interface InputModel{
	addr: string;
	publicKeyInput: PublicKeyInput[];   //
	services?: ServiceModel[];
	recoveryPrivateKey?: string;
}

/** Defines input data for a `DID Update` operation */
export interface UpdateInputModel{
	addr: string;
	state: DidState;
	updatePrivateKey: string;
	patches: PatchModel[];
}

/** Defines input data for a `DID Deactivate` operation */
export interface DeactivateInputModel{
	addr: string;
	state: DidState;
	recoveryPrivateKey: string;
}
