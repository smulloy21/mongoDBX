var app = require('./server');
var assert = require('assert');
var superagent = require('superagent');

describe('server', function() {
  var server;

  beforeEach(function() {
    server = app().listen(3000);
  });

  afterEach(function(){
    server.close();
  });

  it('prints "Hello!" on /', function(done){
    superagent.get('http://localhost:3000/', function(error, res){
      assert.ifError(error);
      assert.equal(res.status, 200);
      assert.equal(res.text, "Hello!");
      done();
    });
  });

  it('prints user page on /user/:user', function(done){
    superagent.get('http://localhost:3000/user/mongodb/', function(error, res){
      assert.ifError(error);
      assert.equal(res.status, 200);
      assert.equal(res.text, "Page for user mongodb with option undefined");
      done();
    });
  });

  it('prints query option on /user/:user?...', function(done){
    superagent.get('http://localhost:3000/user/mongodb?option=test', function(error, res){
      assert.ifError(error);
      assert.equal(res.status, 200);
      assert.equal(res.text, "Page for user mongodb with option test");
      done();
    });
  });
});
