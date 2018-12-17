# P2P Chat

Goal: Peer to peer chat messaging using a datalog-like database.


database refactor
- no classes, thats just confusing.
- tests along the way. simpler types.

---

- build database basics, indexes, queries
- test database funtionality
- device and use identity model
- database sync

---

- use simple-peer and a signalhub to connect users
- create a simple datalog database with the various indexes. no query language yet.
- create crypto keys, save in local storage.
- sync databases.

---

- schema validation before commiting to the db
- schema updating
- verify every transaction has been received.

- database as of transaction is an interesting pattern.

---

- wrap in an electron app with leveldb.
- create a query language with a permissioning model.
- live query listeners.
- multiple device sync.

## Notes

- TypeScript classes offer more type power than plain object. But don't be confused, this code is not "object-oriented". In fact, its very functional.

- Database is a Datalog flavor, very much inspired by Datomic and [level-fact-base](https://github.com/smallhelm/level-fact-base).