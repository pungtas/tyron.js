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
GNU General Public License for more details.*/

import {
    PatchModel,
    PatchAction,
    Action,
    DocumentElement,
    ServiceModel,
    DocumentConstructor,
} from './models/document-model'
import { PublicKeyModel } from './models/verification-method-models'
import ErrorCode from '../util/ErrorCode'
import TyronZIL, { TransitionValue } from '../../blockchain/tyronzil'
import tyronzil from '../../blockchain/tyronzil'

/** Operation types */
export enum DIDStatus {
    Deployed = 'Deployed',
    Created = 'Created',
    Recovered = 'Recovered',
    Updated = 'Updated',
    Deactivated = 'Deactivated',
    Locked = 'Locked',
}

export class Sidetree {
    public static async processPatches(
        addr: string,
        patches: PatchModel[]
    ): Promise<{
        documentElements: DocumentElement[]
        updateDocument: TransitionValue[]
    }> {
        const doc_elements: DocumentElement[] = []
        const update_document = []

        for (const patch of patches) {
            switch (patch.action) {
                case PatchAction.RemoveKeys:
                    if (patch.ids !== undefined) {
                        for (const id of patch.ids) {
                            const key_: PublicKeyModel = {
                                id: id,
                            }
                            const doc_element: DocumentElement = {
                                constructor:
                                    DocumentConstructor.VerificationMethod,
                                action: Action.Remove,
                                key: key_,
                            }
                            doc_elements.push(doc_element)
                            const doc_parameter =
                                await TyronZIL.documentParameter(
                                    addr,
                                    doc_element
                                )
                            update_document.push(doc_parameter)
                        }
                    }
                    break
                case PatchAction.AddServices:
                    if (patch.services !== undefined) {
                        for (const service of patch.services) {
                            const doc_element: DocumentElement = {
                                constructor: DocumentConstructor.Service,
                                action: Action.Add,
                                service: service,
                            }
                            doc_elements.push(doc_element)
                            const doc_parameter =
                                await tyronzil.documentParameter(
                                    addr,
                                    doc_element
                                )
                            update_document.push(doc_parameter)
                        }
                    } else {
                        throw new ErrorCode(
                            'Missing',
                            'No services given to add'
                        )
                    }
                    break
                case PatchAction.RemoveServices:
                    if (patch.ids !== undefined) {
                        for (const id of patch.ids) {
                            const service: ServiceModel = { id: id }
                            const doc_element: DocumentElement = {
                                constructor: DocumentConstructor.Service,
                                action: Action.Remove,
                                service,
                            }
                            doc_elements.push(doc_element)
                            const doc_parameter =
                                await TyronZIL.documentParameter(
                                    addr,
                                    doc_element
                                )
                            update_document.push(doc_parameter)
                        }
                    } else {
                        throw new ErrorCode(
                            'Missing',
                            'No service ID given to remove'
                        )
                    }
                    break
                default:
                    throw new ErrorCode(
                        'CodeIncorrectPatchAction',
                        'The chosen action is not valid.'
                    )
            }
        }
        return {
            documentElements: doc_elements,
            updateDocument: update_document,
        }
    }
}
