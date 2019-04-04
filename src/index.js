import axios from 'axios';
import { promises as fs } from 'fs';
import url from 'url';
import _ from 'lodash/fp';
import path from 'path';
import cheerio from 'cheerio';
import getAttribute from './properAttributes';

const editResourceName = (filePath) => {
  const [dir, ...format] = filePath.split('.');
  const dirDashed = _.kebabCase(dir);
  return [dirDashed, ...format].join('.');
};

export const editSourceLinks = (data, localResources, resourcesFolderName) => {
  const $ = cheerio.load(data);
  console.log(localResources);
  const edited = $('*').map((i, el) => {
    const { tagName } = $(el).get(0);
    const attribute = getAttribute(tagName);
    const attributeValue = $(el).attr(attribute);
    if (localResources.includes(attributeValue)) {
      $(el).attr(attribute, path.join(resourcesFolderName, editResourceName(attributeValue)));
    }
    return el;
  });
  return $(edited).html();
};

const createHtmlName = (link) => {
  const { hostname, pathname } = url.parse(link);
  return `${_.kebabCase(path.join(hostname, pathname))}.html`;
};

export const createResourcesFolderName = (dir, link) => {
  const { hostname, pathname } = url.parse(link);
  const folderName = `${_.kebabCase(path.join(hostname, pathname))}_files`;
  return path.join(dir, folderName);
};

export const gatherLocalResources = (data) => {
  const $ = cheerio.load(data);

  return $('*').filter((i, el) => {
    const { tagName } = $(el).get(0);
    const attribute = getAttribute(tagName);
    return attribute && $(el).attr(attribute);
  }).map((i, el) => {
    const { tagName } = $(el).get(0);
    const attribute = getAttribute(tagName);
    return $(el).attr(attribute);
  }).filter((i, el) => {
    const { protocol } = url.parse(el);
    return !protocol;
  })
    .get();
};

export default (dir, link) => {
  const htmlName = createHtmlName(link);
  const resourcesFolderName = createResourcesFolderName(dir, link);
  let localResources;
  return axios.get(link)
    .then(({ data }) => {
      localResources = gatherLocalResources(data);
      const editedData = editSourceLinks(data, localResources, resourcesFolderName);
      return editedData;
    })
    .then(data => fs.writeFile(path.join(dir, htmlName), data))
    .then(() => fs.mkdir(resourcesFolderName))
    .then(() => localResources.map((resourceName) => {
      const resourcePath = path.join(resourcesFolderName, editResourceName(resourceName));
      const myUrl = new URL(link);
      myUrl.pathname = resourceName;
      return axios.get(myUrl.href).then(({ data }) => fs.writeFile(resourcePath, data));
    }))
    .then(promises => Promise.all(promises));
};
