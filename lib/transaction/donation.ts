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

import * as tyronzil from '../blockchain/tyronzil';

export default class Donation {
    public static async tyron(
		donation: number
	){
        let tyron_;
        const donation_ = String(donation * 1e12);
		switch (donation) {
            case 0:
                tyron_ = await tyronzil.default.OptionParam(
                tyronzil.Option.none,
                    "Uint128"
                );
                break;
            default:
                tyron_ = await tyronzil.default.OptionParam(
                    tyronzil.Option.some,
                    "Uint128",
                    donation_
                );
                break;
        }
        return tyron_;
	}
}