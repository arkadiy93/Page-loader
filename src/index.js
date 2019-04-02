import axios from 'axios';
import { promises as fs } from 'fs';
import url from 'url';
import _ from 'lodash/fp';
import path from 'path';

const createFileName = (link) => {
  const { hostname, pathname } = url.parse(link);
  return `${_.kebabCase(path.join(hostname, pathname))}.html`;
};

export default (dir, link) => {
  const fileName = createFileName(link);
  return axios.get(link)
    .then(({ data }) => {
      fs.writeFile(path.join(dir, fileName), data);
    });
};
