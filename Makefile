install:
	npm install

run:
	npx babel-node 'src/bin/page-loader.js' --output /var/tmp https://www.w3schools.com/w3css/

runh:
	npx babel-node 'src/bin/page-loader.js' -h

publish:
	npm publish

lint:
	npx eslint .

test:
	DEBUG=page-loader* npm test

.PHONY: test
