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

/** Tools to manage smart contracts */
export default class SmartUtil {

    /** Gets the value out of a field Option */
    public static async getValue(object: any): Promise<string> {
        const entries = Object.entries(object);
        let result: string;
        entries.forEach((value: [string, unknown]) => {
            if (value[0] === "arguments") {
                result = value[1] as string;
            }
        });
        return result![0];
    }

    /** Gets the DID-Status out of field Option */
    public static async getStatus(object: any): Promise<string> {
        const entries = Object.entries(object);
        let result: string;
        entries.forEach((value: [string, unknown]) => {
            if (value[0] === "constructor") {
                result = value[1] as string;
            }
        });
        return result!;
    }

    /** Gets the value out of a map key */
    public static async getValuefromMap(object: any, key: string): Promise<any> {
        const entries = Object.entries(object);
        let result: unknown;
        entries.forEach((value: [string, unknown]) => {
            if (value[0] === key) {
                result = value[1]
            }
        });
        return result;
    }

    /** Turns the smart contract's map into a Map */
    public static async intoMap(object: any): Promise<Map<string, any>> {
        const entries = Object.entries(object);
        let map = new Map();
        entries.forEach((value: [string, unknown]) => {
            map.set(value[0], value[1])
        });
        return map;
    }

    /** Turns the DIDC `services` map field into a Map */
    public static async fromServices(input: any): Promise<Map<string, [string, string]>> {
        const prev_map = await this.intoMap(input);
        let map = new Map();
        
        for (let id of prev_map.keys()) {
            const object = prev_map.get(id);
            const entries = Object.entries(object);
            
            entries.forEach((value: [string, unknown]) => {
                if (value[0] === "arguments") {
                    const result = value[1] as [string, string];
                    const type = result[0];
                    const uri = result[1];
                    map.set(id, [type, uri]);
                }
            });
        };
        return map;
    }
}
