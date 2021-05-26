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

import { Transaction } from '@zilliqa-js/account';
import { Contract} from '@zilliqa-js/contract';
import * as zcrypto from '@zilliqa-js/crypto';
import * as Util from '@zilliqa-js/util';
import ZilliqaInit from './zilliqa-init';
import { NetworkNamespace } from '../did/tyronzil-schemes/did-scheme';
import ErrorCode from '../did/util/ErrorCode';
import { Action, DocumentElement, ServiceModel } from '../did/protocols/models/document-model';
import { PublicKeyModel } from '../did/protocols/models/verification-method-models';

/** tyronzil transaction class */
export default class TyronZIL extends ZilliqaInit {
	/** Address of the owner of the self-sovereign identity */
	public readonly owner: string;
	public readonly ownerZilSecretKey: string;
	/** Address of the INIT.tyron smart contract */
	public readonly initTyron: string;
	public readonly gasPrice: Util.BN;
	public readonly gasLimit: Util.Long;

	private constructor(
		network: NetworkNamespace,
		owner: string,
		ownerZilSecretKey: string,
		initTyron: string,
		gasPrice: Util.BN,
		gasLimit: Util.Long,
	) {
		super(network);
		this.owner = owner;
		this.ownerZilSecretKey = ownerZilSecretKey;
		this.initTyron = initTyron;
		this.gasPrice = gasPrice;
		this.gasLimit = gasLimit
	}
	
	/** Retrieves the minimum gas price & validates the account info */
	public static async initialize(
		network: NetworkNamespace,
		initTyron: string,
		ownerZilSecretKey: string,
		gasLimit: number
	): Promise<TyronZIL> {
		let owner = zcrypto.getAddressFromPrivateKey(ownerZilSecretKey);
		let gas_limit: Util.Long.Long = new Util.Long(gasLimit);
		const zil_init = new ZilliqaInit(network);
		
		const transaction_init = await zil_init.API.blockchain.getMinimumGasPrice()
		.then((min_gas_price: { result: any; }) => {
			const gas_price = new Util.BN(min_gas_price.result!);
			return new TyronZIL(
				network,
				owner,
				ownerZilSecretKey,
				initTyron,
				gas_price,
				gas_limit               
			);
		})
		.catch((err: any) => {throw err});
		return transaction_init;
	}

	public static async deploy(
		input: TyronZIL,
		contractCode: string
	): Promise<DeployedContract> {
		
		const contract_init = [
			{
				vname: '_scilla_version',
				type: 'Uint32',
				value: '0',
			},
			{
				vname: 'initOwner',
				type: 'ByStr20',
				value: `${input.owner}`,
			},
			{
				vname: 'initController',
				type: 'ByStr20',
				value: `${input.owner}`,
			},
			{
				vname: 'initTyron',
				type: 'ByStr20',
				value: `${input.initTyron}`,
			}
		];
		const smart_contract = input.API.contracts.new(contractCode, contract_init);
		
		input.API.wallet.addByPrivateKey(input.ownerZilSecretKey);
		
		const deployed_contract = await input.API.blockchain.getBalance(input.owner)
		.then( async user_balance => {
			const [deployTx, contract] = await smart_contract.deploy(
				{
					version: input.zilVersion,
					gasPrice: input.gasPrice,
					gasLimit: input.gasLimit,
					nonce: Number(user_balance.result.nonce)+ 1,
				},
				33,
				1000,
				false,
			);
			const is_deployed = deployTx.isConfirmed();
			if(!is_deployed) {
				throw new ErrorCode("Wrong-Deployment","The contract did not get deployed.")
			}
			
			const deployment_gas = (deployTx.getReceipt())!.cumulative_gas;
		
			const deployed_contract: DeployedContract = {
				transaction: deployTx,
				contract: contract,
				gas: deployment_gas
			};
			return deployed_contract;
		})
		.catch(err => { throw err });
		return deployed_contract;
	}

