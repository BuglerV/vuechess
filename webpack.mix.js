let mix = require('laravel-mix');

mix.sass('scss/index.scss', 'dist');

mix.js('js/index.js','dist').vue();