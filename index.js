const dns = require('node:dns');

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

// Root entry point for Cloud Deployment (Render / Railway / Heroku)
require('./apps/api/dist/main.js');

