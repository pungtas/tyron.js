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

import CheckDomain from "./check-domain";
import CheckPath from "./check-path";

export default class SetUsername {
	constructor(
		path: String
	) {
    const checkPath = new CheckPath(path)
    const checkDomain = new CheckDomain(path)

		if (checkPath) {
      return path;
    } else if (checkDomain) {
      return path.split('.')[0];
    } else if (path.includes('.did') && path.includes('/')) {
      return path.split('/')[0].split('.')[0]
    } else if (path.split('/')[1] === 'did' || path.split('/')[1] === 'funds' || path.split('/')[1] === 'recovery' || path.split('/')[1] === 'buy') {
      return path.split('/')[0]
    } else {
      return ""
    }
	}
}
