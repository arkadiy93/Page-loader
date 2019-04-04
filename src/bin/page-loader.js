#!/usr/bin/env node
import program from 'commander';
import loadPage from '..';

program
  .version('0.0.1')
  .description('A page loading command line utility')
  .option('--output [path]', 'Dowload link')
  .arguments('<url>')
  .action((path, options) => {
    loadPage(path, options.output);
  });

program.parse(process.argv);
