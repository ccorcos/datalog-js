import * as randomId from "cuid"
import { LevelUp } from "levelup"
import * as _ from "lodash"
import {
	ValueType,
	Value,
	Attribute,
	Fact,
	CommittedFact,
	BatchOp,
	Statement,
	Bindings,
} from "./types"
import { permuteBindings, isVar } from "./utils"
import StreamIterator from "stream-to-async-iterator"

const valueTypeOf: { [key in ValueType]: string } = {
	number: "number",
	string: "string",
	reference: "string",
}

export const systemAttributes: Array<Attribute> = [
	{
		name: "transaction/createdAt",
		valueType: "string",
		cardinality: "one",
	},
]

const SEP = "|"

let n = 100
const randomTx = () => (n++).toString()

export async function commit(args: {
	db: LevelUp
	schema: Array<Attribute>
	facts: Array<Fact>
}) {
	const { db, schema, facts } = args

	// Add system attributes to schema.
	const commitSchema = [...schema, ...systemAttributes]

	// Create a transaction with metadata.
	const transactionId = randomTx()
	const commitFacts: Array<Fact> = [
		{
			id: randomId(),
			entity: transactionId,
			attribute: "transaction/createdAt",
			value: new Date().toString(),
		},
		...facts,
	]

	// Validate facts
	for (const fact of commitFacts) {
		// validate against known schemas.
		const attrSchema = commitSchema.find(attr => attr.name === fact.attribute)
		if (!attrSchema) {
			throw new Error("Could not find schema for `" + fact.attribute + "`.")
		}
		if (typeof fact.value !== valueTypeOf[attrSchema.valueType]) {
			throw new Error(
				"Expected type `" +
					valueTypeOf[attrSchema.valueType] +
					"` for attribute `" +
					attrSchema.name +
					"`. Received type `" +
					typeof fact.value +
					"`."
			)
		}
	}

	// https://docs.datomic.com/on-prem/indexes.html
	// EAVT, get all attribute-values on an entity.
	// AEVT, get all values of a given attribute.
	// AVET, find entities with the same name, or enforce uniqueness.
	// VAET, reverse index for finding relationships.
	const indexes = ["eavto", "aevto", "aveto", "vaeto"]

	// Write to each index.
	const batchOps: Array<BatchOp> = []
	for (const fact of commitFacts) {
		const obj = {
			e: fact.entity,
			a: fact.attribute,
			v: fact.value,
			t: transactionId,
			o: Boolean(fact.remove),
		}
		for (const index of indexes) {
			batchOps.push({
				type: "put",
				key: [index, ...index.split("").map(key => obj[key])].join(SEP),
				value: fact.id,
			})
		}
	}

	await db.batch(batchOps)
}