	/** Submits a tyronzil transaction */
	public static async submit(
		tag: TransitionTag,
		input: TyronZIL,
		ssiAddr: string,
		amount: string,		
		params: TransitionParams[]
	): Promise<Transaction> {
		
		const SUBMIT = await input.API.blockchain.getSmartContractState(ssiAddr)
		.then(async (smart_contract_state) => {
			console.log(smart_contract_state);

			const AMOUNT = new Util.BN(amount);
			const USER_PUBKEY = zcrypto.getPubKeyFromPrivateKey(input.ownerZilSecretKey);
			
			const USER_BALANCE = await input.API.blockchain.getBalance(input.owner);
		
			const TRANSITION: Transition = {
				_tag: tag,
				_amount: String(AMOUNT),
				_sender: input.owner,
				params: params
			};

			const TX_OBJECT: TxObject = {
				version: input.zilVersion,
				amount: AMOUNT,
				nonce: Number(USER_BALANCE.result.nonce)+ 1,
				gasLimit: input.gasLimit,
				gasPrice: input.gasPrice,
				toAddr: ssiAddr,
				pubKey: USER_PUBKEY,
				data: JSON.stringify(TRANSITION),
			};
			
			const RAW_TX = input.API.transactions.new(TX_OBJECT);
			return RAW_TX;
		})
		.then(async (raw_tx: any)  => {
			input.API.wallet.addByPrivateKey(input.ownerZilSecretKey);
			const SIGNED_TX = await input.API.wallet.signWith(raw_tx, input.owner);
			return SIGNED_TX;
		})
		.then(async (signed_tx: any) => {
			/** Sends the tyronzil transaction to the Zilliqa blockchain platform */
			const TX = await input.API.blockchain.createTransaction(signed_tx, 33, 1000);
			return TX;
		})
		.then( async transaction => {
			const TRAN_ID = transaction.id!;
			const TRANSACTION = await transaction.confirm(TRAN_ID, 33, 1000)
			const STATUS = transaction.isConfirmed();
			if(!STATUS){
				throw new ErrorCode("TyronZIL",`The ${tag} tyronZIL transaction was unsuccessful!`);
			}
			return TRANSACTION;
		})
		.catch((err: any) => { throw err });
		return SUBMIT;
	}

	public static async create(
		agent: string,
		document: any[],
		updateKey: string,
		recoveryKey: string
	): Promise<TransitionParams[]> {
		
		const PARAMS = [];

		const AGENT: TransitionParams = {
			vname: 'agent',
			type: 'String',
			value: agent,
		};
		PARAMS.push(AGENT);

		const DOCUMENT: TransitionParams = {
			vname: 'document',
			type: 'List Document',
			value: document,
		};
		PARAMS.push(DOCUMENT);

		const UPDATE_KEY: TransitionParams = {
			vname: 'updateKey',
			type: 'ByStr33',
			value: updateKey,
		};
		PARAMS.push(UPDATE_KEY);

		const RECOVERY_KEY: TransitionParams = {
			vname: 'recoveryKey',
			type: 'ByStr33',
			value: recoveryKey,
		};
		PARAMS.push(RECOVERY_KEY);

		return PARAMS;
	}

	public static async recover(
		agent: string,
		newDocument: any[],
		docHash: string,
		signature: string,
		newUpdateKey: string,
		newRecoveryKey: string
	): Promise<TransitionParams[]> {

		const PARAMS = [];

		const AGENT: TransitionParams = {
			vname: 'agent',
			type: 'String',
			value: agent,
		};
		PARAMS.push(AGENT);

		const DOCUMENT: TransitionParams = {
			vname: 'newDocument',
			type: 'List Document',
			value: newDocument,
		};
		PARAMS.push(DOCUMENT);

		const DOC_HASH: TransitionParams = {
			vname: 'docHash',
			type: 'ByStr20',
			value: docHash,
		};
		PARAMS.push(DOC_HASH);

		const SIGNATURE: TransitionParams = {
			vname: 'signature',
			type: 'ByStr64',
			value: signature,
		};
		PARAMS.push(SIGNATURE);

		const NEW_UPDATE_KEY: TransitionParams = {
			vname: 'newUpdateKey',
			type: 'ByStr33',
			value: newUpdateKey,
		};
		PARAMS.push(NEW_UPDATE_KEY);

		const NEW_RECOVERY_KEY: TransitionParams = {
			vname: 'newRecoveryKey',
			type: 'ByStr33',
			value: newRecoveryKey,
		};
		PARAMS.push(NEW_RECOVERY_KEY);

		return PARAMS;
	}

