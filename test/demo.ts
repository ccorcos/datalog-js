import test from "ava"
import "babel-polyfill"
import { schema } from "../src/schema"
import { commit, query, d } from "../src/database"
import { LevelUp } from "levelup"
import * as level from "level"

const db: LevelUp = level("test.db")

test("set/get", async t => {
	// Can we set and get?
	await commit({
		db: db,
		schema: schema,
		facts: [d("me", "person/name", "Chester")],
	})

	const result = await query({
		db: db,
		schema: schema,
		find: ["who?"],
		given: { "name?": ["Chester"] },
		where: [["who?", "person/name", "name?"]],
	})

	t.is(result.length, 1)
	t.is(result[0].length, 1)
	t.is(result[0][0], "me")

	// Can we overwrite facts?
	await commit({
		db: db,
		schema: schema,
		facts: [d("me", "person/name", "Chester Corcos")],
	})

	const result2 = await query({
		db: db,
		schema: schema,
		find: ["name?"],
		given: { "who?": ["me"] },
		where: [["who?", "person/name", "name?"]],
	})

	t.is(result2.length, 1)
	t.is(result2[0].length, 1)
	t.is(result2[0][0], "Chester Corcos")

	// Can we get multiple results?
	await commit({
		db: db,
		schema: schema,
		facts: [d("joe", "person/name", "Joeseph")],
	})

	const result3 = await query({
		db: db,
		schema: schema,
		find: ["name?"],
		given: {},
		where: [["who?", "person/name", "name?"]],
	})

	t.is(result3.length, 1)
	t.is(result3[0].length, 2)
	t.deepEqual(result3[0], ["Joeseph", "Chester Corcos"])

	// Can we get multi-valued results?
	await commit({
		db: db,
		schema: schema,
		facts: [
			d("joe", "person/group", "g1"),
			d("joe", "person/group", "g2"),
			d("me", "person/group", "g1"),
		],
	})

	const result4 = await query({
		db: db,
		schema: schema,
		find: ["groups?"],
		given: {},
		where: [["joe", "person/group", "groups?"]],
	})

	t.is(result4.length, 1)
	t.is(result4[0].length, 2)
	t.deepEqual(result4[0], ["g1", "g2"])

	const result5 = await query({
		db: db,
		schema: schema,
		find: ["peeps?"],
		given: {},
		where: [["peeps?", "person/group", "g1"]],
	})

	t.is(result5.length, 1)
	t.is(result5[0].length, 2)
	t.deepEqual(result5[0], ["joe", "me"])
})

/*
// Get list of convaersations
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

// async function main() {
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

// find: Array<Var<any>>
// given: Array<Binding<any>>
// where: Array<Statement<any, any>>

// 	const whichPerson = new Var(Person)
// 	const whichGroup = new Var(Group)

// 	const result = await query({
// 		find: [whichGroup],
// 		given: [[whichPerson, chet]],
// 		where: [[whichPerson, "person/group", whichGroup]],
// 	})
// 	console.log("result", result)
// }

// window["demo"] = main
