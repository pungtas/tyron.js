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
  public static tyron(currency: String, input?: number) {
    let txID = "Transfer";
    let amount = 0;
    let decimals = 0;

    switch (currency.toLowerCase()) {
      case "tyron":
        decimals = 1e12;
        amount = input! * decimals;
        break;
      case "$si":
        decimals = 1e12;
        amount = input! * decimals;
        break;
      case "zil":
        txID = "SendFunds";
        decimals = 1e12;
        amount = input! * decimals;
        break;
      case "gzil":
        decimals = 1e15;
        amount = input! * decimals;
        break;
      case "zusdt":
        decimals = 1e6;
        amount = input! * decimals;
        break;
      case "xsgd":
        decimals = 1e6;
        amount = input! * decimals;
        break;
      case "xidr":
        decimals = 1e6;
        amount = input! * decimals;
        break;
      case "zwbtc":
        decimals = 1e8;
        amount = input! * decimals;
        break;
      case "zeth":
        decimals = 1e18;
        amount = input! * decimals;
        break;
      case "xcad":
        decimals = 1e18;
        amount = input! * decimals;
        break;
      case "lunr":
        decimals = 1e4;
        amount = input! * decimals;
        break;
      case "zwap":
        decimals = 1e12;
        amount = input! * decimals;
        break;
      case "swth":
        decimals = 1e8;
        amount = input! * decimals;
        break;
      case "port":
        decimals = 1e4;
        amount = input! * decimals;
        break;
      case "sco":
        decimals = 1e4;
        amount = input! * decimals;
        break;
      case "fees":
        decimals = 1e4;
        amount = input! * decimals;
        break;
      case "carb":
        decimals = 1e8;
        amount = input! * decimals;
        break;
      case "blox":
        decimals = 1e2;
        amount = input! * decimals;
        break;
    }

    const res = {
      txID,
      amount,
      decimals
    };

    return res;
  }
}
