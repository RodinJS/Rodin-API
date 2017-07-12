const path = require('path');

const env = process.env.NODE_ENV || 'local';
const config = require(`./${env}`);

const defaults = {
  root: path.join(__dirname, '/..'),
};

Object.assign(defaults, config);


module.exports =  defaults;