const i18n = require('i18n');
const path = require('path');

i18n.configure({
  locales: ['en', 'es', 'hi', 'ta'],
  directory: path.join(__dirname, '../locales'),
  defaultLocale: 'en',
  cookie: 'lang',
  objectNotation: true,
  syncFiles: true,
  autoReload: true
});

console.log('i18n configured with locales:', i18n.getLocales());
module.exports = i18n;