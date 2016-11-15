var chai = require("chai"),
	chaiHttp = require("chai-http"),
	should = chai.should();

chai.use(chaiHttp);
var serverURL= "http://localhost:5990/hub/api";

describe("analytics", function() {
	describe("getTicketsUpdatedKMM() default params", function() {
		it("should return an Object {count: x, kmm: {}}", function(done) {
			chai.request(serverURL)
				.get("/analytics/ticketsupdatedkmm?start=2016-03-03&end=2016-03-04&limit&output=&response&type&details&divisions&componentids&products&spotlight=true")
				.end(function(err, res) {
					res.should.have.status(200);
					res.should.be.json;
					res.body.should.be.a("object");
					res.body.should.have.all.keys(["count", "kmm"]);
					done();
				});
		});

	});

	describe("getTicketsUpdatedKMMCache() default params", function() {
		it("should return an Object {count: x, kmm: {}}", function(done) {
			chai.request(serverURL)
				.get("/analytics/ticketsupdatedkmmcache?start=2016-03-03&end=2016-03-04&output=&response&type&divisions&componentids&products&spotlight=true")
				.end(function(err, res) {
					res.should.have.status(200);
					res.should.be.json;
					res.body.should.be.a("object");
					res.body.should.have.all.keys(["count", "kmm"]);
					done();
				});
		});

	});

	describe("getTicketAnswersResponses() default params", function() {
		it("should return an Object {count: x, tickets: {}}", function(done) {
			chai.request(serverURL)
				.get("/analytics/ticketanswersresponses?start=2016-03-01&end=2016-03-02&limit=&type&status=&whitelist=&divisions&componentids=5725A54ST,5724W12AD,5724W12IC&products")
				.end(function(err, res) {
					res.should.have.status(200);
					res.should.be.json;
					res.body.should.be.a("object");
					res.body.should.have.all.keys(["count", "tickets"]);
					done();
				});
		});

	});
});