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

import * as zcrypto from "@zilliqa-js/crypto";

export default class Address {
    public static verification(address: string) {
      try {
        zcrypto.fromBech32Address(address);
        return true;
      } catch (error) {
        try {
          zcrypto.toChecksumAddress(address);
          return true;
        } catch {
          return false;
        }
      }
    }
  }
  