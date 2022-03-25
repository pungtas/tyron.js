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
GNU General Public License for more details.*/

export default class CheckPath {
	constructor(
		path: String
	) {
		if (path === "") {
            return false;
          } else if (path === "XPoints") {
            return false;
          } else if (
            path.split("/")[1] === "did" ||
            path.split("/")[1] === "xwallet" ||
            path.split("/")[1] === "recovery" ||
            path.split("/")[1] === "funds" ||
            path.split("/")[1] === "buy" ||
            path.split(".")[1] === "did" ||
            path.split(".")[1] === "ssi" ||
            path.split(".")[1] === "vc" ||
            path.split(".")[1] === "treasury"
          ) {
            return false;
          } else {
            return true;
          }
	}
}
