"use strict";

const path = require("path");

/** @type {import("../../../../").Configuration} */
module.exports = {
	entry: {
		"deep/path/a": "./a",
		b: ["./shared?1", "./shared?2", "./b"],
		"somewhere/c": "./c"
	},
	target: "node",
	output: {
		filename: "[name].js"
	},
	optimization: {
		chunkIds: "named",
		runtimeChunk: {
			name: "deep/other/path/runtime"
		},
		splitChunks: {
			cacheGroups: {
				dep: {
					chunks: "initial",
					minChunks: 2,
					test: path.resolve(__dirname, "shared.js"),
					enforce: true
				}
			}
		}
	}
};
