#!/usr/bin/env node
import program from 'commander';
import loadPage from '..';
import debug from 'debug';

const log = debug('page-loader');

program
  .version('0.0.2')
  .description('A page loading command line utility')
  .option('--output [path]', 'Dowload link')
  .arguments('<url>')
  .action((url, option) => {
    log('booting application');
    loadPage(option.output, url)
      .then(fileName => console.log(`Page was downloaded as '${fileName}'`))
      .catch((error) => {
        console.error(error);
        process.exit(error.errno);
      });
  });

program.parse(process.argv);
