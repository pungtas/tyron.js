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
        let txID = 'Transfer'
        let amount = 0
        let decimals = 0

        //@tokens
        switch (currency.toLowerCase()) {
            case 'tyrons$i':
                decimals = 1e18
                amount = input! * decimals
                break
            case 'tyron':
                decimals = 1e12
                amount = input! * decimals
                break
            case 's$i':
                decimals = 1e18
                amount = input! * decimals
                break
            case 'zil':
                txID = 'SendFunds'
                decimals = 1e12
                amount = input! * decimals
                break
            case 'stzil':
                decimals = 1e12
                amount = input! * decimals
                break
            case 'gzil':
                decimals = 1e15
                amount = input! * decimals
                break
            case 'xsgd':
                decimals = 1e6
                amount = input! * decimals
                break
            case 'xidr':
                decimals = 1e6
                amount = input! * decimals
                break
            case 'zusdt':
                decimals = 1e6
                amount = input! * decimals
                break
            case 'zwbtc':
                decimals = 1e8
                amount = input! * decimals
                break
            case 'zeth':
                decimals = 1e18
                amount = input! * decimals
                break
            case 'zbnb':
                decimals = 1e18
                amount = input! * decimals
                break
            case 'zmatic':
                decimals = 1e18
                amount = input! * decimals
                break
            case 'xcad':
                decimals = 1e18
                amount = input! * decimals
                break
            case 'vrz':
                decimals = 1e18
                amount = input! * decimals
                break
            case 'lulu':
                decimals = 1e6
                amount = input! * decimals
                break
            case 'zopul':
                decimals = 1e18
                amount = input! * decimals
                break
            case 'lunr':
                decimals = 1e4
                amount = input! * decimals
                break
            case 'swth':
                decimals = 1e8
                amount = input! * decimals
                break
            case 'fees':
                decimals = 1e4
                amount = input! * decimals
                break
            case 'port':
                decimals = 1e4
                amount = input! * decimals
                break
            case 'zwap':
                decimals = 1e12
                amount = input! * decimals
                break
            case 'dxcad':
                decimals = 1e18
                amount = input! * decimals
                break
            case 'zbrkl':
                decimals = 1e18
                amount = input! * decimals
                break
            case 'sco':
                decimals = 1e4
                amount = input! * decimals
                break
            case 'carb':
                decimals = 1e8
                amount = input! * decimals
                break
            case 'dmz':
                decimals = 1e18
                amount = input! * decimals
                break
            case 'huny':
                decimals = 1e12
                amount = input! * decimals
                break
            case 'blox':
                decimals = 1e2
                amount = input! * decimals
                break
            case 'stream':
                decimals = 1e8
                amount = input! * decimals
                break
            case 'redc':
                decimals = 1e9
                amount = input! * decimals
                break
            case 'hol':
                decimals = 1e5
                amount = input! * decimals
                break
            case 'evz':
                decimals = 1e8
                amount = input! * decimals
                break
            case 'zlp':
                decimals = 1e18
                amount = input! * decimals
                break
            case 'grph':
                decimals = 1e8
                amount = input! * decimals
                break
            case 'shards':
                decimals = 1e12
                amount = input! * decimals
                break
            case 'duck':
                decimals = 1e2
                amount = input! * decimals
                break
            case 'zpaint':
                decimals = 1e4
                amount = input! * decimals
                break
            case 'gp':
                decimals = 1e5
                amount = input! * decimals
                break
            case 'gemz':
                decimals = 1
                amount = input! * decimals
                break
            case 'oki':
                decimals = 1e5
                amount = input! * decimals
                break
            case 'franc':
                decimals = 1e6
                amount = input! * decimals
                break
            case 'zwall':
                decimals = 1e12
                amount = input! * decimals
                break
            case 'pele':
                decimals = 1e5
                amount = input! * decimals
                break
            case 'gary':
                decimals = 1e4
                amount = input! * decimals
                break
            case 'consult':
                decimals = 1e6
                amount = input! * decimals
                break
            case 'zame':
                decimals = 1e6
                amount = input! * decimals
                break
            case 'wallex':
                decimals = 1e4
                amount = input! * decimals
                break
            case 'hodl':
                decimals = 1
                amount = input! * decimals
                break
            case 'athlete':
                decimals = 1e4
                amount = input! * decimals
                break
            case 'milky':
                decimals = 1e6
                amount = input! * decimals
                break
            case 'bolt':
                decimals = 1e18
                amount = input! * decimals
                break
            case 'mambo':
                decimals = 1e12
                amount = input! * decimals
                break
            case 'recap':
                decimals = 1e12
                amount = input! * decimals
                break
            case 'zch':
                decimals = 1e6
                amount = input! * decimals
                break
            case 'srv':
                decimals = 1e2
                amount = input! * decimals
                break
            case 'nftdex':
                decimals = 1
                amount = input! * decimals
                break
            case 'unidex-v2':
                decimals = 1e2
                amount = input! * decimals
                break
            case 'zillex':
                decimals = 1e12
                amount = input! * decimals
                break
            case 'zlf':
                decimals = 1e5
                amount = input! * decimals
                break
            case 'button':
                decimals = 1e12
                amount = input! * decimals
                break
        }

        const res = {
            txID,
            amount,
            decimals,
        }

        return res
    }
}
