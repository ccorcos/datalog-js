import * as randomId from "cuid"
import * as level from "level"
import { LevelUp } from "levelup"

type Cardinality = "one" | "many"
type ValueType = "number" | "string" | "reference"

interface Attribute<
	N extends string,
	V extends ValueType,
	C extends Cardinality
> {
	name: N
	valueType: V
	cardinality: C
	noHistory?: boolean
	unique?: boolean
}

function Attribute<
	N extends string,
	V extends ValueType,
	C extends Cardinality
>(args: Attribute<N, V, C>) {
	return args
}

type ValueTypeType<V extends ValueType> = V extends "number"
	? number
	: V extends "string"
	? string
	: V extends "reference"
	? string
	: undefined

type Operation<C extends Cardinality> = C extends "one"
	? "set"
	: "add" | "remove"

interface Fact<N extends string, V extends ValueType, C extends Cardinality> {
	id: string
	entity: string
	attribute: N
	value: V
	operation: Operation<C>
}

function Fact<N extends string, V extends ValueType, C extends Cardinality>(
	entity: string,
	attribute: N,
	value: V,
	operation: Operation<C>
): Fact<N, V, C> {
	return {
		id: randomId(),
		entity: entity,
		attribute: attribute,
		value: value,
		operation: operation,
	}
}

type BatchOp =
	| { type: "del"; key: Array<string> }
	| { type: "put"; key: Array<string>; value: any }

const indexes = ["eavto", "aevto", "aveto", "vaeto"]

export async function commit(facts: Array<Fact>) {
	// https://docs.datomic.com/on-prem/indexes.html
	// EAVT, get all attribute-values on an entity.
	// AEVT, get all values of a given attribute.
	// AVET, find entities with the same name, or enforce uniqueness.
	// VAET, reverse index for finding relationships.

	// Create a transaction with metadata.
	const transactionId = randomId()
	const commitFacts = [
		Fact(transactionId, "transaction/createdAt", new Date().toString()),
		...facts,
	]

	// Write to each index.
	const batchOps: Array<BatchOp> = []

	for (const fact of commitFacts) {
		const obj = {
			e: fact.entity,
			a: fact.attribute,
			v: fact.value,
			t: transactionId,
			o: fact.operation,
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

class Database {
	constructor(name: string) {}
}

function createDb(path: string) {
	const db: LevelUp = level("./mydb")
	return db
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

const TransactionCreatedAtSchema: AttributeSchema = {
	name: "transaction/createdAt",
	valueType: "string",
	cardinality: "one",
}

export class Var<T extends ValueType> {
	public value: ValueTypeType<T> | undefined
	constructor(public valueType: T) {}
}

type Binding<T extends ValueType> = [Var<T>, ValueTypeType<T>]

type Statement<E extends Entity<any>, A extends keyof E["attributes"]> =
	// Look up a value given an entity
	| [E, A, Var<E["attributes"]["valueType"]>]
	// Lookup an entity given a value
	| [Var<Constructor<E>>, A, E["attributes"]["valueType"]]
	// Look up either side.
	| [Var<Constructor<E>>, A, Var<E["attributes"]["valueType"]>]

// TODO: better return type.
export async function query(opts: {
	find: Array<Var<any>>
	given: Array<Binding<any>>
	where: Array<Statement<any, any>>
}) {
	// Datomic appears to run clauses in order.
	// https://docs.datomic.com/on-prem/best-practices.html#join-along
	// Level-Fact-Base appears to reorder statements.
	//
	// Lets try doing it in order first.

	const bindings = new Map<Var<any>, ValueTypeType<any>>()
	for (const [a, b] of opts.given) {
		bindings.set(a, b)
	}

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
