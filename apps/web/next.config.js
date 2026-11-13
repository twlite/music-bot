const path = require('node:path');
/** @type {import('next').NextConfig} */
module.exports = { output: 'standalone', outputFileTracingRoot: path.join(__dirname, '../..') };
