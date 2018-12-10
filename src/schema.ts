import { Entity, AttributeSchema } from "./database"

export class Person extends Entity<
	typeof PersonNameSchema | typeof PersonGroupSchema
> {
	constructor(id?: string) {
		super({ id: id, attributes: [PersonNameSchema, PersonGroupSchema] })
	}
}

export class Group extends Entity<typeof GroupNameSchema> {
	constructor(id?: string) {
		super({ id: id, attributes: [GroupNameSchema] })
	}
}

export class Message extends Entity<
	| typeof MessageAuthorSchema
	| typeof MessageGroupSchema
	| typeof MessageTextSchema
	| typeof MessageCreatedAtSchema
> {
	constructor(id?: string) {
		super({
			id: id,
			attributes: [
				MessageAuthorSchema,
				MessageGroupSchema,
				MessageTextSchema,
				MessageCreatedAtSchema,
			],
		})
	}
}

const GroupNameSchema = new AttributeSchema({
	name: "group/name",
	valueType: "string",
	cardinality: "one",
})
const PersonNameSchema = new AttributeSchema({
	name: "person/name",
	valueType: "string",
	cardinality: "one",
})
const PersonGroupSchema = new AttributeSchema({
	name: "person/group",
	valueType: Group,
	cardinality: "many",
})

const MessageAuthorSchema = new AttributeSchema({
	name: "message/author",
	valueType: Person,
	cardinality: "one",
})
const MessageGroupSchema = new AttributeSchema({
	name: "message/group",
	valueType: Group,
	cardinality: "one",
})
const MessageTextSchema = new AttributeSchema({
	name: "message/text",
	valueType: "string",
	cardinality: "one",
})
const MessageCreatedAtSchema = new AttributeSchema({
	name: "message/createdAt",
	valueType: "string",
	cardinality: "one",
})
