/*
tyron.js: SSI Protocol's JavaScript/TypeScript library
Self-Sovereign Identity Protocol
Copyright (C) Tyron Pungtas and its affiliates.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.*/

import { Transaction } from '@zilliqa-js/account'
import { Contract } from '@zilliqa-js/contract'
import * as zcrypto from '@zilliqa-js/crypto'
import * as zutil from '@zilliqa-js/util'
import ZilliqaInit from './zilliqa-init'
import { NetworkNamespace } from '../did/tyronzil-schemes/did-scheme'
import ErrorCode from '../did/util/ErrorCode'
import {
    Action,
    DocumentElement,
    TransferProtocol,
} from '../did/protocols/models/document-model'
import Util from './util'

/** tyronzil transaction class */
export default class TyronZIL extends ZilliqaInit {
    public readonly controller: string
    public readonly controllerSecretKey: string
    public readonly gasPrice: zutil.BN
    public readonly gasLimit: zutil.Long
    public readonly tyron: string

    private constructor(
        network: NetworkNamespace,
        controller: string,
        controllerSecretKey: string,
        gasPrice: zutil.BN,
        gasLimit: zutil.Long,
        init_tyron: string
    ) {
        super(network)
        this.controller = controller
        this.controllerSecretKey = controllerSecretKey
        this.gasPrice = gasPrice
        this.gasLimit = gasLimit
        this.tyron = init_tyron
    }

    /** Retrieves the minimum gas price & validates the account info */
    public static async initialize(
        network: NetworkNamespace,
        controllerSecretKey: string,
        gasLimit: number,
        tyron: string
    ): Promise<TyronZIL> {
        const controller = zcrypto.getAddressFromPrivateKey(controllerSecretKey)
        const gas_limit: zutil.Long.Long = new zutil.Long(gasLimit)
        const zil_init = new ZilliqaInit(network)

        const transaction_init = await zil_init.API.blockchain
            .getMinimumGasPrice()
            .then((min_gas_price: { result: any }) => {
                const gas_price = new zutil.BN(min_gas_price.result)
                return new TyronZIL(
                    network,
                    controller,
                    controllerSecretKey,
                    gas_price,
                    gas_limit,
                    tyron
                )
            })
            .catch((err: any) => {
                throw err
            })
        return transaction_init
    }

    public static async deploy(
        contractInit: any[],
        tyronzil: TyronZIL,
        contractCode: string
    ): Promise<DeployedContract> {
        const smart_contract = tyronzil.API.contracts.new(
            contractCode,
            contractInit
        )

        tyronzil.API.wallet.addByPrivateKey(tyronzil.controllerSecretKey)

        const deployed_contract = await tyronzil.API.blockchain
            .getBalance(tyronzil.controller)
            .then(async (account) => {
                const [deployTx, contract] = await smart_contract.deploy(
                    {
                        version: tyronzil.zilVersion,
                        gasPrice: tyronzil.gasPrice,
                        gasLimit: tyronzil.gasLimit,
                        nonce: Number(account.result.nonce) + 1,
                    },
                    33,
                    1000,
                    false
                )
                const is_deployed = deployTx.isConfirmed()
                if (!is_deployed) {
                    throw new ErrorCode(
                        'Wrong-Deployment',
                        'The contract did not get deployed.'
                    )
                }

                const deployment_gas = deployTx.getReceipt()!.cumulative_gas

                const deployed_contract: DeployedContract = {
                    transaction: deployTx,
                    contract: contract,
                    gas: deployment_gas,
                }
                return deployed_contract
            })
            .catch((err) => {
                throw err
            })
        return deployed_contract
    }

