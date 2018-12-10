import { Entity, AttributeSchema } from "./database"

export class Person extends Entity<
	typeof PersonNameSchema | typeof PersonGroupSchema
> {
	constructor(id?: string) {
		super(id || Math.round(Math.random() * 10e10).toString(), [
			PersonNameSchema,
			PersonGroupSchema,
		])
	}
}

export class Group extends Entity<typeof GroupNameSchema> {
	constructor(id?: string) {
		super(id || Math.round(Math.random() * 10e10).toString(), [GroupNameSchema])
	}
}

export class Message extends Entity<
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
