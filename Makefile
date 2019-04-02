install:
	npm install

run:
	npx babel-node 'src/bin/page-loader.js' --output /var/tmp https://hexlet.io/courses

publish:
	npm publish

lint:
	npx eslint .

test:
	DEBUG=page-loader npm test

.PHONY: test
