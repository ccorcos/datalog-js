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
	public attributes: { [key in Attr["name"]]: Attr }
	constructor(id: string, attributes: Attr[]) {
		this.id = id
		this.attributes = {} as any
		for (const attr of attributes) {
			this.attributes[attr.name] = attr
		}
	}
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

type ValueTypeType<V extends ValueType> = V extends "number"
	? number
	: V extends "string"
	? string
	: V extends Entity<any>
	? V
	: never

class Fact<E extends Entity<any>, A extends keyof E["attributes"]> {
	constructor(
		public entity: E,
		public attribute: A,
		public value: E["attributes"][A]["valueType"] extends "string" ? 0 : 1
	) {}
}

type t = Person["attributes"]["person/name"]["valueType"]

const chet = new Person()

new Fact(chet, "person/name", 0)
new Fact(chet, "person/name", 1)

// type Fact =
// 	// entityId, attribute, value, transaction, append/remove
// 	[string]
