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
	public readonly gasPrice: Util.BN;
	public readonly gasLimit: Util.Long;
	/** Address of the INIT.tyron smart contract */
	public readonly init_tyron: string;	

	private constructor(
		network: NetworkNamespace,
		owner: string,
		ownerZilSecretKey: string,
		gasPrice: Util.BN,
		gasLimit: Util.Long,
		init_tyron: string
	) {
		super(network);
		this.owner = owner;
		this.ownerZilSecretKey = ownerZilSecretKey;		
		this.gasPrice = gasPrice;
		this.gasLimit = gasLimit;
		this.init_tyron = init_tyron;
	}
	
	/** Retrieves the minimum gas price & validates the account info */
	public static async initialize(
		network: NetworkNamespace,
		ownerZilSecretKey: string,
		gasLimit: number,
		init_tyron: string
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
				gas_price,
				gas_limit,
				init_tyron,            
			);
		})
		.catch((err: any) => {throw err});
		return transaction_init;
	}

	public static async deploy(
		tyronzil: TyronZIL,
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
				value: `${tyronzil.owner}`,
			},
			{
				vname: 'initTyron',
				type: 'ByStr20',
				value: `${tyronzil.init_tyron}`,
			}
		];
		const smart_contract = tyronzil.API.contracts.new(contractCode, contract_init);
		
		tyronzil.API.wallet.addByPrivateKey(tyronzil.ownerZilSecretKey);
		
		const deployed_contract = await tyronzil.API.blockchain.getBalance(tyronzil.owner)
		.then( async user_balance => {
			const [deployTx, contract] = await smart_contract.deploy(
				{
					version: tyronzil.zilVersion,
					gasPrice: tyronzil.gasPrice,
					gasLimit: tyronzil.gasLimit,
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
		tyronzil: TyronZIL,
		ssiAddr: string,
		amount: string,		
		params: TransitionParams[]
	): Promise<Transaction> {
		
		const SUBMIT = await tyronzil.API.blockchain.getSmartContractState(ssiAddr)
		.then(async (smart_contract_state) => {
			console.log(smart_contract_state);

			const AMOUNT = new Util.BN(amount);
			const USER_PUBKEY = zcrypto.getPubKeyFromPrivateKey(tyronzil.ownerZilSecretKey);
			
			const USER_BALANCE = await tyronzil.API.blockchain.getBalance(tyronzil.owner);
		
			const TRANSITION: Transition = {
				_tag: tag,
				_amount: String(AMOUNT),
				_sender: tyronzil.owner,
				params: params
			};

			const TX_OBJECT: TxObject = {
				version: tyronzil.zilVersion,
				amount: AMOUNT,
				nonce: Number(USER_BALANCE.result.nonce)+ 1,
				gasLimit: tyronzil.gasLimit,
				gasPrice: tyronzil.gasPrice,
				toAddr: ssiAddr,
				pubKey: USER_PUBKEY,
				data: JSON.stringify(TRANSITION),
			};
			
			const RAW_TX = tyronzil.API.transactions.new(TX_OBJECT);
			return RAW_TX;
		})
		.then(async (raw_tx: any)  => {
			tyronzil.API.wallet.addByPrivateKey(tyronzil.ownerZilSecretKey);
			const SIGNED_TX = await tyronzil.API.wallet.signWith(raw_tx, tyronzil.owner);
			return SIGNED_TX;
		})
		.then(async (signed_tx: any) => {
			/** Sends the tyronzil transaction to the Zilliqa blockchain platform */
			const TX = await tyronzil.API.blockchain.createTransaction(signed_tx, 33, 1000);
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

	public static async OptionParam(
		option: Option,
		type: any,
		someValue?: any  
	): Promise<any> {
		let value: TransitionValue;
		switch (option) {
			case "Some":
				value = {
					argtypes: [ `${type}` ],
					arguments: [ `${someValue}` ],
					constructor: "Some"
				}
				return value;
			case "None":
				value = {
					argtypes: [ `${type}` ],
					arguments: [],
					constructor: "None"
				}
				return value;
		};
	}

	public static async CrudParams(
		username: any,
		document: any,
		recoveryKey: any,
		updateKey: any,
		signature: any
	): Promise<TransitionParams[]> {
		
		const params = [];

		const user: TransitionParams = {
			vname: 'username',
			type: 'Option String',
			value: username,
		};
		params.push(user);

		const doc: TransitionParams = {
			vname: 'document',
			type: 'Option( List Document )',
			value: document,
		};
		params.push(doc);

		const recovery_key: TransitionParams = {
			vname: 'recoveryKey',
			type: 'Option ByStr33',
			value: recoveryKey,
		};
		params.push(recovery_key);

		const update_key: TransitionParams = {
			vname: 'updateKey',
			type: 'Option ByStr33',
			value: updateKey,
		};
		params.push(update_key);

		const sig: TransitionParams = {
			vname: 'signature',
			type: 'Option ByStr64',
			value: signature,
		};
		params.push(sig);

		return params;
	}

	/** Returns a DID Document element transition value */
	public static async documentElement(
		element: DocumentElement,       
		action: Action,
		key?: PublicKeyModel,
		service?: ServiceModel
	): Promise<TransitionValue> {
		let value: TransitionValue;
		let add: TransitionValue = {
			argtypes: [],
			arguments: [],
			constructor: Action.Adding
		};
		let remove: TransitionValue = {
			argtypes: [],
			arguments: [],
			constructor: Action.Removing
		};
		switch (element) {
			case DocumentElement.VerificationMethod:
				value = {
					argtypes: [],
					arguments: [],
					constructor: "VerificationMethod"
				};
				switch (action) {
					case Action.Adding:
						Object.assign(value, {
							arguments: [
								add,
								`${key!.id}`,
								`${key!.key}`
							]
						});
						break;
					case Action.Removing:
						Object.assign(value, {
							arguments: [
								remove,
								`${key!.id}`,
								"0x024caf04aa4f660db04adf65daf5b993b3383fcdb2ef0479ca8866b1336334b5b4"
							]
						});
						break;
				}
				break;
			case DocumentElement.Service:
					value = {
						argtypes: [],
						arguments: [],
						constructor: "Service"
					};
					let did_service = {
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
							Object.assign(value, {
								arguments: [
									add,
									`${service!.id}`,
									did_service
								]
							});
							break;
						case Action.Removing:
							Object.assign(value, {
								arguments: [
									remove,
									`${service!.id}`,
									did_service
								]
							});
							break;
					}
					break;
			default:
				throw new ErrorCode("UnsupportedElement", "That is not a DID-Document supported element");
		}
		return value;
	}

	public static async xTransfer(
		domain: string,
		token: string,
		agent: string,
		recipient: string,
		amount: string,
		signature: string
	): Promise<TransitionParams[]> {
		
		const params = [];

		const DOMAIN: TransitionParams = {
			vname: 'domain',
			type: 'String',
			value: domain
		};
		params.push(DOMAIN);

		const TOKEN: TransitionParams = {
			vname: 'token',
			type: 'String',
			value: token
		};
		params.push(TOKEN);

		const AGENT: TransitionParams = {
			vname: 'agent',
			type: 'String',
			value: agent
		};
		params.push(AGENT);

		const RECIPIENT: TransitionParams = {
			vname: 'to',
			type: 'ByStr20',
			value: recipient
		};
		params.push(RECIPIENT);

		const AMOUNT: TransitionParams = {
			vname: 'amount',
			type: 'Uint128',
			value: amount,
		};
		params.push(AMOUNT);

		const SIGNATURE: TransitionParams = {
			vname: 'signature',
			type: 'ByStr64',
			value: signature
		};
		params.push(SIGNATURE);

		return params;
	}
}

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
	Create = "DidCreate",
	Update = "DidUpdate",
	Recover = "DidRecover",
	Deactivate = "DidDeactivate",
	XTransfer = "XTransfer",
}

export interface TransitionParams {
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

export enum Option {
	some = "Some",
	none = "None"
}