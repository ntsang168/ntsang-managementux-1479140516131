module.exports = function(grunt) {

	grunt.initConfig({
		mochaTest : {
			testBDD : {
				options : {
					ui : 'bdd',
					reporter : 'xunit',
					reporterOptions: {'output' : 'mocha-tests-output-bdd.xml'},
					timeout: 20000
				},
				src : [ 'unit-test/bdd/*test.js' ]
			},
			test : {
				options : {
					ui : 'tdd',
					reporter : 'xunit',
					reporterOptions: {'output' : 'mocha-tests-output.xml'}
				},
				src : [ 'unit-test/*test.js' ]
			}
		}
	});

	grunt.loadNpmTasks('grunt-mocha-test');

	grunt.registerTask('test', ['mochaTest']);

};