	public static async update(
		agent: string,
		newDocument: any[],
		docHash: string,
		signature: string,
		newUpdateKey: string
	): Promise<TransitionParams[]> {

		const PARAMS = [];
		
		const AGENT: TransitionParams = {
			vname: 'agent',
			type: 'String',
			value: agent,
		};
		PARAMS.push(AGENT);

		const DOCUMENT: TransitionParams = {
			vname: 'newDocument',
			type: 'List Document',
			value: newDocument,
		};
		PARAMS.push(DOCUMENT);

		const DOC_HASH: TransitionParams = {
			vname: 'docHash',
			type: 'ByStr20',
			value: docHash,
		};
		PARAMS.push(DOC_HASH);

		const SIGNATURE: TransitionParams = {
			vname: 'signature',
			type: 'ByStr64',
			value: signature,
		};
		PARAMS.push(SIGNATURE);

		const NEW_UPDATE_KEY: TransitionParams = {
			vname: 'newUpdateKey',
			type: 'ByStr33',
			value: newUpdateKey,
		};
		PARAMS.push(NEW_UPDATE_KEY);

		return PARAMS;
    }

	public static async deactivate(
		agent: string,
		signature: string
	): Promise<TransitionParams[]> {

		const PARAMS = [];
		
		const AGENT: TransitionParams = {
			vname: 'agent',
			type: 'String',
			value: agent,
		};
		PARAMS.push(AGENT);

		const SIGNATURE: TransitionParams = {
			vname: 'signature',
			type: 'ByStr64',
			value: signature,
		};
		PARAMS.push(SIGNATURE);

		return PARAMS;
	}

	public static async dns(
		domain: string,
		avatar: string
	): Promise<TransitionParams[]> {
		
		const PARAMS = [];

		const DOMAIN: TransitionParams = {
			vname: 'domain',
			type: 'String',
			value: domain,
		};
		PARAMS.push(DOMAIN);

		const AVATAR: TransitionParams = {
			vname: 'avatar',
			type: 'String',
			value: avatar,
		};
		PARAMS.push(AVATAR);
		return PARAMS;
	}
	
	/** Returns a DID-Document element transition value */
	public static async documentElement(
		element: DocumentElement,       
		action: Action,
		key?: PublicKeyModel,
		service?: ServiceModel
	): Promise<TransitionValue> {
		let VALUE: TransitionValue;
		let ADD: TransitionValue = {
			argtypes: [],
			arguments: [],
			constructor: Action.Adding
		};
		let REMOVE: TransitionValue = {
			argtypes: [],
			arguments: [],
			constructor: Action.Removing
		};
		switch (element) {
			case DocumentElement.VerificationMethod:
				VALUE = {
					argtypes: [],
					arguments: [],
					constructor: "VerificationMethod"
				};
				switch (action) {
					case Action.Adding:
						Object.assign(VALUE, {
							arguments: [
								ADD,
								`${key!.id}`,
								`${key!.key}`
							]
						});
						break;
					case Action.Removing:
						Object.assign(VALUE, {
							arguments: [
								REMOVE,
								`${key!.id}`,
								"0x024caf04aa4f660db04adf65daf5b993b3383fcdb2ef0479ca8866b1336334b5b4"
							]
						});
						break;
				}
				break;
			case DocumentElement.Service:
					VALUE = {
						argtypes: [],
						arguments: [],
						constructor: "Service"
					};
					let DID_SERVICE = {
						argtypes: [],
						arguments: [
							`${service!.type}`,
							{
								argtypes: [],
								arguments: [
									{
										constructor: `${service!.transferProtocol}`,
										argtypes: [],
										arguments: []
									},
									`${service!.uri}`
								],
								constructor: "ServiceEndpoint"
							}
						],
						constructor: "DidService"
					};
					switch (action) {
						case Action.Adding:
							Object.assign(VALUE, {
								arguments: [
									ADD,
									`${service!.id}`,
									DID_SERVICE
								]
							});
							break;
						case Action.Removing:
							Object.assign(VALUE, {
								arguments: [
									REMOVE,
									`${service!.id}`,
									DID_SERVICE
								]
							});
							break;
					}
					break;
			default:
				throw new ErrorCode("UnsupportedElement", "That is not a DID-Document supported element");
		}
		return VALUE;
	}

