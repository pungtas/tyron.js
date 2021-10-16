/*
	tyron.js: SSI Protocol's JavaScript/TypeScript library
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
import ZilliqaInit from '../../../blockchain/zilliqa-init';
import { ServiceModel } from '../../protocols/models/document-model';
import { DKMS, PublicKeyPurpose, TyronVerificationMethods, VerificationMethodModel } from '../../protocols/models/verification-method-models';
import { NetworkNamespace } from '../../tyronzil-schemes/did-scheme';
import DidUrlScheme from '../../tyronzil-schemes/did-url-scheme';
import DidState from './did-state';
import ErrorCode from '../../util/ErrorCode';

export enum Accept {
    contentType = "application/did+json",        //requests a DID-Document as output
	Result = "application/did+json;profile='https://w3c-ccg.github.io/did-resolution'"        //requests a DID-Resolution-Result as output
}

/** Generates a Tyron DID Document */
export default class DidDoc {
	public readonly id: string;
	public readonly controller: string;
	public readonly verificationMethods: TyronVerificationMethods;
	public readonly dkms: DKMS;
	public readonly services?: ServiceModel[];

	private constructor (
		scheme: DidDocScheme
	) {
		this.id = scheme.id;
		this.controller = scheme.controller;
		this.verificationMethods = scheme.verificationMethods;
		this.dkms = scheme.dkms;
		this.services = scheme.services;
	}

	/** The `Tyron DID Resolution` method */
	public static async resolution(network: NetworkNamespace, input: ResolutionInput): Promise<DidDoc|ResolutionResult> {
		const ACCEPT = input.metadata.accept;
		const ZIL_INIT = new ZilliqaInit(network);

		const BLOCKCHAIN_INFO = await ZIL_INIT.API.blockchain.getBlockChainInfo();
		let RESOLUTION_RESULT;

		const DID_RESOLVED = await DidState.fetch(network, input.addr)
		.then(async did_state => {
			const DID_DOC = await DidDoc.read(did_state);
			switch (ACCEPT) {
				case Accept.contentType:
					return DID_DOC;
				case Accept.Result:
					RESOLUTION_RESULT = {
						id: DID_DOC.id,
						resolutionMetadata: BLOCKCHAIN_INFO,
						document: DID_DOC,
						metadata: {
							contentType: "application/did+json"
						}
					};
					return RESOLUTION_RESULT;
			}
		})
		.catch(err => { throw err })
		return DID_RESOLVED;
	}

