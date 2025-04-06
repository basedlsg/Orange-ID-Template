  Why you should do it regularly: https://github.com/browserslist/update-db#readme
8:28:55 AM [express] GET /api/database-type 200 in 2ms :: {"type":"sqlite"}
8:29:41 AM [express] GET /api/database-type 200 in 1ms :: {"type":"sqlite"}
Checking admin status for explicit orangeId: q1nl0ez4quoa0expdzs31n50o
8:30:21 AM [express] GET /api/users/check-admin 404 in 3ms :: {"error":"User not found"}
Received user data: {
  orangeId: 'q1nl0ez4quoa0expdzs31n50o',
  username: 'yo beve',
  role: 'user',
  email: 'contact@yobeve.com'
}
Validated user data: {
  orangeId: 'q1nl0ez4quoa0expdzs31n50o',
  username: 'yo beve',
  email: 'contact@yobeve.com',
  role: 'user'
}
Database operation error: TypeError: value.toISOString is not a function
    at PgTimestamp.mapToDriverValue (/home/runner/workspace/node_modules/src/pg-core/columns/timestamp.ts:66:16)
    at <anonymous> (/home/runner/workspace/node_modules/src/sql/sql.ts:223:69)
    at Array.map (<anonymous>)
    at SQL.buildQueryFromSourceParams (/home/runner/workspace/node_modules/src/sql/sql.ts:148:30)
    at <anonymous> (/home/runner/workspace/node_modules/src/sql/sql.ts:170:17)
    at Array.map (<anonymous>)
    at SQL.buildQueryFromSourceParams (/home/runner/workspace/node_modules/src/sql/sql.ts:148:30)
    at <anonymous> (/home/runner/workspace/node_modules/src/sql/sql.ts:174:17)
    at Array.map (<anonymous>)
    at SQL.buildQueryFromSourceParams (/home/runner/workspace/node_modules/src/sql/sql.ts:148:30)
    at <anonymous> (/home/runner/workspace/node_modules/src/sql/sql.ts:124:23)
    at Object.startActiveSpan (/home/runner/workspace/node_modules/src/tracing.ts:27:11)
    at SQL.toQuery (/home/runner/workspace/node_modules/src/sql/sql.ts:123:17)
    at SQLiteSyncDialect.sqlToQuery (/home/runner/workspace/node_modules/src/sqlite-core/dialect.ts:502:14)
    at QueryPromise._prepare (/home/runner/workspace/node_modules/src/sqlite-core/query-builders/insert.ts:380:17)
    at QueryPromise.all (/home/runner/workspace/node_modules/src/sqlite-core/query-builders/insert.ts:396:15)
    at QueryPromise.execute (/home/runner/workspace/node_modules/src/sqlite-core/query-builders/insert.ts:408:40)
    at QueryPromise.then (/home/runner/workspace/node_modules/src/query-promise.ts:31:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
Falling back to mock DB for this operation
Error in db.createUser: TypeError: value.toISOString is not a function
    at PgTimestamp.mapToDriverValue (/home/runner/workspace/node_modules/src/pg-core/columns/timestamp.ts:66:16)
    at <anonymous> (/home/runner/workspace/node_modules/src/sql/sql.ts:223:69)
    at Array.map (<anonymous>)
    at SQL.buildQueryFromSourceParams (/home/runner/workspace/node_modules/src/sql/sql.ts:148:30)
    at <anonymous> (/home/runner/workspace/node_modules/src/sql/sql.ts:170:17)
    at Array.map (<anonymous>)
    at SQL.buildQueryFromSourceParams (/home/runner/workspace/node_modules/src/sql/sql.ts:148:30)
    at <anonymous> (/home/runner/workspace/node_modules/src/sql/sql.ts:174:17)
    at Array.map (<anonymous>)
    at SQL.buildQueryFromSourceParams (/home/runner/workspace/node_modules/src/sql/sql.ts:148:30)
    at <anonymous> (/home/runner/workspace/node_modules/src/sql/sql.ts:124:23)
    at Object.startActiveSpan (/home/runner/workspace/node_modules/src/tracing.ts:27:11)
    at SQL.toQuery (/home/runner/workspace/node_modules/src/sql/sql.ts:123:17)
    at SQLiteSyncDialect.sqlToQuery (/home/runner/workspace/node_modules/src/sqlite-core/dialect.ts:502:14)
    at QueryPromise._prepare (/home/runner/workspace/node_modules/src/sqlite-core/query-builders/insert.ts:380:17)
    at QueryPromise.all (/home/runner/workspace/node_modules/src/sqlite-core/query-builders/insert.ts:396:15)
    at QueryPromise.execute (/home/runner/workspace/node_modules/src/sqlite-core/query-builders/insert.ts:408:40)
    at QueryPromise.then (/home/runner/workspace/node_modules/src/query-promise.ts:31:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
Created user: {
  id: 3,
  orange_id: 'q1nl0ez4quoa0expdzs31n50o',
  username: 'yo beve',
  email: 'contact@yobeve.com',
  role: 'user',
  is_admin: 0,
  created_at: '2025-04-06T08:30:21.426Z'
}
8:30:21 AM [express] POST /api/users 200 in 51ms :: {"id":3,"orange_id":"q1nl0ez4quoa0expdzs31n50o",…
Received user data: {
  orangeId: 'q1nl0ez4quoa0expdzs31n50o',
  username: 'yo beve',
  role: 'user',
  email: 'contact@yobeve.com'
}
Validated user data: {
  orangeId: 'q1nl0ez4quoa0expdzs31n50o',
  username: 'yo beve',
  email: 'contact@yobeve.com',
  role: 'user'
}
User already exists, returning existing user: {
  id: 3,
  orangeId: 'q1nl0ez4quoa0expdzs31n50o',
  username: 'yo beve',
  email: 'contact@yobeve.com',
  role: 'user',
  isAdmin: 0,
  createdAt: Invalid Date
}
8:30:21 AM [express] POST /api/users 200 in 2ms :: {"id":3,"orangeId":"q1nl0ez4quoa0expdzs31n50o","u…
Checking admin status for explicit orangeId: q1nl0ez4quoa0expdzs31n50o