import { Person, Group, Message } from "./schema"
import { commit, Fact } from "./database"

const chet = new Person()
const joe = new Person()
const group = new Group()
const message = new Message()

commit([
	new Fact(chet, "person/name", "Chester"),
	new Fact(joe, "person/name", "Joe"),
	new Fact(group, "group/name", "Chet + Joe"),
	new Fact(chet, "person/group", group),
	new Fact(joe, "person/group", group),
	new Fact(message, "message/author", chet),
])
