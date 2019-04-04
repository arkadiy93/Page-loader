#!/usr/bin/env node
import program from 'commander';
import loadPage from '..';
import debuger from 'debug';

const debug = debuger('page-loader');

program
  .version('0.0.2')
  .description('A page loading command line utility')
  .option('--output [path]', 'Dowload link')
  .arguments('<url>')
  .action((url, option) => {
    debug('booting application');
    loadPage(option.output, url);
  });

program.parse(process.argv);
