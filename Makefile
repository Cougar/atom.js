TESTS = test/*.js
SRC = $(shell find lib -name "*.js" -type f | sort)

test:
	@./node_modules/.bin/mocha ${TESTS}

lint:
	@./node_modules/.bin/jshint ${SRC}

.PHONY: test lint
