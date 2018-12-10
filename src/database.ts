import * as storage from "localstorage-down"
import levelup from "levelup"
const db = levelup(storage)

type ValueType = "number" | "string" | { new (): Entity<any> }
type Cardinality = "one" | "many"

function randomId() {
	// TODO: uuid/v4
	return Math.round(Math.random() * 10e10).toString()
}

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
	constructor(
		public entity: E,
		public attribute: A,
		public value: ValueTypeType<E["attributes"][A]["valueType"]>,
		// Allow removing for cardinality "many"
		public remove: boolean = false
	) {}
}

type GenericFact = Fact<Entity<any>, any>

export class Transaction {
	public facts: Array<GenericFact> = []

	public add(fact: GenericFact) {
		this.facts.push(fact)
	}

	public commit() {}
}