	/** Generates a 'Tyron DID Read' operation, resolving any Tyron DID State into its DID Document */
	public static async read(state: DidState): Promise<DidDoc> {
		const DID_DOC = await DidUrlScheme.validate(state.did)
		.then(async did_scheme => {
			const ID = did_scheme.did;
			
			const VERIFICATION_METHODS = state.verification_methods!;
			let PUBLIC_KEY: any[] = [];
			let AUTHENTICATION: any[] = [];
			let ASSERTION_METHOD: any[] = [];
			let KEY_AGREEMENT: any[] = [];
			let CAPABILITY_INVOCATION: any[] = [];
			let CAPABILITY_DELEGATION: any[] = [];
			let DID_UPDATE: any[] = [];
			let DID_RECOVERY: any[] = [];
			let SOCIAL_RECOVERY: any[] = [];

			// Every key MUST have a Public Key Purpose as its ID
			for (let purpose of VERIFICATION_METHODS.keys()) {
				const DID_URL: string = ID + '#' + purpose;
				const KEY = VERIFICATION_METHODS.get(purpose);
				let encrypted;
				if( state.dkms === undefined ){
					encrypted = "undefined"
				} else {
					encrypted = state.dkms?.get(purpose)
				}
				const VERIFICATION_METHOD: VerificationMethodModel = {
					id: DID_URL,
					type: 'SchnorrSecp256k1VerificationKey2019',
					publicKeyBase58: zcrypto.encodeBase58(KEY!),
				};
				switch (purpose) {
					case PublicKeyPurpose.General:
						PUBLIC_KEY = [VERIFICATION_METHOD, encrypted];                            
						break;
					case PublicKeyPurpose.Auth:
						AUTHENTICATION = [VERIFICATION_METHOD, encrypted];
						break;
					case PublicKeyPurpose.Assertion:
						ASSERTION_METHOD = [VERIFICATION_METHOD, encrypted];
						break;
					case PublicKeyPurpose.Agreement:
						KEY_AGREEMENT = [VERIFICATION_METHOD, encrypted];
						break;
					case PublicKeyPurpose.Invocation:
						CAPABILITY_INVOCATION = [VERIFICATION_METHOD, encrypted];
						break;
					case PublicKeyPurpose.Delegation:
						CAPABILITY_DELEGATION = [VERIFICATION_METHOD, encrypted];
						break;
					case PublicKeyPurpose.Update:
						DID_UPDATE = [VERIFICATION_METHOD, encrypted];
						break;
					case PublicKeyPurpose.Recovery:
						DID_RECOVERY = [VERIFICATION_METHOD, encrypted];
						break;
					case PublicKeyPurpose.SocialRecovery:
						SOCIAL_RECOVERY = [VERIFICATION_METHOD, encrypted];
						break;            
					default:
						throw new ErrorCode("InvalidPurpose", `The resolver detected an invalid Public Key Purpose`);
				}
			};
			
			const SERVICES = [];
			const services = state.services;
			for (let id of services.keys()) {
				const SERVICE: ServiceModel = {
					id: ID + '#' + id,
					address: services.get(id)
				};
				SERVICES.push(SERVICE);
			}
			const services_ = state.services_;
			for (let id of services_.keys()) {
				const TYPE_URI = services_.get(id);
				const TYPE = TYPE_URI![0];
				const URI = TYPE_URI![1];
				const SERVICE: ServiceModel = {
					id: ID + '#' + id,
					type: TYPE,
					uri: URI
				};
				SERVICES.push(SERVICE);
			}

			/** The DID Document */
			const SCHEME: DidDocScheme = {
				id: ID,
				controller: state.controller,
				verificationMethods: {},
				dkms: {},
				services: [],
			};
			if(PUBLIC_KEY !== []) {
				SCHEME.verificationMethods.publicKey = PUBLIC_KEY[0];
				SCHEME.dkms!.publicKey = PUBLIC_KEY[1];
			}
			if(AUTHENTICATION !== []) {
				SCHEME.verificationMethods.authentication = AUTHENTICATION[0];
				SCHEME.dkms.authentication = AUTHENTICATION[1];
			}
			if(ASSERTION_METHOD !== []) {
				SCHEME.verificationMethods.assertionMethod = ASSERTION_METHOD[0];
				SCHEME.dkms.assertionMethod = ASSERTION_METHOD[1];
			}
			if(KEY_AGREEMENT !== []) {
				SCHEME.verificationMethods.keyAgreement = KEY_AGREEMENT[0];
				SCHEME.dkms.keyAgreement = KEY_AGREEMENT[1];
			}
			if(CAPABILITY_INVOCATION !== []) {
				SCHEME.verificationMethods.capabilityInvocation = CAPABILITY_INVOCATION[0];
				SCHEME.dkms.capabilityInvocation = CAPABILITY_INVOCATION[1];
			}
			if(CAPABILITY_DELEGATION!== []) {
				SCHEME.verificationMethods.capabilityDelegation = CAPABILITY_DELEGATION[0];
				SCHEME.dkms.capabilityDelegation = CAPABILITY_DELEGATION[1];
			}
			if(DID_UPDATE!== []) {
				SCHEME.verificationMethods.didUpdate = DID_UPDATE[0];
				SCHEME.dkms.didUpdate = DID_UPDATE[1];
			}
			if(DID_RECOVERY!== []) {
				SCHEME.verificationMethods.didRecovery = DID_RECOVERY[0];
				SCHEME.dkms.didRecovery = DID_RECOVERY[1];
			}
			if(SOCIAL_RECOVERY!== undefined) {
				SCHEME.verificationMethods.socialRecovery = SOCIAL_RECOVERY[0];
				SCHEME.dkms.socialRecovery = SOCIAL_RECOVERY[1];
			}

			if(SERVICES.length !== 0) {
				SCHEME.services = SERVICES;
			}
			return new DidDoc(SCHEME);
		})
		.catch(err => { throw err })
		return DID_DOC;
	}
}

/** The scheme of a `Tyron DID Document` */
interface DidDocScheme {
	id: string;
	controller: string;
	verificationMethods: TyronVerificationMethods;
	dkms: DKMS;
	services: ServiceModel[];
}

export interface ResolutionInput {
	addr: string;
	metadata: ResolutionInputMetadata;
}

export interface ResolutionInputMetadata {
	accept: Accept;        //to request a certain type of result
	versionId?: string;        //to request a specific version of the DID-Document - mutually exclusive with versionTime
	versionTime?: string;        //idem versionId - an RFC3339 combined date and time representing when the DID-Doc was current for the input DID
	noCache?: boolean;        //to request a certain kind of caching behavior - 'true': caching is disabled and a fresh DID-Doc is retrieved from the registry
	dereferencingInput?: DereferencingInputMetadata;
}

interface DereferencingInputMetadata {
	serviceType?: string;        //to select a specific service from the DID-Document
	followRedirect?: boolean;        //to instruct whether redirects should be followed
}

export interface ResolutionResult {
	id: string;
	resolutionMetadata: unknown;
	document: DidDoc;
	metadata: DocumentMetadata;
}

interface DocumentMetadata {
	contentType: string;
}
