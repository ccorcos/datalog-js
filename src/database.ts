import * as storage from "localstorage-down"
import levelup from "levelup"
const db = levelup(storage)

type ValueType = "number" | "string" | "ref"
type Cardinality = "one" | "many"

class AttributeSchema<
	N extends string,
	V extends ValueType,
	C extends Cardinality
> {
	constructor(public name: N, public valueType: V, public cardinality: C) {}
}

const PersonNameSchema = new AttributeSchema("person/name", "string", "one")
const PersonGroupSchema = new AttributeSchema("person/group", "ref", "many")

const MessageTextSchema = new AttributeSchema("message/text", "string", "one")
const MessageCreatedAtSchema = new AttributeSchema(
	"message/createdAt",
	"string",
	"one"
)
const MessageAuthorSchema = new AttributeSchema("message/author", "ref", "one")
const MessageGroupSchema = new AttributeSchema("message/group", "ref", "one")

type AttributeSchemas =
	| typeof PersonNameSchema
	| typeof PersonGroupSchema
	| typeof MessageTextSchema
	| typeof MessageCreatedAtSchema
	| typeof MessageAuthorSchema
	| typeof MessageGroupSchema

type AttributeName = AttributeSchemas["name"]

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

const chet = new Person()

// type ValueTypeTypes = {
// 	"number": number,
// 	"string": string,
// 	"ref": Entity
// }

class Fact<A extends AttributeSchemas, E extends Entity<A>> {
	constructor(public entity: E, attribute: A["name"], value: )
}

// type Fact =
// 	// entityId, attribute, value, transaction, append/remove
// 	[string]
