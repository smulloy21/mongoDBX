var assert = require('assert');
var express = require('express');
var status = require('http-status');
var superagent = require('superagent');
var wagner = require('wagner-core');

var URL_ROOT = 'http://localhost:3000';
var PRODUCT_ID = '000000000000000000000001';

describe('Category API', function() {
  var server;
  var Category;
  var Product;
  var User;

  before(function() {
    var app = express();

    // Bootstrap server
    models = require('./models')(wagner);

    // Make models available in tests
    Category = models.Category;
    Product = models.Product;
    User = models.User;

    app.use(function(req, res, next) {
      User.findOne({}, function(error, user) {
        assert.ifError(error);
        req.user = user;
        next();
      });
    });

    app.use(require('./api')(wagner));

    server = app.listen(3000);
  });

  after(function() {
    // Shut the server down when we're done
    server.close();
  });

  beforeEach(function(done) {
    // Make sure categories are empty before each test
    Category.remove({}, function(error) {
      assert.ifError(error);
      Product.remove({}, function(error) {
        assert.ifError(error);
        User.remove({}, function(error) {
          assert.ifError(error);
          done();
        });
      });
    });
  });

  beforeEach(function(done) {
    var categories = [
      { _id: 'Electronics' },
      { _id: 'Phones', parent: 'Electronics' },
      { _id: 'Laptops', parent: 'Electronics' },
      { _id: 'Bacon' }
    ];

    var products = [
      {
        name: 'LG G4',
        category: { _id: 'Phones', ancestors: ['Electronics', 'Phones'] },
        price: {
          amount: 300,
          currency: 'USD'
        }
      },
      {
        _id: PRODUCT_ID,
        name: 'Asus Zenbook Prime',
        category: { _id: 'Laptops', ancestors: ['Electronics', 'Laptops'] },
        price: {
          amount: 2000,
          currency: 'USD'
        }
      },
      {
        name: 'Flying Pigs Farm Pasture Raised Pork Bacon',
        category: { _id: 'Bacon', ancestors: ['Bacon'] },
        price: {
          amount: 20,
          currency: 'USD'
        }
      }
    ];

    var users = [{
      profile: {
        username: 'vkarpov15',
        picture: 'http://pbs.twimg.com/profile_images/550304223036854272/Wwmwuh2t.png'
      },
      data: {
        oauth: 'invalid',
        cart: []
      }
    }];

    Category.create(categories, function(error) {
      assert.ifError(error);
      Product.create(products, function(error) {
        assert.ifError(error);
        User.create(users, function(error) {
          assert.ifError(error);
          done();
        });
      });
    });
  });

  it('can load a category by id', function(done) {
    //Create a single category
    Category.create({ _id: 'Apparel' }, function(error, doc) {
      assert.ifError(error);
      var url = URL_ROOT + '/category/id/Apparel';
      // Make an HTTP request to localhost:3000/category/id/Apparel
      superagent.get(url, function(error, res) {
        assert.ifError(error);
        var result;
        // And make sure we got { _id: 'Apparel' } back
        assert.doesNotThrow(function() {
          result = JSON.parse(res.text);
        });
        assert.ok(result.category);
        assert.equal(result.category._id, 'Apparel');
        done();
      });
    });
  });

  it('can load all categories that have a certain parent', function(done) {
    var url = URL_ROOT + '/category/parent/Electronics';
    // Make an HTTP request to localhostL3000/category/parent/Electronics
    superagent.get(url, function(error, res) {
      assert.ifError(error);
      var result;
      assert.doesNotThrow(function() {
        result = JSON.parse(res.text);
      });
      assert.equal(result.categories.length, 2);
      // Should be in ascending order by _id
      assert.equal(result.categories[0]._id, 'Laptops');
      assert.equal(result.categories[1]._id, 'Phones');
      done();
    });
  });

  it('can load a product by id', function(done) {
    var url = URL_ROOT + '/product/id/' + PRODUCT_ID;
    // Make an HTTP request to
    // 'localhost:3000/product/id/000000000000000000000001'
    superagent.get(url, function(error, res) {
      assert.ifError(error);
      var result;
      // And make sure we got the LG G$ back
      assert.doesNotThrow(function() {
        result = JSON.parse(res.text);
      });
      assert.ok(result.product);
      assert.equal(result.product._id, PRODUCT_ID);
      assert.equal(result.product.name, 'Asus Zenbook Prime');
      done();
    });
  });

  it('can load all products in a category with sub-categories', function(done) {
    var url = URL_ROOT + '/product/category/Electronics';
    // Make an HTTP request to localhost:3000/product/ancestor/Electronics
    superagent.get(url, function(error, res) {
      assert.ifError(error);
      var result;
      assert.doesNotThrow(function() {
        result = JSON.parse(res.text);
      });
      assert.equal(result.products.length, 2);
      // Should be in ascending order by name
      assert.equal(result.products[0].name, 'Asus Zenbook Prime');
      assert.equal(result.products[1].name, 'LG G4');

      // Sort by price ascending
      var url = URL_ROOT + '/product/category/Electronics?price=1';
      superagent.get(url, function(error, res) {
        assert.ifError(error);
        var result;
        assert.doesNotThrow(function() {
          result = JSON.parse(res.text);
        });
        assert.equal(result.products.length, 2);
        assert.equal(result.products[0].name, 'LG G4');
        assert.equal(result.products[1].name, 'Asus Zenbook Prime');
        done();
      });
    });
  });

  it('can save item to users cart', function(done) {
    var url = URL_ROOT + '/me/cart';
    superagent.put(url).send({
      data: {
        cart: [{ product: PRODUCT_ID, quantity: 1 }]
      }
    }).end(function(error, res) {
      assert.ifError(error);
      assert.equal(res.status, status.OK);
      User.findOne({}, function(error, user) {
        assert.ifError(error);
        assert.equal(res.status, status.OK);
        assert.equal(user.data.cart[0].product, PRODUCT_ID);
        assert.equal(user.data.cart[0].quantity, 1);
        done();
      });
    });
  });

  it('can load users cart', function(done) {
    var url = URL_ROOT + '/me';

    User.findOne({}, function(error, user) {
      assert.ifError(error);
      user.data.cart = [{ product: PRODUCT_ID, quantity: 1 }];
      user.save(function(error) {
        assert.ifError(error);

        superagent.get(url, function(error, res) {
          assert.ifError(error);

          assert.equal(res.status, 200);
          var result;
          assert.doesNotThrow(function() {
            result = JSON.parse(res.text).user;
          });
          assert.equal(result.data.cart.length, 1);
          assert.equal(result.data.cart[0].product.name, 'Asus Zenbook Prime');
          assert.equal(result.data.cart[0].quantity, 1);
          done();
        });
      });
    });
  });
});
