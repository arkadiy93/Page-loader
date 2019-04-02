# Page Loader
[![Build Status](https://travis-ci.org/arkadiy93/project-lvl3-s444.svg?branch=master)](https://travis-ci.org/arkadiy93/project-lvl3-s444)
[![Maintainability](https://api.codeclimate.com/v1/badges/141955a53372215a0df3/maintainability)](https://codeclimate.com/github/arkadiy93/project-lvl3-s444/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/141955a53372215a0df3/test_coverage)](https://codeclimate.com/github/arkadiy93/project-lvl3-s444/test_coverage)

A webpage downloading command line utility.

## Installation

Use the package manager [npm](https://www.npmjs.com/) to install page loader.

```bash
npm i hexlet-page-loader -g
```

## Usage

```python
page-loader -h

Usage: page-loader [options] <path> <url>

A page loading command line utility

Options:
  -V, --version          output the version number
  --output <path> <url>  dowload http page and save it to the requested path
  -h, --help             output usage information

```

```python
$ page-loader --output /var/tmp https://hexlet.io/courses
$ open /var/tmp/hexlet-io-courses.html

```
[![asciicast](https://asciinema.org/a/238489.svg)](https://asciinema.org/a/238489)
