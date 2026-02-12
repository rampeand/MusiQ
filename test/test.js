var supertest = require("supertest");
var should = require("should");

// This agent refers to PORT where the program is running.
// This agent refers to the app instance.
var server = supertest(require("../app"));

// UNIT test begin

describe("Index render test", function () {
  it("should return home page", function (done) {
    server
      .get("/")
      .expect("Content-type", /html/)
      .expect(200)
      .end(function (err, res) {
        res.status.should.equal(200);
        done();
      });
  });
});

describe("Player page render test", function () {
  it("should return player page for /player/:pid", function (done) {
    server
      .get("/player/TestPlaylist")
      .expect("Content-type", /html/)
      .expect(200)
      .end(function (err, res) {
        res.status.should.equal(200);
        done();
      });
  });
});

describe("Queue page render test", function () {
  it("should return queue page for /queue/:pid", function (done) {
    server
      .get("/queue/TestPlaylist")
      .expect("Content-type", /html/)
      .expect(200)
      .end(function (err, res) {
        res.status.should.equal(200);
        done();
      });
  });
});

describe("Admin page render test", function () {
  it("should return admin page for /admin", function (done) {
    server
      .get("/admin")
      .expect("Content-type", /html/)
      .expect(200)
      .end(function (err, res) {
        res.status.should.equal(200);
        done();
      });
  });
});

describe("Backward-compat player3 route test", function () {
  it("should return player page for /player3/:pid", function (done) {
    server
      .get("/player3/TestPlaylist")
      .expect("Content-type", /html/)
      .expect(200)
      .end(function (err, res) {
        res.status.should.equal(200);
        done();
      });
  });
});

describe("Backward-compat search3 route test", function () {
  it("should return player page for /search3/:pid", function (done) {
    server
      .get("/search3/TestPlaylist")
      .expect("Content-type", /html/)
      .expect(200)
      .end(function (err, res) {
        res.status.should.equal(200);
        done();
      });
  });
});