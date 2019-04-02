install:
	npm install

run:
	npx babel-node 'src/bin/page-loader.js' --output /var/tmp https://hexlet.io/courses

runh:
		npx babel-node 'src/bin/page-loader.js' -h

publish:
	npm publish

lint:
	npx eslint .

test:
	npm test

.PHONY: test
