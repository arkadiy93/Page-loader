#!/usr/bin/env node
import program from 'commander';
import pageLoader from '..';

program
  .version('0.0.1')
  .description('A page loading command line utility')
  .option('--output <path> <url>', 'dowload http page and save it to the requested path')
  .arguments('<path> <url>')
  .action((path, url) => {
    pageLoader(path, url);
  });

program.parse(process.argv);
