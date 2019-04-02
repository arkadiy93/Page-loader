#!/usr/bin/env node
import program from 'commander';

program
  .version('0.0.1')
  .description('A page loading command line utility')
  .option('--output <link>', 'Dowload link')
  .action((link) => {
    console.log(link);
  });

program.parse(process.argv);
