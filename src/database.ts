import * as storage from "localstorage-down"
import levelup from "levelup"
import * as randomId from "cuid"

const db = levelup(storage)

type ValueType = "number" | "string" | { new (): Entity<any> }
type Cardinality = "one" | "many"

export class AttributeSchema<
	N extends string,
	V extends ValueType,
	C extends Cardinality
> {
	public name: N
	public valueType: V
	public cardinality: C
	public noHistory: boolean
	public unique: boolean

	constructor(opts: {
		name: N
		valueType: V
		cardinality: C
		noHistory?: boolean
		unique?: boolean
	}) {
		this.name = opts.name
		this.valueType = opts.valueType
		this.cardinality = opts.cardinality
		this.noHistory = Boolean(opts.noHistory)
		this.unique = Boolean(opts.unique)
	}
}

export class Entity<Attr extends AttributeSchema<any, any, any>> {
	public id: string
	public attributes: {
		[key in Attr["name"]]: Attr extends AttributeSchema<key, any, any>
			? Attr
			: never
	}
	constructor(opts: { id?: string; attributes: Attr[] }) {
		this.id = opts.id || randomId()
		this.attributes = {} as any
		for (const attr of opts.attributes) {
			this.attributes[attr.name] = attr
		}
	}
}

type ValueTypeType<V extends ValueType> = V extends "number"
	? number
	: V extends "string"
	? string
	: V extends { new (): Entity<any> }
	? InstanceType<V>
	: undefined

export class Fact<E extends Entity<any>, A extends keyof E["attributes"]> {
	public id = randomId()
	public operation: "set" | "add" | "remove"
	constructor(
		public entity: E,
		public attribute: A,
		public value: ValueTypeType<E["attributes"][A]["valueType"]>,
		// Allow removing for cardinality "many"
		remove: boolean = false
	) {
		if (entity.attributes[attribute].cardinality === "many") {
			this.operation = remove ? "remove" : "add"
		} else {
			this.operation = "set"
		}
	}
}

export class Transaction extends Entity<typeof TransactionCreatedAtSchema> {
	constructor(id?: string) {
		super({ id: id, attributes: [TransactionCreatedAtSchema] })
	}
}

const TransactionCreatedAtSchema = new AttributeSchema({
	name: "transaction/createdAt",
	valueType: "string",
	cardinality: "one",
})

export type GenericFact = Fact<Entity<any>, any>

type BatchOp =
	| { type: "del"; key: Array<string> }
	| { type: "put"; key: Array<string>; value: any }

export async function commit(facts: Array<GenericFact>) {
	// https://docs.datomic.com/on-prem/indexes.html
	// EAVT, get all attribute-values on an entity.
	// AEVT, get all values of a given attribute.
	// AVET, find entities with the same name, or enforce uniqueness.
	// VAET, reverse index for finding relationships.

	// Create a transaction with metadata.
	const transaction = new Transaction()
	const commitFacts = [
		new Fact(transaction, "transaction/createdAt", new Date().toString()),
		...facts,
	]

	// Write to each index.
	const indexes = ["eavto", "aevto", "aveto", "vaeto"]
	const batchOps: Array<BatchOp> = []

	for (const fact of commitFacts) {
		const obj = {
			e: fact.entity.id,
			a: fact.attribute,
			v: fact.value instanceof Entity ? fact.value.id : fact.value,
			t: transaction.id,
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