export async function query(args: {
	db: LevelUp
	schema: Array<Attribute>
	find: Array<string>
	given: Bindings
	where: Array<Statement>
}) {
	// Datomic appears to run clauses in order.
	// https://docs.datomic.com/on-prem/best-practices.html#join-along
	// Level-Fact-Base appears to reorder statements.
	//
	// Lets try doing it in order first so its more deterministic.

	const { db, schema, find, given, where } = args

	// A mapping of all variables to their bound values.
	const bindings: Bindings = _.cloneDeep(given)

	for (const statement of where) {
		// Permute through all binding permutations.
		const bindingPermutations = permuteBindings(bindings)

		for (const binding of bindingPermutations) {
			// Resolve the binding.
			const boundStatement = statement.map(item => {
				const value = binding[item]
				if (value) {
					return value
				} else {
					return item
				}
			}) as Statement

			// Lookup the index we want.
			const [e, a, v] = boundStatement
			const queryType = [
				isVar(e) ? "_" : "e",
				isVar(a) ? "_" : "a",
				isVar(v) ? "_" : "v",
			].join("")

			// The the statement is fully specified, we can move on.
			if (queryType === "eav") {
				continue
			}

			// EAVT, get all attribute-values on an entity.
			// AEVT, get all values of a given attribute.
			// AVET, find entities with the same name, or enforce uniqueness.
			// VAET, reverse index for finding relationships.
			const indexLookup = {
				___: "eavto",

				e__: "eavto",
				ea_: "eavto",

				// This is querying all attributes with a certain value.
				// There should only be a finite number of attibutres.
				// If you're quering this, you're doing something wrong.
				e_v: undefined,

				_a_: "aevto",
				_av: "aveto",

				__v: "vaeto",
			}

			const index: string | undefined = indexLookup[queryType]
			if (!index) {
				throw new Error(
					"Missing index for query type `" +
						queryType +
						"` in statement + `[" +
						e +
						", " +
						a +
						", " +
						v +
						"]`."
				)
			}

			// Get the key prefix to scan across.
			const keyPrefix: Array<Value> = [index]
			const unknowns: { [key in keyof Fact]?: string } = {}
			if (isVar(e)) {
				unknowns.entity = e
			} else {
				keyPrefix.push(e)
			}
			if (isVar(a)) {
				unknowns.attribute = a
			} else {
				keyPrefix.push(a)
			}
			if (isVar(v)) {
				unknowns.value = v
			} else {
				keyPrefix.push(v)
			}

			const results: Array<CommittedFact> = []
			await range({
				db,
				prefix: keyPrefix.join(SEP),
				onData: ({ key, value }) => {
					const keyItems = key.split(SEP)
					// Get the values off the index.
					const [e, a, v, t, o] = "eavto"
						.split("")
						.map(x => keyItems[index.indexOf(x) + 1])
					results.push({
						id: value,
						entity: e,
						attribute: a,
						value: v,
						transaction: t,
						remove: JSON.parse(o),
					})
				},
			})

			const entityAttributeFacts = _.groupBy(
				results,
				fact => fact.entity + fact.attribute
			)
			for (const entityAttribute in entityAttributeFacts) {
				const facts = entityAttributeFacts[entityAttribute]

				// Get the attribute schema.
				const attrSchema = schema.find(attr => attr.name === a)
				if (!attrSchema) {
					throw new Error("Could not find schema for `" + a + "`.")
				}

				if (attrSchema.cardinality === "one") {
					// Get the latest transaction.
					const latestFact = _.maxBy(facts, fact =>
						parseInt(fact.transaction)
					) as CommittedFact
					// Add this fact to bindings for the unknowns.
					if (unknowns.entity) {
						if (bindings[unknowns.entity]) {
							bindings[unknowns.entity].push(latestFact.entity)
						} else {
							bindings[unknowns.entity] = [latestFact.entity]
						}
					}
					if (unknowns.attribute) {
						if (bindings[unknowns.attribute]) {
							bindings[unknowns.attribute].push(latestFact.attribute)
						} else {
							bindings[unknowns.attribute] = [latestFact.attribute]
						}
					}
					if (unknowns.value) {
						if (bindings[unknowns.value]) {
							bindings[unknowns.value].push(latestFact.value)
						} else {
							bindings[unknowns.value] = [latestFact.value]
						}
					}
				} else {
					// Filter out all the removals.
					const remove: Array<CommittedFact> = []
					const results: Array<CommittedFact> = []
					const sortedFacts = _.sortBy(
						facts,
						fact => -1 * parseInt(fact.transaction)
					)
					for (const fact of sortedFacts) {
						if (fact.remove) {
							remove.push(fact)
						} else if (
							!remove.some(
								f =>
									f.entity === fact.entity &&
									f.attribute === fact.attribute &&
									f.value === fact.value
							)
						) {
							results.push(fact)
						}
					}
					// Add this fact to bindings for the unknowns.
					if (unknowns.entity) {
						if (!bindings[unknowns.entity]) {
							bindings[unknowns.entity] = []
						}
						for (const fact of facts) {
							bindings[unknowns.entity].push(fact.entity)
						}
					}
					if (unknowns.attribute) {
						if (!bindings[unknowns.attribute]) {
							bindings[unknowns.attribute] = []
						}
						for (const fact of facts) {
							bindings[unknowns.attribute].push(fact.attribute)
						}
					}
					if (unknowns.value) {
						if (!bindings[unknowns.value]) {
							bindings[unknowns.value] = []
						}
						for (const fact of facts) {
							bindings[unknowns.value].push(fact.value)
						}
					}
				}
			}
		}
	}

	return find.map(unknown => bindings[unknown])
}

export async function range(args: {
	db: LevelUp
	prefix: string
	onData: (args: { key: string; value: string }) => void
}) {
	const { db, prefix, onData } = args
	const gte = prefix
	const lte = prefix + "\uffff"

	const stream = db.createReadStream({ gte: gte, lte: lte })

	let resolve, reject
	const promise = new Promise<void>((res, rej) => {
		resolve = res
		reject = rej
	})

	stream.on("error", reject)
	stream.on("end", resolve)
	stream.on("data", onData)

	return promise
}

export function d(
	entity: string,
	attribute: string,
	value: Value,
	remove?: boolean
): Fact {
	return {
		id: randomId(),
		entity,
		attribute,
		value,
		remove,
	}
}
