# Datalog In JS

This is an implementation of Datalogl, similar to DataScript and Datomic, but in TypeScript.

## To Do

- more tests
- think about performance a little bit
- explain option for query which says what happens

- fix up the mess with keys - everything must be a string now, no numbers.
- serialize and deserialize the separator character. maybe just use json stringify without the []

- how can we verify the database?
	- hash transactions ids?

- how do we determine the "latest" transaction without an autoincrementing transaction id?

- query the historical database using transaction data.

- download the music dataset and run through the datomic tutorials
- short explainer about how this all works with resources on learning.

- enforce uniqueness constraints
- implement noHistory
- redacting singular facts

- abstractions for composing query functions

- generalizable indexes
	- custom indexes for n^2 queries

- live query listeners.

- database syncing
	- authentication and permissioning

## Notes

- [level-fact-base](https://github.com/smallhelm/level-fact-base).