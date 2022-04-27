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

export default class Currency {
  public static tyron(currency: String, input: number) {
    let txID = "Transfer";
    let amount = 0;

    switch (currency.toLowerCase()) {
      case "zil":
        txID = "SendFunds";
        amount = input * 1e12;
        break;
      case "tyron":
        amount = input * 1e12;
        break;
      case "xcad":
        amount = input * 1e18;
        break;
      case "xsgd":
        amount = input * 1e6;
        break;
      case "port":
        amount = input * 1e4;
        break;
      case "gzil":
        amount = input * 1e15;
        break;
      case "swth":
        amount = input * 1e8;
        break;
      case "lunr":
        amount = input * 1e4;
        break;
      case "carb":
        amount = input * 1e8;
        break;
      case "zwap":
        amount = input * 1e12;
        break;
      case "zusdt":
        amount = input * 1e6;
        break;
      case "sco":
        amount = input * 1e4;
        break;
      case "xidr":
        amount = input * 1e6;
        break;
      case "zwbtc":
        amount = input * 1e8;
        break;
      case "zeth":
        amount = input * 1e18;
        break;
      case "fees":
        amount = input * 1e4;
        break;
      case "blox":
        amount = input * 1e2;
        break;
    }

    const res = {
      txID,
      amount,
    };

    return res;
  }
}
