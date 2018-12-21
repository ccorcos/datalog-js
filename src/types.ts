export type Cardinality = "one" | "many"
export type ValueType = "number" | "string" | "reference"
export type Value = string | number

export interface Attribute {
	name: string
	valueType: ValueType
	cardinality: Cardinality
	noHistory?: boolean
	unique?: boolean
}

export interface Fact {
	id: string
	entity: string
	attribute: string
	value: Value
	remove?: boolean
}

export interface CommittedFact extends Fact {
	transaction: string
}

export type BatchOp =
	| { type: "del"; key: string }
	| { type: "put"; key: string; value: any }

export type Statement = [
	string, // Entity
	string, // Attribute
	Value // Value
]

export type Binding = { [key: string]: Value }
export type Bindings = { [key: string]: Array<Value> }
