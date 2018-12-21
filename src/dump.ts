import { LevelUp } from "levelup"
import * as level from "level"

const db: LevelUp = level("test.db")

const stream = db.createReadStream({
	gte: "aveto|person/name",
	lte: "aveto|person/name\uffff",
	// lte: "aveto|person/name|Chet",
})
stream.on("data", data => {
	console.log("data", data)
})
