var superagent = require('superagent');

superagent.get('http://www.google.com', function(err, res) {
  console.log(res.status);
  console.log(res.text);
});
