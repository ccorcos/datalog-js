import { Person, Group, Message } from "./schema"
import { Transaction, Fact } from "./database"

const tx = new Transaction()

const chet = new Person()
tx.set(new Fact(chet, "person/name", "Chester"))

const joe = new Person()
tx.set(new Fact(joe, "person/name", "Joe"))

const group = new Group()
tx.set(new Fact(group, "group/name", "Chet + Joe"))

tx.add(new Fact(chet, "person/group", group))
tx.add(new Fact(joe, "person/group", group))

const message = new Message()
tx.set(new Fact(message, "message/author", chet))

tx.commit()
