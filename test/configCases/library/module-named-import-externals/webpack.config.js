"use strict";

/** @type {import("../../../../types").Configuration} */
module.exports = {
	target: "node",
	entry: { main: "./index.js" },
	output: {
		module: true,
		library: {
			type: "module"
		},
		filename: "[name].mjs",
		chunkFormat: "module"
	},
	experiments: {
		outputModule: true
	},
	resolve: {
		extensions: [".js"]
	},
	externalsType: "module",
	optimization: {
		concatenateModules: true,
		usedExports: true
	}
};