    /** Submits a tyronzil transaction */
    public static async submit(
        tag: string,
        tyronzil: TyronZIL,
        addr: string,
        amount: string,
        params: TransitionParams[] | []
    ): Promise<Transaction> {
        const submit = await tyronzil.API.blockchain
            .getSmartContractState(addr)
            .then(async (_smart_contract_state) => {
                //@to-do throw error if status is Deactivated

                const amount_ = new zutil.BN(amount)
                const pubkey = zcrypto.getPubKeyFromPrivateKey(
                    tyronzil.controllerSecretKey
                )
                const zil_account = await tyronzil.API.blockchain.getBalance(
                    tyronzil.controller
                )

                const transition: Transition = {
                    _tag: tag,
                    _amount: String(amount_),
                    _sender: tyronzil.controller,
                    params: params,
                }

                const tx_object: TxObject = {
                    version: tyronzil.zilVersion,
                    amount: amount_,
                    nonce: Number(zil_account.result.nonce) + 1,
                    gasLimit: tyronzil.gasLimit,
                    gasPrice: tyronzil.gasPrice,
                    toAddr: addr,
                    pubKey: pubkey,
                    data: JSON.stringify(transition),
                }

                return tyronzil.API.transactions.new(tx_object)
            })
            .then(async (raw_tx: any) => {
                tyronzil.API.wallet.addByPrivateKey(
                    tyronzil.controllerSecretKey
                )
                return await tyronzil.API.wallet.signWith(
                    raw_tx,
                    tyronzil.controller
                )
            })
            .then(async (signed_tx) => {
                /** Sends the tyronzil transaction to the Zilliqa blockchain platform */
                return await tyronzil.API.blockchain.createTransaction(
                    signed_tx,
                    33,
                    1000
                )
            })
            .then(async (transaction) => {
                const tx_id = transaction.id!
                const transaction_ = await transaction.confirm(tx_id, 33, 1000)
                const status = transaction.isConfirmed()
                if (!status) {
                    throw new ErrorCode(
                        'TyronZIL',
                        `The ${tag} tyronZIL transaction was unsuccessful!`
                    )
                }
                return transaction_
            })
            .catch((err: any) => {
                throw err
            })
        return submit
    }

    /** Returns a DID Document element as transition parameter */
    public static async documentParameter(
        addr: string,
        element: DocumentElement
    ): Promise<TransitionValue> {
        const add: TransitionValue = {
            argtypes: [],
            arguments: [],
            constructor: `${addr.toLowerCase()}.${Action.Add}`,
        }
        const remove: TransitionValue = {
            argtypes: [],
            arguments: [],
            constructor: `${addr.toLowerCase()}.${Action.Remove}`,
        }
        const value: TransitionValue = {
            argtypes: [],
            arguments: [],
            constructor: `${addr.toLowerCase()}.${element.constructor}`,
        }
        switch (element.constructor) {
            case 'VerificationMethod':
                switch (element.action) {
                    case Action.Add:
                        Object.assign(value, {
                            arguments: [
                                add,
                                `${element.key!.id}`,
                                `${element.key!.key}`,
                                `${element.key!.encrypted}`,
                            ],
                        })
                        break
                    case Action.Remove:
                        Object.assign(value, {
                            arguments: [
                                remove,
                                `${element.key!.id}`,
                                '0x024caf04aa4f660db04adf65daf5b993b3383fcdb2ef0479ca8866b1336334b5b4',
                                'none',
                            ],
                        })
                        break
                }
                break
            case 'Service':
                let endpoint
                switch (element.service!.endpoint) {
                    case 'Address':
                        endpoint = {
                            argtypes: [],
                            arguments: [
                                {
                                    argtypes: [],
                                    arguments: [`${element.service!.val}`],
                                    constructor: `${addr.toLowerCase()}.${
                                        element.service!.blockchainType
                                    }`,
                                },
                            ],
                            constructor: `${addr.toLowerCase()}.Address`,
                        }
                        break
                    case 'Uri':
                        endpoint = {
                            argtypes: [],
                            arguments: [
                                `${element.service!.type}`,
                                {
                                    argtypes: [],
                                    arguments: [],
                                    constructor: `${addr.toLowerCase()}.${
                                        element.service!.transferProtocol
                                    }`,
                                },
                                `${element.service!.val}`,
                            ],
                            constructor: `${addr.toLowerCase()}.Uri`,
                        }
                        break
                }

                const remove_uri = {
                    argtypes: [],
                    arguments: [
                        `remove`,
                        {
                            argtypes: [],
                            arguments: [],
                            constructor: `${addr.toLowerCase()}.${
                                TransferProtocol.Https
                            }`,
                        },
                        `remove`,
                    ],
                    constructor: `${addr.toLowerCase()}.Uri`,
                }
                switch (element.action) {
                    case Action.Add:
                        Object.assign(value, {
                            arguments: [
                                add,
                                `${element.service!.id}`,
                                endpoint,
                            ],
                        })
                        break
                    case Action.Remove:
                        Object.assign(value, {
                            arguments: [
                                remove,
                                `${element.service!.id}`,
                                remove_uri,
                            ],
                        })
                        break
                }
                break
            default:
                throw new ErrorCode(
                    'UnsupportedElement',
                    'That is not a DID-Document supported element'
                )
        }
        return value
    }

