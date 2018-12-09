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

class Entity<Attrs extends { [key: string]: AttributeSchema<any, any, any> }> {
	public id: string
	public attributes: Attrs
	constructor(id: string, attributes: Attrs) {
		this.id = id
		this.attributes = attributes
	}
}

// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------

class Person extends Entity<{
	name: typeof PersonNameSchema
	group: typeof PersonGroupSchema
}> {
	constructor(id?: string) {
		super(id || Math.round(Math.random() * 10e10).toString(), {
			name: PersonNameSchema,
			group: PersonGroupSchema,
		})
	}
}

class Group extends Entity<{ name: typeof GroupNameSchema }> {
	constructor(id?: string) {
		super(id || Math.round(Math.random() * 10e10).toString(), {
			name: GroupNameSchema,
		})
	}
}

class Message extends Entity<{
	author: typeof MessageAuthorSchema
	group: typeof MessageGroupSchema
	text: typeof MessageTextSchema
	createdAt: typeof MessageCreatedAtSchema
}> {
	constructor(id?: string) {
		super(id || Math.round(Math.random() * 10e10).toString(), {
			author: MessageAuthorSchema,
			group: MessageGroupSchema,
			text: MessageTextSchema,
			createdAt: MessageCreatedAtSchema,
		})
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

class Fact<E extends Entity<any>, K extends keyof E["attributes"]> {
	constructor(
		public entity: E,
		public attribute: K,
		public value: ValueTypeType<E["attributes"][K]["valueType"]>
	) {}
}

const chet = new Person()

new Fact(chet, "name", "Chester")

// type Fact =
// 	// entityId, attribute, value, transaction, append/remove
// 	[string]
