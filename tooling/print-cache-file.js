"use strict";

const fs = require("fs");
const path = require("path");
const BinaryMiddleware = require("../lib/serialization/BinaryMiddleware");
const FileMiddleware = require("../lib/serialization/FileMiddleware");
const Serializer = require("../lib/serialization/Serializer");
const SerializerMiddleware = require("../lib/serialization/SerializerMiddleware");

/** @typedef {{ size: number, lazySize: number }} SizeInfo */

const binaryMiddleware = new BinaryMiddleware();

const serializer = new Serializer([binaryMiddleware, new FileMiddleware(fs)]);

const rawSerializer = new Serializer([new FileMiddleware(fs)]);

/** @type {Array<SizeInfo | undefined>} */
const lazySizes = [];

/**
 * @param {(Buffer | (() => Promise<Buffer[]>))[]} data data
 * @returns {Promise<SizeInfo>} size info
 */
const captureSize = async (data) => {
	let size = 0;
	let lazySize = 0;
	for (const b of data) {
		if (Buffer.isBuffer(b)) {
			size += b.length;
		} else if (typeof b === "function") {
			const i = lazySizes.length;
			lazySizes.push(undefined);
			const r = await captureSize(await b());
			lazySize += r.size + r.lazySize;
			lazySizes[i] = r;
		}
	}
	return { size, lazySize };
};

const ESCAPE = null;
const ESCAPE_ESCAPE_VALUE = null;
const ESCAPE_END_OBJECT = true;
const ESCAPE_UNDEFINED = false;

/**
 * @param {Array<EXPECTED_ANY>} data data
 * @param {string} indent indent
 * @returns {Promise<void>} promise
 */
const printData = async (data, indent) => {
	if (!Array.isArray(data)) throw new Error("Not an array");
	if (Buffer.isBuffer(data[0])) {
		for (const b of data) {
			if (typeof b === "function") {
				const innerData = await b();
				const info = /** @type {SizeInfo} */ (lazySizes.shift());
				const sizeInfo = `${(info.size / 1048576).toFixed(2)} MiB + ${(
					info.lazySize / 1048576
				).toFixed(2)} lazy MiB`;
				console.log(`${indent}= lazy ${sizeInfo} {`);
				await printData(innerData, `${indent}  `);
				console.log(`${indent}}`);
			} else {
				console.log(`${indent}= ${b.toString("hex")}`);
			}
		}
		return;
	}
	const referencedValues = new Map();
	const referencedValuesCounters = new Map();
	const referencedTypes = new Map();
	let currentReference = 0;
	let currentTypeReference = 0;
	let i = 0;
	const read = () => data[i++];
	/**
	 * @param {string} content content
	 */
	const printLine = (content) => {
		console.log(`${indent}${content}`);
	};
	printLine(`Version: ${read()}`);
	while (i < data.length) {
		const item = read();
		if (item === ESCAPE) {
			const nextItem = read();
			if (nextItem === ESCAPE_ESCAPE_VALUE) {
				printLine("null");
			} else if (nextItem === ESCAPE_UNDEFINED) {
				printLine("undefined");
			} else if (nextItem === ESCAPE_END_OBJECT) {
				indent = indent.slice(0, -2);
				printLine(`} = #${currentReference++}`);
			} else if (typeof nextItem === "number" && nextItem < 0) {
				const ref = currentReference + nextItem;
				const value = referencedValues.get(ref);
				referencedValuesCounters.set(
					ref,
					(referencedValuesCounters.get(ref) || 0) + 1
				);
				if (value) {
					printLine(
						`Reference ${nextItem} => ${JSON.stringify(value)} #${ref}`
					);
				} else {
					printLine(`Reference ${nextItem} => #${ref}`);
				}
			} else {
				const request = nextItem;
				if (typeof request === "number") {
					const ref = currentTypeReference - request;
					printLine(
						`Object (Reference ${request} => ${referencedTypes.get(
							ref
						)} @${ref}) {`
					);
				} else {
					const name = read();
					referencedTypes.set(currentTypeReference, `${request} / ${name}`);
					printLine(
						`Object (${request} / ${name} @${currentTypeReference++}) {`
					);
				}
				indent += "  ";
			}
		} else if (typeof item === "string") {
			if (item !== "") {
				referencedValues.set(currentReference, item);
				printLine(`${JSON.stringify(item)} = #${currentReference++}`);
			} else {
				printLine('""');
			}
		} else if (Buffer.isBuffer(item)) {
			printLine(`buffer ${item.toString("hex")} = #${currentReference++}`);
		} else if (typeof item === "function") {
			const innerData = await item();
			if (!SerializerMiddleware.isLazy(item, binaryMiddleware)) {
				const info = /** @type {SizeInfo} */ (lazySizes.shift());
				const sizeInfo = `${(info.size / 1048576).toFixed(2)} MiB + ${(
					info.lazySize / 1048576
				).toFixed(2)} lazy MiB`;
				printLine(`lazy-file ${sizeInfo} {`);
			} else {
				printLine("lazy-inline {");
			}
			await printData(innerData, `${indent}  `);
			printLine("}");
		} else {
			printLine(String(item));
		}
	}
	const refCounters = [...referencedValuesCounters];
	refCounters.sort(([_a, A], [_b, B]) => B - A);
	printLine("SUMMARY: top references:");
	for (const [ref, count] of refCounters.slice(10)) {
		const value = referencedValues.get(ref);
		if (value) {
			printLine(`- #${ref} x ${count} = ${JSON.stringify(value)}`);
		} else {
			printLine(`- #${ref} x ${count}`);
		}
	}
};

const filename = process.argv[2];

(async () => {
	const structure = await rawSerializer.deserialize(null, {
		filename: path.resolve(filename),
		extension: ".pack"
	});
	const info = await captureSize(structure);
	const sizeInfo = `${(info.size / 1048576).toFixed(2)} MiB + ${(
		info.lazySize / 1048576
	).toFixed(2)} lazy MiB`;
	console.log(`${filename} ${sizeInfo}:`);

	const data = await serializer.deserialize(null, {
		filename: path.resolve(filename),
		extension: ".pack"
	});
	await printData(data, "");
})();
