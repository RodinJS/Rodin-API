const redis = require('redis');
const Promise = require('bluebird');
const config = require('../config/env');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

const options = {
    host: process.env.REDIS_HOST  || config.redis.host,
    port: process.env.REDIS_PORT || config.redis.port,
    password: process.env.REDIS_PASSWORD || config.redis.password,
    db: config.redis.db.custom_domain,
};

const client = redis.createClient(options);

client.on('connect', () => {
    console.log('-----------------------');
    console.log('Redis Server Connected!');
    console.log('-----------------------');
});

client.on('error', err => {       
	console.error('Redis err: ', err.message)
	console.error('Redis err full: ', err)
}); 

let get = (key) => {
	return new Promise((resolve, reject) => {
		client.get(key, (err, reply) => {
			if(err || reply === null) {
				console.log('get error: ', err, reply);
				return resolve(false);
			} else {
				console.log("get -> ", reply.toString());
				return resolve(reply.toString());
			}
		});
	})
}

let set = (key, value, exp = null) => {
	return new Promise((resolve, reject) => {
		if(exp === null) {
			client.set(key, value, (err, reply) => {
				if(err || reply === null) {
					console.log('set error: ', err, reply);
					return reject(false);
				} else {
					console.log("set -> ", reply.toString());
					return resolve(true);
				}
			});
		} else {
			client.set(key, value, 'EX', exp, (err, reply) => {
				if(err || reply === null) {
					return reject(false);
					console.log('set error: ', err, reply);
				} else {
					console.log("set exp-> ", reply.toString());
					return resolve(true);
				}
			});
		}
	})
}

let remove = (key) => {
	return new Promise((resolve, reject) => {
		client.del(key, (err, reply) => {
			if(err || reply === null) {
				console.log('remove error: ', err, reply);
				return reject(false);
			} else {
				console.log("remove -> ", reply.toString());
				return resolve(true);
			}
		});
	})
}

module.exports = {
	get,
	set,
	remove
}







// //retry_strategy
// var client = redis.createClient({
//     retry_strategy: function (options) {
//         if (options.error && options.error.code === 'ECONNREFUSED') {
//             // End reconnecting on a specific error and flush all commands with
//             // a individual error
//             return new Error('The server refused the connection');
//         }
//         if (options.total_retry_time > 1000 * 60 * 60) {
//             // End reconnecting after a specific timeout and flush all commands
//             // with a individual error
//             return new Error('Retry time exhausted');
//         }
//         if (options.attempt > 10) {
//             // End reconnecting with built in error
//             return undefined;
//         }
//         // reconnect after
//         return Math.min(options.attempt * 100, 3000);
//     }
// });