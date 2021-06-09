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
import { Action, DocumentElement, TransferProtocol } from '../did/protocols/models/document-model';

/** tyronzil transaction class */
export default class TyronZIL extends ZilliqaInit {
	public readonly admin: string;
	public readonly adminZilSecretKey: string;
	public readonly gasPrice: Util.BN;
	public readonly gasLimit: Util.Long;
	/** Address of the INIT.tyron smart contract */
	public readonly init_tyron: string;	

	private constructor(
		network: NetworkNamespace,
		admin: string,
		adminZilSecretKey: string,
		gasPrice: Util.BN,
		gasLimit: Util.Long,
		init_tyron: string
	){
		super(network);
		this.admin = admin;
		this.adminZilSecretKey = adminZilSecretKey;		
		this.gasPrice = gasPrice;
		this.gasLimit = gasLimit;
		this.init_tyron = init_tyron;
	}
	
	/** Retrieves the minimum gas price & validates the account info */
	public static async initialize(
		network: NetworkNamespace,
		adminZilSecretKey: string,
		gasLimit: number,
		init_tyron: string
	): Promise<TyronZIL> {
		let admin = zcrypto.getAddressFromPrivateKey(adminZilSecretKey);
		let gas_limit: Util.Long.Long = new Util.Long(gasLimit);
		const zil_init = new ZilliqaInit(network);
		
		const transaction_init = await zil_init.API.blockchain.getMinimumGasPrice()
		.then((min_gas_price: { result: any; }) => {
			const gas_price = new Util.BN(min_gas_price.result!);
			return new TyronZIL(
				network,
				admin,
				adminZilSecretKey,
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
				vname: 'initAdmin',
				type: 'ByStr20',
				value: `${tyronzil.admin}`,
			},
			{
				vname: 'init_tyron',
				type: 'ByStr20',
				value: `${tyronzil.init_tyron}`,
			}
		];
		const smart_contract = tyronzil.API.contracts.new(contractCode, contract_init);
		
		tyronzil.API.wallet.addByPrivateKey(tyronzil.adminZilSecretKey);
		
		const deployed_contract = await tyronzil.API.blockchain.getBalance(tyronzil.admin)
		.then( async account => {
			const [deployTx, contract] = await smart_contract.deploy(
				{
					version: tyronzil.zilVersion,
					gasPrice: tyronzil.gasPrice,
					gasLimit: tyronzil.gasLimit,
					nonce: Number(account.result.nonce)+ 1,
				},
				33,
				1000,
				false,
			);
			const is_deployed = deployTx.isConfirmed();
			if(!is_deployed) {
				throw new ErrorCode("Wrong-Deployment","The contract did not get deployed.")
			}
			
			const deployment_gas = deployTx.getReceipt()!.cumulative_gas;
		
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
		addr: string,
		amount: string,		
		params: TransitionParams[]
	): Promise<Transaction> {
		
		const submit = await tyronzil.API.blockchain.getSmartContractState(addr)
		.then(async (smart_contract_state) => {
			console.log(JSON.stringify(smart_contract_state));

			const amount_ = new Util.BN(amount);
			const pubkey = zcrypto.getPubKeyFromPrivateKey(tyronzil.adminZilSecretKey);
			
			const zil_account = await tyronzil.API.blockchain.getBalance(tyronzil.admin);
		
			const transition: Transition = {
				_tag: tag,
				_amount: String(amount_),
				_sender: tyronzil.admin,
				params: params
			};

			const tx_object: TxObject = {
				version: tyronzil.zilVersion,
				amount: amount_,
				nonce: Number(zil_account.result.nonce)+ 1,
				gasLimit: tyronzil.gasLimit,
				gasPrice: tyronzil.gasPrice,
				toAddr: addr,
				pubKey: pubkey,
				data: JSON.stringify(transition),
			};
			
			return tyronzil.API.transactions.new(tx_object);
		})
		.then(async (raw_tx: any)  => {
			tyronzil.API.wallet.addByPrivateKey(tyronzil.adminZilSecretKey);
			return await tyronzil.API.wallet.signWith(raw_tx, tyronzil.admin);
		})
		.then(async signed_tx => {
			/** Sends the tyronzil transaction to the Zilliqa blockchain platform */
			return await tyronzil.API.blockchain.createTransaction(signed_tx, 33, 1000);
		})
		.then( async transaction => {
			const tx_id = transaction.id!;
			const transaction_ = await transaction.confirm(tx_id, 33, 1000)
			const status = transaction.isConfirmed();
			if(!status){
				throw new ErrorCode("TyronZIL",`The ${tag} tyronZIL transaction was unsuccessful!`);
			}
			return transaction_;
		})
		.catch((err: any) => { throw err });
		return submit;
	}

	/** Returns a DID Document element as transition parameter */
	public static async documentParameter(
		addr: string,
		element: DocumentElement
	): Promise<TransitionValue> {
		let add: TransitionValue = {
			argtypes: [],
			arguments: [],
			constructor: `${addr}.${Action.Add}`
		};
		let remove: TransitionValue = {
			argtypes: [],
			arguments: [],
			constructor: `${addr}.${Action.Remove}`
		};
		let value: TransitionValue = {
			argtypes: [],
			arguments: [],
			constructor: `${addr}.${element.constructor}`
		};
		switch (element.constructor) {
			case 'VerificationMethod':
				switch (element.action) {
					case Action.Add:
						Object.assign(value, {
							arguments: [
								add,
								`${element.key!.id}`,
								`${element.key!.key}`
							]
						});
						break;
					case Action.Remove:
						Object.assign(value, {
							arguments: [
								remove,
								`${element.key!.id}`,
								"0x024caf04aa4f660db04adf65daf5b993b3383fcdb2ef0479ca8866b1336334b5b4"
							]
						});
						break;
				}
				break;
			case 'Service':
				let endpoint;
				switch (element.service?.endpoint) {
					case 'Uri':
						endpoint = {
							argtypes: [],
							arguments: [
								`${element.service!.type}`,
								{
									argtypes: [],
									arguments: [],
									constructor: `${addr}.${element.service!.transferProtocol}`
								},
								`${element.service!.uri}`
							],
							constructor: `${addr}.Uri`
						};
						break;
					case 'Address':
						endpoint = {
							argtypes: [],
							arguments: [ `${element.service!.address}` ],
							constructor: `${addr}.Address`
						};
						break;
				}
				
				const remove_uri = {
					argtypes: [],
					arguments: [
						`remove`,
						{
							argtypes: [],
							arguments: [],
							constructor: `${addr}.${TransferProtocol.Https}`
						},
						`remove`
					],
					constructor: `${addr}.Uri`
				};
				switch (element.action) {
					case Action.Add:
						Object.assign(value, {
							arguments: [
								add,
								`${element.service!.id}`,
								endpoint
							]
						});
						break;
					case Action.Remove:
						Object.assign(value, {
							arguments: [
								remove,
								`${element.service!.id}`,
								remove_uri
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

	public static async OptionParam(
		option: Option,
		argtype: string,
		args?: any  
	): Promise<any> {
		let value: TransitionValue;
		switch (option) {
			case 'Some':
				value = {
					argtypes: [ `${argtype}` ],
					arguments: [ `${args}` ],
					constructor: 'Some'
				}
				return value;
			case 'None':
				value = {
					argtypes: [ `${argtype}` ],
					arguments: [],
					constructor: 'None'
				}
				return value;
		};
	}

	public static async CrudParams(
		document: string,
		signature: string
	): Promise<TransitionParams[]> {
		
		const params = [];

		const doc: TransitionParams = {
			vname: 'document',
			type: 'Option( List Document )',
			value: document,
		};
		params.push(doc);

		const sig: TransitionParams = {
			vname: 'signature',
			type: 'Option ByStr64',
			value: signature,
		};
		params.push(sig);

		return params;
	}

	public static async GetBeneficiary(addr: string, beneficiary: Beneficiary): Promise<TransitionValue> {
		let beneficiary_ = {
			argtypes: [],
			arguments: [],
			constructor: `${addr}.${beneficiary.constructor}`
		};

		switch (beneficiary.constructor) {
			case 'UserDomain':
				Object.assign(beneficiary_, {
					arguments: [
						beneficiary.username,
						beneficiary.domain
					]
				});
				break;
			case 'BeneficiaryAddr':
				Object.assign(beneficiary_, {
					arguments: [
						beneficiary.addr
					]
				});
				break;
		};
		return beneficiary_;
	}

	public static async Transfer(
		addr: string,
		addrName: string,
		beneficiary: Beneficiary,
		amount: string
	): Promise<TransitionParams[]> {
		
		const params = [];

		const addr_name: TransitionParams = {
			vname: 'addrName',
			type: 'String',
			value: addrName,
		};
		params.push(addr_name);

		const beneficiary__: TransitionParams = {
			vname: 'beneficiary',
			type: 'Beneficiary',
			value: await this.GetBeneficiary(addr, beneficiary)
		};
		params.push(beneficiary__);

		const amount_: TransitionParams = {
			vname: 'amount',
			type: 'Uint128',
			value: amount,
		};
		params.push(amount_);

		return params;
	}

	public static async GetRecoverer(addr: string, recoverer: Recoverer): Promise<TransitionValue> {
		return {
			argtypes: [],
			arguments: [],
			constructor: `${addr}.${recoverer}`
		};
	}

	public static async UpdateSocialRecoverer(
		addr: string,
		recoverer: Recoverer,
		addr1: string
	): Promise<TransitionParams[]> {
		
		const params = [];

		const recoverer__: TransitionParams = {
			vname: 'recoverer',
			type: 'Recoverer',
			value: await this.GetRecoverer(addr, recoverer)
		};
		params.push(recoverer__);

		const addr_: TransitionParams = {
			vname: 'addr',
			type: 'ByStr20',
			value: addr1,
		};
		params.push(addr_);

		return params;
	}

	public static async SocialRecovery(
		addr: string,
		signature1: string,
		signature2: string
	): Promise<TransitionParams[]> {
		
		const params = [];

		const addr_: TransitionParams = {
			vname: 'addr',
			type: 'ByStr20',
			value: addr,
		};
		params.push(addr_);

		const sig1: TransitionParams = {
			vname: 'signature1',
			type: 'ByStr64',
			value: signature1,
		};
		params.push(sig1);
		
		const sig2: TransitionParams = {
			vname: 'signature2',
			type: 'ByStr64',
			value: signature2,
		};
		params.push(sig2);

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
	Transfer = "Transfer",
}

export interface TransitionParams {
	vname: string;
	type: string;
	value: unknown;
}

export interface TransitionValue {
	argtypes: any[];
	arguments: any[];
	constructor: string;
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
	some = 'Some',
	none = 'None'
}

export enum Recoverer {
	first = 'First',
	second = 'Second'
}

export enum BeneficiaryConstructor {
	domain = 'UserDomain',
	addr = 'BeneficiaryAddr'
}

export interface Beneficiary {
	constructor: BeneficiaryConstructor,
	username?: string,
	domain?: string,
	addr?: string
}
