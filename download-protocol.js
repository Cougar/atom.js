var http = require('http');
var xml2json = require('xml2json');
var fs = require('fs');

var options = {
  host: 'svn.arune.se',
  port: 80,
  path: '/svn/HomeAutomation/trunk/Configuration/data.xml'
};

console.log('Fetching XML');
http.get(options, function(res) {
  var xml = '';

  console.log("Got response: " + res.statusCode);
  res.on('data', function(chunk) {
    xml += chunk;
  });
  res.on('end', function() {
    var json = xml2json.toJson(xml);
    fs.writeFileSync('protocol.json', json);
    console.log('done');
  });
}).on('error', function(e) {
  console.log("Got error: " + e.message);
});

