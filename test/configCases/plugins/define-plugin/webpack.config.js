"use strict";

const DefinePlugin = require("../../../../").DefinePlugin;
const Module = require("../../../../").Module;

/** @type {import("../../../../").Configuration} */
module.exports = {
	plugins: [
		new DefinePlugin({
			TRUE: true,
			FALSE: false,
			NULL: null,
			UNDEFINED: undefined,
			NUMBER: 100.05,
			ZERO: 0,
			ONE: 1,
			STRING: '"string"',
			EMPTY_STRING: '""',
			BIGINT: BigInt("9007199254740993"),
			ZERO_BIGINT: BigInt(0),
			POSITIVE_ZERO: +0,
			NEGATIVE_ZER0: -0,
			NEGATIVE_NUMBER: -100.25,
			POSITIVE_NUMBER: +100.25,
			/**
			 * @param {number} a a
			 * @returns {number} result
			 */
			// eslint-disable-next-line object-shorthand
			FUNCTION: /* istanbul ignore next */ function (a) {
				return a + 1;
			},
			CODE: "(1+2)",
			REGEXP: /abc/i,
			OBJECT: {
				SUB: {
					UNDEFINED: undefined,
					/**
					 * @param {number} a a
					 * @returns {number} result
					 */
					// eslint-disable-next-line object-shorthand
					FUNCTION: /* istanbul ignore next */ function (a) {
						return a + 1;
					},
					CODE: "(1+2)",
					REGEXP: /abc/i,
					STRING: JSON.stringify("string")
				}
			},
			ARRAY: [2, [JSON.stringify("six")]],
			"process.env.DEFINED_NESTED_KEY": 5,
			"process.env.DEFINED_NESTED_KEY_STRING": '"string"',
			"typeof wurst": "typeof suppe",
			"typeof suppe": "typeof wurst",
			wurst: "suppe",
			suppe: "wurst",
			RUNTIMEVALUE_CALLBACK_ARGUMENT_IS_A_MODULE: DefinePlugin.runtimeValue(
				({ module }) => module instanceof Module
			),
			A_DOT_J: '"a.j"',
			OBJECT2: {
				used: 1,
				unused: "(() => throw new Error('unused property was rendered'))()",
				sub: {
					used: 1,
					unused: "(() => throw new Error('unused property was rendered'))()"
				}
			},
			"FOO.BAR.BAZ": 1,
			"FOO.BAR.BAZZ": 2,
			"X.Y.BAZ": 3
		})
	]
};
