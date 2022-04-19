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

import * as tyronzil from "../../blockchain/tyronzil";
import {
  Action,
  DocumentConstructor,
  DocumentElement,
  ServiceModel,
} from "../protocols/models/document-model";
import hash from "hash.js";
import * as zutil from "@zilliqa-js/util";

/** Generates a `DID CRUD` operation
 *  which produces the `DID Document` & metadata */
export default class DidCrud {
  public readonly txParams: tyronzil.TransitionParams[];

  private constructor(operation: CrudOperationModel) {
    this.txParams = operation.txParams;
  }

  public static async GetServices(
    addr: string,
    services: ServiceModel[]
  ): Promise<[DocumentElement[], tyronzil.TransitionValue[]]> {
    let doc_elements: DocumentElement[] = [];
    let doc_parameters: tyronzil.TransitionValue[] = [];

    for (const service of services) {
      const doc_element: DocumentElement = {
        constructor: DocumentConstructor.Service,
        action: Action.Add,
        service: service,
      };
      doc_elements.push(doc_element);
      const doc_parameter = await tyronzil.default.documentParameter(
        addr,
        doc_element
      );
      doc_parameters.push(doc_parameter);
    }

    return [doc_elements, doc_parameters];
  }

  public static async Create(input: InputModel): Promise<DidCrud> {
    const services_ = await this.GetServices(input.addr, input.services!);
    const document = input.verificationMethods.concat(services_[1]);

    const tx_params = await tyronzil.default.CrudParams(
      input.addr,
      document!,
      await tyronzil.default.OptionParam(tyronzil.Option.none, "ByStr64"),
      input.tyron_
    );

    const operation_output: CrudOperationModel = {
      txParams: tx_params,
    };
    return new DidCrud(operation_output);
  }

  public static async HashDocument(
    document: DocumentElement[]
  ): Promise<String> {
    let hash_ = "0000000000000000000000000000000000000000";
    for (const element of document) {
      let action_;
      switch (element.action) {
        case Action.Add:
          action_ = "add";
          break;
        case Action.Remove:
          action_ = "remove";
          break;
      }
      const h1 = hash.sha256().update(action_).digest("hex");
      let h2;
      let h3;
      let hash__;
      switch (element.constructor) {
        case DocumentConstructor.VerificationMethod:
          h2 = hash.sha256().update(element.key?.id).digest("hex");
          switch (element.action) {
            case Action.Add:
              h3 = hash
                .sha256()
                .update(
                  zutil.bytes.hexToByteArray(element.key!.key!.substring(2))
                )
                .digest("hex");
              const h4 = hash
                .sha256()
                .update(element.key?.encrypted)
                .digest("hex");
              hash__ = h1 + h2 + h3 + h4;
              break;
            case Action.Remove:
              hash__ = h1 + h2;
              break;
          }
          break;
        case DocumentConstructor.Service:
          h2 = hash.sha256().update(element.service!.id).digest("hex");
          switch (element.action) {
            case Action.Add:
              switch (element.service!.endpoint) {
                case "Address":
                  h3 = hash
                    .sha256()
                    .update(
                      zutil.bytes.hexToByteArray(
                        element.service!.val!.substring(2)
                      )
                    )
                    .digest("hex");
                  break;
                case "Uri":
                  h3 = hash.sha256().update(element.service!.val).digest("hex");
                  break;
              }
              hash__ = h1 + h2 + h3;
              break;
            case Action.Remove:
              hash__ = h1 + h2;
              break;
          }
          break;
      }
      hash_ = hash_ + hash__;
    }
    return hash_;
  }

  public static async Recover(input: InputModel): Promise<DidCrud> {
    const services_ = await this.GetServices(input.addr, input.services!);
    const document = input.verificationMethods.concat(services_[1]);

    const tx_params = await tyronzil.default.CrudParams(
      input.addr,
      document!,
      await tyronzil.default.OptionParam(
        tyronzil.Option.some,
        "ByStr64",
        "0x" + input.signature
      ),
      input.tyron_
    );

    const operation_output: CrudOperationModel = {
      txParams: tx_params,
    };
    return new DidCrud(operation_output);
  }

  public static async Deactivate(
    input: DeactivateInputModel
  ): Promise<DidCrud> {
    const deactivate_element: DocumentElement = {
      constructor: DocumentConstructor.Service,
      action: Action.Remove,
      service: { id: "deactivate" },
    };
    const document = await tyronzil.default.documentParameter(
      input.addr,
      deactivate_element
    );

    const tx_params = await tyronzil.default.CrudParams(
      input.addr,
      [document],
      await tyronzil.default.OptionParam(
        tyronzil.Option.some,
        "ByStr64",
        input.signature
      ),
      input.tyron_
    );

    const operation_output: CrudOperationModel = {
      txParams: tx_params,
    };
    return new DidCrud(operation_output);
  }
}

/** Defines output data for a DID CRUD operation */
interface CrudOperationModel {
  txParams: tyronzil.TransitionParams[];
}

// @TODO verify username
export interface InputModel {
  addr: string;
  verificationMethods: tyronzil.TransitionValue[];
  services?: ServiceModel[];
  signature?: string;
  tyron_: tyronzil.TransitionValue;
}

/** Defines input data for a `DID Deactivate` operation */
export interface DeactivateInputModel {
  addr: string;
  signature: string;
  tyron_: tyronzil.TransitionValue;
}
