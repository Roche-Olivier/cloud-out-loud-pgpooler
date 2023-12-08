# NodeJS - PG Pooler connection with STD out messages.
First draft

## ABOUT
- Wrapper method of Brian Carlson [Brian Carlson pg package](https://www.npmjs.com/package/pg) 
- PG Pooler connection with STD out messages.
- FIRST DRAFT

## Documentation & FAQ
The documentation & FAQ can be found at [Documentation and frequently asked questions (FAQ)](https://cloudoutloud.net/#/cloud-out-loud-pgpooler)  

## TL:DR
- This was created to easily implement a postgres connection with logs to the standard out feed.
- Add the following to the server.js document to set up the connection and details of the connections.
- These configurations can be added via the normal secure functions like K8s secrets or stores.
```
process.env.PG_HOST = "yourserver.rds.amazonaws.com"
process.env.PG_PORT = "30000"
process.env.PG_DB = "dbName"
process.env.PG_USER = "pg user"
process.env.PG_PW = "pg password"
process.env.PG_MAX_CONN = "1"
process.env.PG_POOL_IDLE_TIMEOUT = "30000"
process.env.PG_CONNECTION_TIMEOUT = "3000"
process.env.PG_QUERY_TIMEOUT = "3000"
process.env.PG_STATEMENT_TIMEOUT = "3000"
process.env.PG_STATEMENT_IDLE_TIMEOUT = "3000"
process.env.PG_ALLOW_EXIT_ON_IDLE = "true"
```
- Initialize the pooler in the server.js document, declare the package and initialize the pool for postgres
- This instantiates the pool with the server and will allow your applications to re-use pools
```
const pg_pooler = require('cloud-out-loud-pgpooler')
pg_pooler.db_functions.initialize_pool();
```
- The queries can then be used in your applications API's to access the database to serve your front end with database data.
- The code below would wait before returning the data, and will be used in sequentials calls
- Use the query as follows in your business logic layer.
```
const pg_pooler = require('cloud-out-loud-pgpooler')
exports.your_function = async function () {
    var qs = "SELECT version() as Health";
    var qd = "Health query"
    return await pg_pooler.db_functions.async_query(qs, qd)
};
```
- Below is a callback function that will return when the callback is done.
- The pool can also be called with a callback for example
```
const pg_pooler = require('cloud-out-loud-pgpooler')
pg_pooler.db_functions.callback_query(query_string, query_description, function(jsonResults, haserror, code) {
    callback(jsonResults, haserror, code);
}
```

## Source code
The source can be found at [Github](https://github.com/Roche-Olivier/cloud-out-loud-pgpooler)  

## Issues
Issues can be logged at [Github issues](https://github.com/Roche-Olivier/cloud-out-loud-pgpooler/issues)  


## License
Copyright (c) 2010-2030 Roche Olivier (roche.olivier@outlook.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.