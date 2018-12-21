import { Entity, AttributeSchema } from "../src/database"

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

import test from "ava"
import { Person, Group, Message } from "./schema"
import { commit, Fact, query, Var } from "./database"

/*
// Get list of conversations
query([
	[chet, "group/name", UnknownGroup]
])

// Get messages in a conversation
query([
	[UnkownMessage, "message/group", group]
])

// Get group members
query([
	[UnkownPerson, "person/group", group]
])

// As of a transaction?
// Limit and offset?
// Sort by?

// Get all (unread?) messages from all conversations
query([
	[chet, "person/group", UnknownGroup],
	[UnkownMessage, "message/group", UnknownGroup],
])
*/

skip("set/get", async t => {
	const chet = new Person()
	await commit([new Fact(chet, "person/name", "Chet")])

	const whichPerson = new Var(Person)
	const whichName = new Var("string")
	const result = await query({
		find: [whichPerson],
		given: [[whichName, "Chet"]],
		where: [[whichPerson, "author/name", whichName]],
	})

	t.is(chet.id, result[0].id)

	console.log("result", result)
})

// test("foo", async t => {
// 	const chet = new Person()
// 	const joe = new Person()
// 	const group = new Group()
// 	const message = new Message()

// 	await commit([
// 		new Fact(chet, "person/name", "Chester"),
// 		new Fact(joe, "person/name", "Joe"),
// 		new Fact(group, "group/name", "Chet + Joe"),
// 		new Fact(chet, "person/group", group),
// 		new Fact(joe, "person/group", group),
// 		new Fact(message, "message/author", chet),
// 	])

// 	// find: Array<Var<any>>
// 	// given: Array<Binding<any>>
// 	// where: Array<Statement<any, any>>

// 	const whichPerson = new Var(Person)
// 	const whichGroup = new Var(Group)

// 	const result = await query({
// 		find: [whichGroup],
// 		given: [[whichPerson, chet]],
// 		where: [[whichPerson, "person/group", whichGroup]],
// 	})
// 	console.log("result", result)
// })
