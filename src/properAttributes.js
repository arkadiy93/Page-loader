const attributes = {
  img: 'src',
  link: 'href',
  script: 'src',
};

export default tagName => attributes[tagName];
