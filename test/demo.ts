import { Person, Group, Message } from "./schema"
import { commit, Fact, query, Var } from "./database"

async function main() {
	const chet = new Person()
	const joe = new Person()
	const group = new Group()
	const message = new Message()

	await commit([
		new Fact(chet, "person/name", "Chester"),
		new Fact(joe, "person/name", "Joe"),
		new Fact(group, "group/name", "Chet + Joe"),
		new Fact(chet, "person/group", group),
		new Fact(joe, "person/group", group),
		new Fact(message, "message/author", chet),
	])

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

	const whichPerson = new Var(Person)
	const whichGroup = new Var(Group)

	const result = await query({
		find: [whichGroup],
		given: [[whichPerson, chet]],
		where: [[whichPerson, "person/group", whichGroup]],
	})
	console.log("result", result)
}

window["demo"] = main
