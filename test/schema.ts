import { Attribute } from "../src/types"

const GroupNameSchema: Attribute = {
	name: "group/name",
	valueType: "string",
	cardinality: "one",
}
const PersonNameSchema: Attribute = {
	name: "person/name",
	valueType: "string",
	cardinality: "one",
}
const PersonGroupSchema: Attribute = {
	name: "person/group",
	valueType: "reference",
	cardinality: "many",
}
const MessageAuthorSchema: Attribute = {
	name: "message/author",
	valueType: "reference",
	cardinality: "one",
}
const MessageGroupSchema: Attribute = {
	name: "message/group",
	valueType: "reference",
	cardinality: "one",
}
const MessageTextSchema: Attribute = {
	name: "message/text",
	valueType: "string",
	cardinality: "one",
}
const MessageCreatedAtSchema: Attribute = {
	name: "message/createdAt",
	valueType: "string",
	cardinality: "one",
}

export const schema = [
	GroupNameSchema,
	PersonNameSchema,
	PersonGroupSchema,
	MessageAuthorSchema,
	MessageGroupSchema,
	MessageTextSchema,
	MessageCreatedAtSchema,
]
