const { Pool } = require('pg')
const shared_functions = require('./shared_functions')
var my_pool
exports.db_functions = {

    initialize_pool: function () {
        try {
            my_pool = new Pool({
                host: process.env.PG_HOST,
                port: process.env.PG_PORT,
                database: process.env.PG_DB,
                user: process.env.PG_USER,
                password: process.env.PG_PW,
                max: process.env.PG_MAX_CONN,
                idleTimeoutMillis: process.env.PG_POOL_IDLE_TIMEOUT,
                connectionTimeoutMillis: process.env.PG_CONNECTION_TIMEOUT,
                query_timeout: process.env.PG_QUERY_TIMEOUT,
                statement_timeout: process.env.PG_STATEMENT_TIMEOUT,
                idle_in_transaction_session_timeout: process.env.PG_STATEMENT_IDLE_TIMEOUT,
                // Default behavior is the pool will keep clients open & connected to the backend 
                // until idleTimeoutMillis expire for each client and node will maintain a ref 
                // to the socket on the client, keeping the event loop alive until all clients are closed 
                // after being idle or the pool is manually shutdown with `pool.end()`.
                allowExitOnIdle: process.env.PG_ALLOW_EXIT_ON_IDLE
            })
            my_pool.on("connect", (client) => {
                //Whenever the pool establishes a new client connection to the PostgreSQL backend it will emit the connect event with the newly connected client
                //This presents an opportunity for you to run setup commands on a client.
                var host = ""
                var database = ""
                var usr = ""
                if (client.connectionParameters) {
                    host = client.connectionParameters.host
                    database = client.connectionParameters.database
                    usr = client.connectionParameters.user
                }
                console.log('POSTGRES::POOL::EVENT::CONNECT - ' + 'Database [' + database + '] for user [' + usr + '] on [' + host + ']' + ' - Total:[' + my_pool.totalCount + '] Idle:[' + my_pool.idleCount + '] Waiting:[' + my_pool.waitingCount + ']');

            });
            my_pool.on("acquire", (client) => {
                //Whenever a client is checked out from the pool the pool will emit the acquire event with the client that was acquired.
                var host = ""
                var database = ""
                var usr = ""
                if (client.connectionParameters) {
                    host = client.connectionParameters.host
                    database = client.connectionParameters.database
                    usr = client.connectionParameters.user
                }
                console.log('POSTGRES::POOL::EVENT::ACQUIRE - ' + 'Database [' + database + '] for user [' + usr + '] on [' + host + ']' + ' - Total:[' + my_pool.totalCount + '] Idle:[' + my_pool.idleCount + '] Waiting:[' + my_pool.waitingCount + ']');

            });
            my_pool.on("error", (err, client) => {
                //If the backend goes down or a network partition is encountered all the idle, connected clients in your application will emit an error through the pool's error event emitter
                var host = ""
                var database = ""
                var usr = ""
                if (client.connectionParameters) {
                    host = client.connectionParameters.host
                    database = client.connectionParameters.database
                    usr = client.connectionParameters.user
                }
                console.log('POSTGRES::POOL::EVENT::ERROR - ' + 'Database [' + database + '] for user [' + usr + '] on [' + host + ']' + ' - Error messsage:' + err);
            });
            my_pool.on("remove", (client) => {
                //Whenever a client is closed & removed from the pool the pool will emit the remove event.
                var host = ""
                var database = ""
                var usr = ""
                if (client.connectionParameters) {
                    host = client.connectionParameters.host
                    database = client.connectionParameters.database
                    usr = client.connectionParameters.user
                }
                console.log('POSTGRES::POOL::EVENT::REMOVED - ' + 'Database [' + database + '] for user [' + usr + '] on [' + host + ']' + ' - Total:[' + my_pool.totalCount + '] Idle:[' + my_pool.idleCount + '] Waiting:[' + my_pool.waitingCount + ']');
            });
        } catch (e) {
            var err_message = ('POSTGRES::POOL::EVENT::EXCEPTION - Try catch failed on - initialize_pool')
            console.log(err_message)
            console.log(e)
        }
    },

    async_query: async function (query_string, query_description) {
        try {
            var start_time = new Date();
            var database_name = my_pool.options.database
            var host_name = my_pool.options.host
            // Create a pg client and connects 
            const active_connection = await my_pool
                .connect()
                .then(function (result) {
                    return result;
                })
                .catch(function (err) {
                    var error_message = "Error creating 'active_connection' connection on 'my_pool' "
                    console.log(error_message)
                    return shared_functions.shared._return_object(error_message, true, 500);
                });
            if (active_connection.code) {
                if (active_connection.code === 500) {
                    var error_message = active_connection.jsonResult
                    console.log(error_message)
                    return shared_functions.shared._return_object(error_message, true, 500);
                }
            }
            const res = await active_connection.query(query_string)
                .then(function (result) {
                    var end_time = new Date();
                    var total_seconds = (end_time.getTime() - start_time.getTime()) / 1000;
                    var querytypestring = query_string.trim().substring(0, 3).toUpperCase();
                    var querytype = "";
                    switch (querytypestring) {
                        case "INS":
                            querytype = "INSERT";
                            break;
                        case "UPD":
                            querytype = "UPDATE";
                            break;
                        case "DEL":
                            querytype = "DELETE";
                            break;
                        default:
                            querytype = "SELECT";
                            break;
                    }
                    console.log("QUERY SUCCESS FOR " + querytype + ":  [" + database_name + "] on host [" + host_name + "] query [" + query_description + "] took " + total_seconds + " seconds.")

                    var return_obj = shared_functions.shared._return_object(result, false, 200);
                    if (querytype === "INSERT") {
                        if (result.rowCount) {
                            if (result.rowCount > 0) {
                                return_results = JSON.parse(JSON.stringify(result.rowCount + " row inserted."));
                            } else {
                                return_results = "None inserted."
                            }
                        } else {
                            return_results = "None inserted."
                        }
                        return_obj.jsonResult = return_results
                    } else if (querytype === "UPDATE") {
                        if (result.rowCount) {
                            if (result.rowCount > 0) {
                                return_results = JSON.parse(JSON.stringify(result.rowCount + " row updated."));
                            } else {
                                return_results = "None updated."
                            }
                        } else {
                            return_results = "None updated."
                        }
                        return_obj.jsonResult = return_results
                    } else if (querytype === "DELETE") {
                        if (result.rowCount) {
                            if (result.rowCount > 0) {
                                return_results = JSON.parse(JSON.stringify(result.rowCount + " row deleted."));
                            } else {
                                return_results = "None deleted."
                            }
                        } else {
                            return_results = "None deleted."
                        }
                        return_obj.jsonResult = return_results
                    } else {
                        if (result.rows.length > 0) {
                            if (result.rows.length === 1) {
                                return_results = JSON.parse(JSON.stringify(result.rows));
                                //return_results = JSON.parse(JSON.stringify(result.rows[0]));
                                return_obj.jsonResult = return_results
                            } else {
                                return_results = JSON.parse(JSON.stringify(result.rows));
                                return_obj.jsonResult = return_results
                            }
                        } else {
                            return_obj.jsonResult = JSON.parse(JSON.stringify("No records found."))
                            return_obj.haserror = true
                            return_obj.code = 404
                        }
                    }
                    return return_obj;
                })
                .catch(function (err) {
                    var err_message = err.message
                    var end_time = new Date();
                    var total_seconds = (end_time.getTime() - start_time.getTime()) / 1000;
                    var querytypestring = query_string.trim().substring(0, 3).toUpperCase();
                    var querytype = "";
                    switch (querytypestring) {
                        case "INS":
                            querytype = "INSERT";
                            break;
                        case "UPD":
                            querytype = "UPDATE";
                            break;
                        case "DEL":
                            querytype = "DELETE";
                            break;
                        default:
                            querytype = "SELECT";
                            break;
                    }
                    console.log("QUERY FAIL FOR " + querytype + ":  [" + database_name + "] on host [" + host_name + "] query [" + query_description + "] took " + total_seconds + " seconds " + " with: " + err_message)
                    var return_obj = shared_functions.shared._return_object(JSON.stringify(err_message), true, 400);
                    return return_obj;
                });


            active_connection.release()
            return res;

        } catch (e) {
            var err_message = ('POSTGRES::POOL::EVENT::EXCEPTION - Try catch failed on async_query')
            console.log(err_message)
            var return_obj = shared_functions.shared._return_object(JSON.stringify(err_message), true, 500);
            return return_obj;
        }
    },

    callback_query: function (query_string, query_description, callback) {
        try {
            var start_time = new Date();
            my_pool.query(query_string, (err, result) => {
                var database_name = my_pool.options.database
                var host_name = my_pool.options.host
                var return_results = "";
                if (err) {
                    var end_time = new Date();
                    var total_seconds = (end_time.getTime() - start_time.getTime()) / 1000;
                    var timeout_amount = (my_pool.options.query_timeout * 1) / 1000;
                    if (err.message === "Query read timeout") {
                        var timeout_msg = "QUERY FAILED : Database [" + database_name + "] on host [" + host_name + "] query [" + query_description + "] took " + total_seconds + " seconds and only " + timeout_amount + " seconds is allowed."
                        console.log(timeout_msg)
                        callback(timeout_msg, true, 408);
                    } else {
                        var err_msg = "QUERY FAILED : Database [" + database_name + "] on host [" + host_name + "] query [" + query_description + "] took " + total_seconds + " seconds, error occured: " + err.message + ""
                        console.log(err_msg)
                        callback(err_msg, true, 503); //Throws a 503
                    }
                } else {
                    var end_time = new Date();
                    var total_seconds = (end_time.getTime() - start_time.getTime()) / 1000;
                    var querytypestring = query_string.trim().substring(0, 3).toUpperCase();
                    var querytype = "";
                    switch (querytypestring) {
                        case "INS":
                            querytype = "INSERT";
                            break;
                        case "UPD":
                            querytype = "UPDATE";
                            break;
                        case "DEL":
                            querytype = "DELETE";
                            break;
                        default:
                            querytype = "SELECT";
                            break;
                    }
                    console.log("QUERY SUCCESS FOR " + querytype + ":  [" + database_name + "] on host [" + host_name + "] query [" + query_description + "] took " + total_seconds + " seconds.")


                    if (querytype === "INSERT") {
                        if (result.rowCount) {
                            if (result.rowCount > 0) {
                                return_results = JSON.parse(JSON.stringify(result.rowCount + " row inserted."));
                            } else {
                                return_results = "None inserted."
                            }
                        } else {
                            return_results = "None inserted."
                        }
                        callback(return_results, false, 201);
                    } else if (querytype === "UPDATE") {
                        if (result.rowCount) {
                            if (result.rowCount > 0) {
                                return_results = JSON.parse(JSON.stringify(result.rowCount + " row updated."));
                            } else {
                                return_results = "None updated."
                            }
                        } else {
                            return_results = "None updated."
                        }
                        callback(return_results, false, 200);
                    } else if (querytype === "DELETE") {
                        if (result.rowCount) {
                            if (result.rowCount > 0) {
                                return_results = JSON.parse(JSON.stringify(result.rowCount + " row deleted."));
                            } else {
                                return_results = "None deleted."
                            }
                        } else {
                            return_results = "None deleted."
                        }

                        callback(return_results, false, 200);
                    } else {
                        if (result.rows.length > 0) {
                            if (result.rows.length === 1) {
                                return_results = JSON.parse(JSON.stringify(result.rows));
                                //return_results = JSON.parse(JSON.stringify(result.rows[0]));
                                callback(return_results, false, 200);
                            } else {
                                return_results = JSON.parse(JSON.stringify(result.rows));
                                callback(return_results, false, 200);
                            }
                        } else {
                            callback(JSON.parse(JSON.stringify("No records found.")), true, 404);
                        }
                    }

                }
            })

        } catch (e) {
            var err_message = ('POSTGRES::POOL::EVENT::EXCEPTION - Try catch failed on callback_query')
            console.log(err_message)
            callback(err_message, true, 500);
        }

    },

}
