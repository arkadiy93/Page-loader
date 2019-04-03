#!/usr/bin/env node
import program from 'commander';
import loadPage from '..';

program
  .version('0.0.1')
  .description('A page loading command line utility')
  .option('--output', 'Dowload link')
  .arguments('<path> <url>')
  .action((path, url) => {
    loadPage(path, url);
  });

program.parse(process.argv);
