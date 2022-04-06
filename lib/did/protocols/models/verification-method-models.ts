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

export interface PublicKeyModel {
  id: string;
  key?: string;
  encrypted?: string;
}

export interface PrivateKeyModel {
  id: string;
  key: string;
}

export interface VerificationMethodModel extends PublicKeyModel {
  type: string;
  publicKeyBase58: string;
}

export enum PublicKeyPurpose {
  Update = "update",
  Recovery = "recovery",
  SocialRecovery = "socialrecovery",
  General = "general",
  Auth = "authentication",
  Assertion = "assertion",
  Agreement = "agreement",
  Invocation = "invocation",
  Delegation = "delegation",
}

export interface TyronVerificationMethods {
  publicKey?: VerificationMethodModel;
  authentication?: VerificationMethodModel;
  assertionMethod?: VerificationMethodModel;
  keyAgreement?: VerificationMethodModel;
  capabilityInvocation?: VerificationMethodModel;
  capabilityDelegation?: VerificationMethodModel;
  didUpdate?: VerificationMethodModel;
  didRecovery?: VerificationMethodModel;
  socialRecovery?: VerificationMethodModel;
}

export interface DKMS {
  publicKey?: PrivateKeyModel;
  authentication?: PrivateKeyModel;
  assertionMethod?: PrivateKeyModel;
  keyAgreement?: PrivateKeyModel;
  capabilityInvocation?: PrivateKeyModel;
  capabilityDelegation?: PrivateKeyModel;
  didUpdate?: PrivateKeyModel;
  didRecovery?: PrivateKeyModel;
  socialRecovery?: PrivateKeyModel;
}

export interface PublicKeyInput {
  id: PublicKeyPurpose;
}

//@TODO generate verification methods for all public key main purposes
