var chai = require("chai"),
	chaiHttp = require("chai-http"),
	should = chai.should();

chai.use(chaiHttp);
var serverURL= "http://localhost:5990/hub/api";

describe("analyticsSpotlight", function() {
	describe("getSpotlightTicketsUpdatedKMM() default params", function() {
		it("should return an Object {count: x, kmm: {}}", function(done) {
			chai.request(serverURL)
				.get("/analytics/spotlight/ticketsupdatedkmm?start=2016-03-03&end=2016-03-04&output&response&type=&details&divisions&componentids&products")
				.end(function(err, res) {
					res.should.have.status(200);
					res.should.be.json;
					res.body.should.be.a("object");
					res.body.should.have.all.keys(["count", "kmm"]);
					done();
				});
		});

	});

	describe("getSpotlightTicketsUpdatedKMMCache() default params", function() {
		it("should return an Object {count: x, kmm: {}}", function(done) {
			chai.request(serverURL)
				.get("/analytics/spotlight/ticketsupdatedkmmcache?start=2016-03-03&end=2016-03-04&output&response&type=&divisions&componentids&products")
				.end(function(err, res) {
					res.should.have.status(200);
					res.should.be.json;
					res.body.should.be.a("object");
					res.body.should.have.all.keys(["count", "kmm"]);
					done();
				});
		});

	});
});