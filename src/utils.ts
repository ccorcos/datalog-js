import * as _ from "lodash"
import { Bindings, Binding } from "./types"

export function permuteBindings(
	bindings: Bindings,
	ignoreKeys: Array<string> = []
): Array<Binding> {
	const result: Array<Binding> = []

	const keys = _.without(Object.keys(bindings), ...ignoreKeys)
	if (keys.length === 0) {
		result.push({})
		return result
	}

	const [key, ...rest] = keys
	const others = permuteBindings(bindings, [...ignoreKeys, key])
	for (const value of bindings[key]) {
		for (const binding of others) {
			result.push({
				...binding,
				[key]: value,
			})
		}
	}

	return result
}

export function isVar(x: any): x is string {
	return typeof x === "string" && x.endsWith("?")
}
