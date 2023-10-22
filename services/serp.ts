// 6f5cfa676da1b809bd9223edd3ce21c480b6fa06c8638576dee4e8c2bb77f11e
const SerpApi = require('google-search-results-nodejs');
const search = new SerpApi.GoogleSearch(
  '6f5cfa676da1b809bd9223edd3ce21c480b6fa06c8638576dee4e8c2bb77f11e'
);

const searchGoogleImages = async (keywords: string) => {
  console.log('keywords: ', keywords);
  if (!keywords) {
    return;
  }
  const query_params = {
    safe: 'active',
    q: keywords,
    num: '5',
    tbm: 'isch',
  };
  return new Promise((resolve) => {
    try {
      search.json(query_params, (result: any) => {
        console.log('result: ', result);
        const { images_results } = result;
        if (images_results.length > 5) {
          resolve(images_results.slice(0, 4));
        } else {
          resolve(images_results);
        }
      });
    } catch (e) {
      resolve(null);
    }
  });
};

module.exports = {
  searchGoogleImages,
};
