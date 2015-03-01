TESTS = test/*.test.js
REPORTER = tap
TIMEOUT = 3000
MOCHA_OPTS =

build:
	@node_modules/.bin/babel src --out-dir lib

install:
	@npm install --registry=http://registry.npm.taobao.org

autod: install
	@node_modules/.bin/autod -w --prefix="~" \
  -D mocha,istanbul-harmony,should
	@$(MAKE) install

.PHONY: test
