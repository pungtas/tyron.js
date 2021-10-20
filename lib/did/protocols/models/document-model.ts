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

import { PublicKeyInput, PublicKeyModel } from './verification-method-models';

export enum DocumentConstructor{
	VerificationMethod = 'VerificationMethod',
	Service = 'Service'
}

export interface DocumentElement{
	constructor: DocumentConstructor,       
	action: Action,
	key?: PublicKeyModel,
	service?: ServiceModel
}

export enum ServiceEndpoint{
	Web2Endpoint = 'Uri',
	Web3Endpoint = 'Address'
}

export enum TransferProtocol{
	Https = "Https",
	Git = "Git"
}

export interface ServiceModel{
	id: string,
	endpoint?: ServiceEndpoint,
	type?: string,
	transferProtocol?: TransferProtocol,
	uri?: string,
	//network?: string,
	address?: string	
}

export enum Action{
	Add = "Add",
	Remove = "Remove"
}

export interface PatchModel{
	action: PatchAction;
	ids?: string[];    //the IDs of the DID Document elements to remove
	keyInput?: PublicKeyInput[];
	services?: ServiceModel[];
}

export enum PatchAction{
	AddKeys = 'add-public-keys',
	RemoveKeys = 'remove-public-keys',
	AddServices = 'add-service-endpoints',
	RemoveServices = 'remove-service-endpoints',
	// Format of an additional custom action
	CustomAction = '-custom-action',
}