	public static async xTransfer(
		domain: string,
		token: string,
		agent: string,
		recipient: string,
		amount: string,
		signature: string
	): Promise<TransitionParams[]> {
		
		const PARAMS = [];

		const DOMAIN: TransitionParams = {
			vname: 'domain',
			type: 'String',
			value: domain
		};
		PARAMS.push(DOMAIN);

		const TOKEN: TransitionParams = {
			vname: 'token',
			type: 'String',
			value: token
		};
		PARAMS.push(TOKEN);

		const AGENT: TransitionParams = {
			vname: 'agent',
			type: 'String',
			value: agent
		};
		PARAMS.push(AGENT);

		const RECIPIENT: TransitionParams = {
			vname: 'to',
			type: 'ByStr20',
			value: recipient
		};
		PARAMS.push(RECIPIENT);

		const AMOUNT: TransitionParams = {
			vname: 'amount',
			type: 'Uint128',
			value: amount,
		};
		PARAMS.push(AMOUNT);

		const SIGNATURE: TransitionParams = {
			vname: 'signature',
			type: 'ByStr64',
			value: signature
		};
		PARAMS.push(SIGNATURE);

		return PARAMS;
	}

	public static async ssiToken(
		token: string
	): Promise<TransitionParams[]> {
		
		const PARAMS = [];

		const TOKEN: TransitionParams = {
			vname: 'token',
			type: 'String',
			value: token,
		};
		PARAMS.push(TOKEN);
		return PARAMS;
	}

	public static async donate(
		campaign: string
	): Promise<TransitionParams[]> {
		
		const PARAMS = [];

		const CAMPAIGN: TransitionParams = {
			vname: 'campaign',
			type: 'String',
			value: campaign,
		};
		PARAMS.push(CAMPAIGN);
		return PARAMS;
	}

	public static async xZIL(
		amount: string,
		signedData: string,
		signature: string,
		beneficiary: string
	): Promise<TransitionParams[]> {
		
		const PARAMS = [];
		const AMOUNT: TransitionParams = {
			vname: 'amount',
			type: 'Uint128',
			value: amount,
		};
		PARAMS.push(AMOUNT);

		const SIGNED_DATA: TransitionParams = {
			vname: 'signedData',
			type: 'ByStr',
			value: signedData,
		};
		PARAMS.push(SIGNED_DATA);

		const SIGNATURE: TransitionParams = {
			vname: 'signature',
			type: 'ByStr64',
			value: signature,
		};
		PARAMS.push(SIGNATURE);

		const BENEFICIARY:TransitionParams = {
			vname: 'beneficiary',
			type: 'String',
			value: beneficiary,
		};
		PARAMS.push(BENEFICIARY);
		return PARAMS;
	}
}

/***            ** interfaces **            ***/

/** The result of a contract deployment */
export interface DeployedContract {
	transaction: Transaction,
	contract: Contract,
	gas: any
}

interface Transition {
	_tag: string;               // transition to be invoked
	_amount: string; 	        // number of QA to be transferred
	_sender: string;	        // address of the invoker
	params: TransitionParams[] 	// an array of parameter objects
}

export enum TransitionTag {
	Create = 'DidCreate',
	Update = "DidUpdate",
	Recover = "DidRecover",
	Deactivate = "DidDeactivate",
	Dns = "SetSsiDomain",
	XTransfer = "XTransfer",
	SsiToken = "SsiToken",
	Donate = "Donate",
	Xzil = "xZIL"
}

interface TransitionParams {
	vname: string;
	type: any;
	value: unknown;
}

export interface TransitionValue {
	constructor: string;
	argtypes: any[];
	arguments: any[]
}

interface TxObject {
	version: number;
	amount: Util.BN;
	nonce: number;
	gasLimit: Util.Long;
	gasPrice: Util.BN;
	toAddr: string;
	pubKey: string;
	code?: string;
	data?: string;
	priority?: boolean;
}
