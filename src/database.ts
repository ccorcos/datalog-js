import * as storage from "localstorage-down"
import levelup from "levelup"
const db = levelup(storage)

type ValueType = "number" | "string" | { new (): Entity<any> }
type Cardinality = "one" | "many"

export class AttributeSchema<
	N extends string,
	V extends ValueType,
	C extends Cardinality
> {
	constructor(public name: N, public valueType: V, public cardinality: C) {}
}

export class Entity<Attr extends AttributeSchema<any, any, any>> {
	public id: string
	public attributes: {
		[key in Attr["name"]]: Attr extends AttributeSchema<key, any, any>
			? Attr
			: never
	}
	constructor(id: string, attributes: Attr[]) {
		this.id = id
		this.attributes = {} as any
		for (const attr of attributes) {
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
		public value: ValueTypeType<E["attributes"][A]["valueType"]>
	) {}
}

type GenericFact = Fact<Entity<any>, any>

export class Transaction {
	public facts: Array<GenericFact> = []

	public set<N extends string, A extends AttributeSchema<N, any, "one">>(
		fact: Fact<Entity<A>, N>
	) {
		this.facts.push(fact)
	}

	public add<N extends string, A extends AttributeSchema<N, any, "many">>(
		fact: Fact<Entity<A>, N>
	) {
		this.facts.push(fact)
	}

	public remove<N extends string, A extends AttributeSchema<N, any, "many">>(
		fact: Fact<Entity<A>, N>
	) {
		this.facts.push(fact)
	}

	public commit() {}
}
