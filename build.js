var bundle = require('browserify')({ standalone: 'LocalMedia' });
var fs = require('fs');

bundle.add('./index');
bundle.bundle().pipe(fs.createWriteStream('localMedia.bundle.js'));
