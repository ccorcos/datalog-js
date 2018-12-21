import * as randomId from "cuid"
import * as level from "level"
import { LevelUp } from "levelup"

export type Cardinality = "one" | "many"
export type ValueType = "number" | "string" | "reference"
export type Value = string | number

export interface Attribute {
	name: string
	valueType: ValueType
	cardinality: Cardinality
	noHistory?: boolean
	unique?: boolean
}

export interface Fact {
	id: string
	entity: string
	attribute: string
	value: Value
	remove?: boolean
}

export const systemAttributes: Array<Attribute> = [
	{
		name: "transaction/createdAt",
		valueType: "string",
		cardinality: "one",
	},
]

type BatchOp =
	| { type: "del"; key: Array<string> }
	| { type: "put"; key: Array<string>; value: any }

const indexes = ["eavto", "aevto", "aveto", "vaeto"]

export async function commit(
	db: LevelUp,
	schema: Array<Attribute>,
	facts: Array<Fact>
) {
	// https://docs.datomic.com/on-prem/indexes.html
	// EAVT, get all attribute-values on an entity.
	// AEVT, get all values of a given attribute.
	// AVET, find entities with the same name, or enforce uniqueness.
	// VAET, reverse index for finding relationships.

	// Add system attributes to schema.
	const commitSchema = [...schema, ...systemAttributes]

	// Create a transaction with metadata.
	const transactionId = randomId()
	const commitFacts: Array<Fact> = [
		{
			id: randomId(),
			entity: transactionId,
			attribute: "transaction/createdAt",
			value: new Date().toString(),
		},
		...facts,
	]

	// Validate facts
	for (const fact of commitFacts) {
		// validate against known schemas.
		const attrSchema = commitSchema.find(attr => attr.name === fact.attribute)
		if (!attrSchema) {
			throw new Error("Could not find schema for `" + fact.attribute + "`.")
		}
		// TODO: validate valueType
	}

	// Write to each index.
	const batchOps: Array<BatchOp> = []

	for (const fact of commitFacts) {
		const obj = {
			e: fact.entity,
			a: fact.attribute,
			v: fact.value,
			t: transactionId,
			o: Boolean(fact.remove),
		}

		for (const index of indexes) {
			batchOps.push({
				type: "put",
				key: [index, ...index.split("").map(key => obj[key])],
				value: fact.id,
			})
		}
	}

	await db.batch(batchOps)
}

type Statement = [string, string, Value]
type Binding = [string, Array<Value>]

export async function query(opts: {
	find: Array<string>
	given: Array<Binding>
	where: Array<Statement>
}) {
	// Datomic appears to run clauses in order.
	// https://docs.datomic.com/on-prem/best-practices.html#join-along
	// Level-Fact-Base appears to reorder statements.
	//
	// Lets try doing it in order first.

	const bindings: { [key: string]: Array<Value> } = {}
	for (const [key, value] of opts.given) {
		bindings[key] = value
	}

	// TODO: permute through all bindings first.

	for (const statement of opts.where) {
		// Resolve the bindings.
		const boundStatement = statement.map(item => {
			const value = bindings.get(item)
			if (value) {
				return value
			} else {
				return item
			}
		})

		// Lookup the index we want.
		const [e, a, v] = boundStatement

		const queryType = [
			e instanceof Var ? "_" : "e",
			a instanceof Var ? "_" : "a",
			v instanceof Var ? "_" : "v",
		].join("")

		if (queryType === "eav") {
			continue
		}

		const indexLookup = {
			___: "eavto",

			e__: "eavto",
			ea_: "eavto",

			e_v: undefined, // when would this happen?

			_a_: "aveto",
			_av: "aveto",

			__v: "vaeto",
		}

		const index: string | undefined = indexLookup[queryType]
		if (!index) {
			throw new Error("How did we get here?")
		}

		// Run query
		const keyPrefix = [index]
		for (const item of boundStatement) {
			if (item instanceof Var) {
				break
			} else if (item instanceof Entity) {
				keyPrefix.push(item.id)
			} else {
				keyPrefix.push(item)
			}
		}

		const es = new Set<string>()
		const as = new Set<string>()
		const vs = new Set<any>()
		await range(keyPrefix, data => {
			const [e, a, v, t, o] = "eavto"
				.split("")
				.map(x => data.key[index.indexOf(x) + 1])

			// TODO: transactions should be an autoincrementing number
			// TODO: query against transaction range
			// TODO: return a list of results

			es.add(e)
			as.add(a)
			vs.add(v)
		})

		if (e instanceof Var) {
			bindings.set(e, new e.valueType(Array.from(es)[0]))
		}
		if (a instanceof Var) {
			bindings.set(a, Array.from(as)[0])
		}
		if (v instanceof Var) {
			bindings.set(v, Array.from(vs)[0])
		}
	}

	return opts.find.map(item => bindings.get(item))
}

export function range(
	db: LevelUp,
	prefix: Array<any>,
	onData: (data: any) => void
): Promise<void> {
	const gte = prefix
	const lte = prefix.concat([void 0])

	const stream = db.createReadStream({ gte: gte, lte: lte })

	let resolve, reject
	const promise = new Promise<void>((res, rej) => {
		resolve = res
		reject = rej
	})

	stream.on("error", reject)
	stream.on("end", resolve)
	stream.on("data", onData)

	return promise
}

function database(filePath: string, schema: Array<Attribute>) {
	const db: LevelUp = level(filePath)
}

function permute(bindings: {
	[key: string]: Array<Value>
}): Array<{ [key: string]: Value }> {
	const result: Array<{ [key: string]: Value }> = []

	for (const key in bindings) {
		for (const value of bindings[key]) {
		}
	}
}