    public static async OptionParam(
        option: Option,
        argtype: string,
        args?: any
    ): Promise<TransitionValue> {
        let value: TransitionValue
        switch (option) {
            case Option.some:
                value = {
                    argtypes: [`${argtype}`],
                    arguments: [args],
                    constructor: 'Some',
                }
                break
            case Option.none:
                value = {
                    argtypes: [`${argtype}`],
                    arguments: [],
                    constructor: 'None',
                }
                break
        }
        return value
    }

    public static async CrudParams(
        addr: string,
        document: TransitionValue[],
        signature: any,
        tyron: TransitionValue
    ): Promise<TransitionParams[]> {
        const params = []

        const doc: TransitionParams = {
            vname: 'document',
            type: `List ${addr.toLowerCase()}.Document`,
            value: document,
        }
        params.push(doc)

        const sig: TransitionParams = {
            vname: 'signature',
            type: 'Option ByStr64',
            value: signature,
        }
        params.push(sig)

        const tyron_: TransitionParams = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron,
        }
        params.push(tyron_)

        return params
    }

    public static async BuyNftUsername(
        username: string,
        addr: TransitionValue,
        id: string,
        tyron: TransitionValue
    ): Promise<TransitionParams[]> {
        const params = []

        const domainId = '0x' + (await Util.HashString(username))
        const username_: TransitionParams = {
            vname: 'username',
            type: 'String',
            value: domainId,
        }
        params.push(username_)
        const addr_: TransitionParams = {
            vname: 'addr',
            type: 'Option ByStr20',
            value: addr,
        }
        params.push(addr_)
        const id_: TransitionParams = {
            vname: 'id',
            type: 'String',
            value: id,
        }
        params.push(id_)
        const tyron_: TransitionParams = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron,
        }
        params.push(tyron_)
        return params
    }

    public static async TransferNftUsername(
        username: string,
        guardianship: TransitionValue,
        id: string,
        addr: string,
        dID: string,
        tyron: TransitionValue,
        docVersion: any
    ): Promise<TransitionParams[]> {
        const params = []

        const domainId = '0x' + (await Util.HashString(username))
        const username_: TransitionParams = {
            vname: 'username',
            type: 'String',
            value: domainId,
        }
        params.push(username_)

        const id_: TransitionParams = {
            vname: 'id',
            type: 'String',
            value: id,
        }
        params.push(id_)

        if (Number(docVersion.slice(8, 9)) < 5) {
            const addr_: TransitionParams = {
                vname: 'newAddr',
                type: 'ByStr20',
                value: addr,
            }
            params.push(addr_)

            const guardianship_: TransitionParams = {
                vname: 'guardianship',
                type: 'Option ByStr20',
                value: guardianship,
            }
            params.push(guardianship_)

            if (
                (Number(docVersion.slice(8, 9)) >= 4 &&
                    Number(docVersion.slice(10, 11)) <= 6) ||
                docVersion.slice(0, 3) === 'dao'
            ) {
                const amount_: TransitionParams = {
                    vname: 'amount',
                    type: 'Uint128',
                    value: '0',
                }
                params.push(amount_)
            }
        } else {
            const addr_: TransitionParams = {
                vname: 'addr',
                type: 'ByStr20',
                value: addr,
            }
            params.push(addr_)

            const dID_: TransitionParams = {
                vname: 'dID',
                type: 'ByStr20',
                value: dID,
            }
            params.push(dID_)
        }

        const tyron_: TransitionParams = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron,
        }
        params.push(tyron_)

        return params
    }

    public static async GetBeneficiary(
        addr: string,
        beneficiary: Beneficiary
    ): Promise<TransitionValue> {
        const beneficiary_ = {
            argtypes: [],
            arguments: [],
            constructor: `${addr.toLowerCase()}.${beneficiary.constructor}`,
        }

        switch (beneficiary.constructor) {
            case 'NftUsername':
                Object.assign(beneficiary_, {
                    arguments: [beneficiary.username, beneficiary.domain],
                })
                break
            case 'Recipient':
                Object.assign(beneficiary_, {
                    arguments: [beneficiary.addr],
                })
                break
        }
        return beneficiary_
    }

    public static async Transfer(
        addr: string,
        addrName: string,
        beneficiary: Beneficiary,
        amount: string,
        tyron: TransitionValue
    ): Promise<TransitionParams[]> {
        const params = []

        const addr_name: TransitionParams = {
            vname: 'addrName',
            type: 'String',
            value: addrName,
        }
        params.push(addr_name)

        const beneficiary__: TransitionParams = {
            vname: 'beneficiary',
            type: `${addr.toLowerCase()}.Beneficiary`,
            value: await this.GetBeneficiary(addr, beneficiary),
        }
        params.push(beneficiary__)

        const amount_: TransitionParams = {
            vname: 'amount',
            type: 'Uint128',
            value: amount,
        }
        params.push(amount_)

        const tyron_: TransitionParams = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron,
        }
        params.push(tyron_)

        return params
    }

    public static async SendFunds(
        addr: string,
        tag: string,
        beneficiary: Beneficiary,
        amount: string,
        tyron: TransitionValue
    ): Promise<TransitionParams[]> {
        const params = []
        const tag_: TransitionParams = {
            vname: 'tag',
            type: 'String',
            value: tag,
        }
        params.push(tag_)

        const beneficiary__: TransitionParams = {
            vname: 'beneficiary',
            type: `${addr.toLowerCase()}.Beneficiary`,
            value: await this.GetBeneficiary(addr, beneficiary),
        }
        params.push(beneficiary__)

        const amount_: TransitionParams = {
            vname: 'amount',
            type: 'Uint128',
            value: amount,
        }
        params.push(amount_)

        const tyron_: TransitionParams = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron,
        }
        params.push(tyron_)

        return params
    }

    public static async NftTransfer(
        addr: string,
        beneficiary: Beneficiary
    ): Promise<TransitionParams[]> {
        const params = []

        const beneficiary__: TransitionParams = {
            vname: 'beneficiary',
            type: `${addr.toLowerCase()}.Beneficiary`,
            value: await this.GetBeneficiary(addr, beneficiary),
        }
        params.push(beneficiary__)
        return params
    }

    public static async ConfigureSocialRecovery(
        guardians: string[],
        sig: string,
        tyron: TransitionValue
    ): Promise<TransitionParams[]> {
        const params = []

        const guardians_: TransitionParams = {
            vname: 'guardians',
            type: 'List ByStr32',
            value: guardians,
        }
        params.push(guardians_)

        const sig_: TransitionParams = {
            vname: 'sig',
            type: 'ByStr64',
            value: sig,
        }
        params.push(sig_)

        const tyron_: TransitionParams = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron,
        }
        params.push(tyron_)

        return params
    }

    public static async Guardians(
        guardians: string[],
        tyron: TransitionValue
    ): Promise<TransitionParams[]> {
        const params = []

        const guardians_: TransitionParams = {
            vname: 'guardians',
            type: 'List ByStr32',
            value: guardians,
        }
        params.push(guardians_)

        const tyron_: TransitionParams = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron,
        }
        params.push(tyron_)

        return params
    }

    public static async GetRecoverer(
        addr: string,
        recoverer: Recoverer
    ): Promise<TransitionValue> {
        return {
            argtypes: [],
            arguments: [],
            constructor: `${addr.toLowerCase()}.${recoverer}`,
        }
    }

    public static async UpdateSocialRecoverer(
        addr: string,
        recoverer: Recoverer,
        addr1: string
    ): Promise<TransitionParams[]> {
        const params = []

        const recoverer__: TransitionParams = {
            vname: 'recoverer',
            type: `${addr.toLowerCase()}.Recoverer`,
            value: await this.GetRecoverer(addr, recoverer),
        }
        params.push(recoverer__)

        const addr_: TransitionParams = {
            vname: 'addr',
            type: 'ByStr20',
            value: addr1,
        }
        params.push(addr_)

        return params
    }

    public static async SocialRecovery(
        addr: string,
        signature1: string,
        signature2: string
    ): Promise<TransitionParams[]> {
        const params = []

        const addr_: TransitionParams = {
            vname: 'addr',
            type: 'ByStr20',
            value: addr,
        }
        params.push(addr_)

        const sig1: TransitionParams = {
            vname: 'signature1',
            type: 'ByStr64',
            value: signature1,
        }
        params.push(sig1)

        const sig2: TransitionParams = {
            vname: 'signature2',
            type: 'ByStr64',
            value: signature2,
        }
        params.push(sig2)

        return params
    }

    public static async TxAddr(addr: string): Promise<TransitionParams[]> {
        const params = []
        const addr_: TransitionParams = {
            vname: 'addr',
            type: 'ByStr20',
            value: addr,
        }
        params.push(addr_)
        return params
    }

    public static async TxAmount(amount: string): Promise<TransitionParams[]> {
        const params = []
        const amount_: TransitionParams = {
            vname: 'amount',
            type: 'Uint128',
            value: amount,
        }
        params.push(amount_)
        return params
    }

    public static async AddWork(
        addr: string,
        transferProtocol: TransferProtocol,
        uri: string,
        amount: string
    ): Promise<TransitionParams[]> {
        const params = []

        const tprotocol = {
            argtypes: [],
            arguments: [],
            constructor: `${addr.toLowerCase()}.${transferProtocol}`,
        }
        const transfer_protocol = {
            vname: 'transferProtocol',
            type: `${addr.toLowerCase()}.TransferProtocol`,
            value: tprotocol,
        }
        params.push(transfer_protocol)

        const uri_: TransitionParams = {
            vname: 'uri',
            type: 'String',
            value: uri,
        }
        params.push(uri_)

        const amount_: TransitionParams = {
            vname: 'amount',
            type: 'Uint128',
            value: amount,
        }
        params.push(amount_)
        return params
    }

    public static async AssessPerformance(
        commit: string,
        amount: string
    ): Promise<TransitionParams[]> {
        const params = []

        const commit_: TransitionParams = {
            vname: 'commit',
            type: 'ByStr32',
            value: commit,
        }
        params.push(commit_)

        const amount_: TransitionParams = {
            vname: 'amount',
            type: 'Uint128',
            value: amount,
        }
        params.push(amount_)
        return params
    }

    public static async RemoveService(
        commit: string
    ): Promise<TransitionParams[]> {
        const params = []
        const commit_: TransitionParams = {
            vname: 'commit',
            type: 'ByStr32',
            value: commit,
        }
        params.push(commit_)
        return params
    }

    public static async Dns(
        addr: string,
        domain: string,
        didKey: string,
        encrypted: string,
        tyron: TransitionValue
    ): Promise<TransitionParams[]> {
        const params = []
        const addr_: TransitionParams = {
            vname: 'addr',
            type: 'ByStr20',
            value: addr,
        }
        params.push(addr_)
        const did_key: TransitionParams = {
            vname: 'didKey',
            type: 'ByStr33',
            value: didKey,
        }
        params.push(did_key)
        const encrypted_: TransitionParams = {
            vname: 'encrypted',
            type: 'String',
            value: encrypted,
        }
        params.push(encrypted_)
        const domain_: TransitionParams = {
            vname: 'domain',
            type: 'String',
            value: domain,
        }
        params.push(domain_)
        const tyron_: TransitionParams = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron,
        }
        params.push(tyron_)
        return params
    }

    public static async AddFunds(
        to: string,
        amount: string
    ): Promise<TransitionParams[]> {
        const params = []
        const to_: TransitionParams = {
            vname: 'to',
            type: 'ByStr20',
            value: to,
        }
        params.push(to_)
        const amount_: TransitionParams = {
            vname: 'amount',
            type: 'Uint128',
            value: amount,
        }
        params.push(amount_)
        return params
    }

    // @todo-i add versioning into DidSocialRecovery to merge with DidSocialRecover
    public static async DidSocialRecovery(
        addr: string,
        signatures: any,
        tyron: TransitionValue
    ): Promise<TransitionParams[]> {
        const params = []
        const addr_: TransitionParams = {
            vname: 'addr',
            type: 'ByStr20',
            value: addr,
        }
        params.push(addr_)
        const signatures_: TransitionParams = {
            vname: 'signatures',
            type: 'List( Pair String ByStr64 )',
            value: signatures,
        }
        params.push(signatures_)
        const tyron_: TransitionParams = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron,
        }
        params.push(tyron_)
        return params
    }

    public static async DidSocialRecover(
        addr: string,
        signatures: any,
        tyron: TransitionValue
    ): Promise<TransitionParams[]> {
        const params = []
        const addr_: TransitionParams = {
            vname: 'addr',
            type: 'ByStr20',
            value: addr,
        }
        params.push(addr_)
        const signatures_: TransitionParams = {
            vname: 'signatures',
            type: 'List( Pair ByStr32 ByStr64 )',
            value: signatures,
        }
        params.push(signatures_)
        const tyron_: TransitionParams = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron,
        }
        params.push(tyron_)
        return params
    }

    public static async Allowances(
        addrName: string,
        spender: string,
        amount: string,
        tyron: TransitionValue
    ): Promise<TransitionParams[]> {
        const params = []
        const addrName_: TransitionParams = {
            vname: 'addrName',
            type: 'String',
            value: addrName,
        }
        params.push(addrName_)
        const spender_: TransitionParams = {
            vname: 'spender',
            type: 'ByStr20',
            value: spender,
        }
        params.push(spender_)
        const amount_: TransitionParams = {
            vname: 'amount',
            type: 'Uint128',
            value: amount,
        }
        params.push(amount_)
        const tyron_: TransitionParams = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron,
        }
        params.push(tyron_)
        return params
    }

    public static async Lock(
        signature: string,
        tyron: TransitionValue
    ): Promise<TransitionParams[]> {
        const params = []
        const signature_: TransitionParams = {
            vname: 'signature',
            type: 'ByStr64',
            value: signature,
        }
        params.push(signature_)
        const tyron_: TransitionParams = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron,
        }
        params.push(tyron_)
        return params
    }

    public static async Treasury(
        username: string,
        signature: string
    ): Promise<TransitionParams[]> {
        const params = []
        const username_: TransitionParams = {
            vname: 'username',
            type: 'String',
            value: username,
        }
        params.push(username_)
        const signature_: TransitionParams = {
            vname: 'signature',
            type: 'ByStr64',
            value: signature,
        }
        params.push(signature_)
        return params
    }

    public static async Ivms101(
        issuerName: string,
        message: string,
        userSignature: TransitionValue,
        tyron: TransitionValue
    ): Promise<TransitionParams[]> {
        const params = []
        const issuerName_: TransitionParams = {
            vname: 'issuerName',
            type: 'String',
            value: issuerName,
        }
        params.push(issuerName_)
        const message_: TransitionParams = {
            vname: 'message',
            type: 'String',
            value: message,
        }
        params.push(message_)
        const userSignature_: TransitionParams = {
            vname: 'userSignature',
            type: 'Option ByStr64',
            value: userSignature,
        }
        params.push(userSignature_)
        const tyron_: TransitionParams = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: tyron,
        }
        params.push(tyron_)
        return params
    }

    public static async VerifiableCredential(
        issuerName: string,
        issuerDomain: string,
        issuerSignature: string
    ): Promise<TransitionParams[]> {
        const params = []
        const issuerName_: TransitionParams = {
            vname: 'issuerName',
            type: 'String',
            value: issuerName,
        }
        params.push(issuerName_)
        const issuerDomain_: TransitionParams = {
            vname: 'issuerDomain',
            type: 'String',
            value: issuerDomain,
        }
        params.push(issuerDomain_)
        const issuerSignature_: TransitionParams = {
            vname: 'issuerSignature',
            type: 'ByStr64',
            value: issuerSignature,
        }
        params.push(issuerSignature_)
        return params
    }
}

/** The result of a contract deployment */
export interface DeployedContract {
    transaction: Transaction
    contract: Contract
    gas: any
}

interface Transition {
    _tag: string // transition to be invoked
    _amount: string // number of QA to be transferred
    _sender: string // address of the invoker
    params?: TransitionParams[] // an array of parameter objects
}

export interface TransitionParams {
    vname: string
    type: string
    value: unknown
}

export interface TransitionValue {
    argtypes: any[]
    arguments: any[]
    constructor: string
}

interface TxObject {
    version: number
    amount: zutil.BN
    nonce: number
    gasLimit: zutil.Long
    gasPrice: zutil.BN
    toAddr: string
    pubKey: string
    code?: string
    data?: string
    priority?: boolean
}

export enum Option {
    some = 'Some',
    none = 'None',
}

export enum Recoverer {
    first = 'First',
    second = 'Second',
}

export enum BeneficiaryConstructor {
    NftUsername = 'NftUsername',
    Recipient = 'Recipient',
}

export interface Beneficiary {
    constructor: BeneficiaryConstructor
    username?: string
    domain?: string
    addr?: string
}
