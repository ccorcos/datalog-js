import * as storage from "localstorage-down"
import levelup from "levelup"
const db = levelup(storage)

type ValueType = "number" | "string" | { new (): Entity<any> }
type Cardinality = "one" | "many"

class AttributeSchema<
	N extends string,
	V extends ValueType,
	C extends Cardinality
> {
	constructor(public name: N, public valueType: V, public cardinality: C) {}
}

class Entity<Attr extends AttributeSchema<any, any, any>> {
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

class Fact<E extends Entity<any>, A extends keyof E["attributes"]> {
	constructor(
		public entity: E,
		public attribute: A,
		public value: ValueTypeType<E["attributes"][A]["valueType"]>
	) {}
}

// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------

class Person extends Entity<
	typeof PersonNameSchema | typeof PersonGroupSchema
> {
	constructor(id?: string) {
		super(id || Math.round(Math.random() * 10e10).toString(), [
			PersonNameSchema,
			PersonGroupSchema,
		])
	}
}

class Group extends Entity<typeof GroupNameSchema> {
	constructor(id?: string) {
		super(id || Math.round(Math.random() * 10e10).toString(), [GroupNameSchema])
	}
}

class Message extends Entity<
	| typeof MessageAuthorSchema
	| typeof MessageGroupSchema
	| typeof MessageTextSchema
	| typeof MessageCreatedAtSchema
> {
	constructor(id?: string) {
		super(id || Math.round(Math.random() * 10e10).toString(), [
			MessageAuthorSchema,
			MessageGroupSchema,
			MessageTextSchema,
			MessageCreatedAtSchema,
		])
	}
}

const GroupNameSchema = new AttributeSchema("group/name", "string", "one")

const PersonNameSchema = new AttributeSchema("person/name", "string", "one")
const PersonGroupSchema = new AttributeSchema("person/group", Group, "many")

const MessageAuthorSchema = new AttributeSchema("message/author", Person, "one")
const MessageGroupSchema = new AttributeSchema("message/group", Group, "one")
const MessageTextSchema = new AttributeSchema("message/text", "string", "one")
const MessageCreatedAtSchema = new AttributeSchema(
	"message/createdAt",
	"string",
	"one"
)

type AttributeSchemas =
	| typeof PersonNameSchema
	| typeof PersonGroupSchema
	| typeof MessageTextSchema
	| typeof MessageCreatedAtSchema
	| typeof MessageAuthorSchema
	| typeof MessageGroupSchema

// --------------------------------------------------------------------------------

type t = Person["attributes"]["person/name"]["valueType"]

type GenericFact = Fact<Entity<any>, any>

const facts: Array<GenericFact> = []

const chet = new Person()
facts.push(new Fact(chet, "person/name", "Chester"))

const joe = new Person()
facts.push(new Fact(joe, "person/name", "Joe"))

const group = new Group()
facts.push(new Fact(group, "group/name", "Chet + Joe"))

const message = new Message()
facts.push(new Fact(message, "message/author", chet))
