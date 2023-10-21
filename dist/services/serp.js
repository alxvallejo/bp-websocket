"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// 6f5cfa676da1b809bd9223edd3ce21c480b6fa06c8638576dee4e8c2bb77f11e
const SerpApi = require('google-search-results-nodejs');
const search = new SerpApi.GoogleSearch('6f5cfa676da1b809bd9223edd3ce21c480b6fa06c8638576dee4e8c2bb77f11e');
const searchGoogleImages = (keywords) => __awaiter(void 0, void 0, void 0, function* () {
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
            search.json(query_params, (result) => {
                console.log('result: ', result);
                const { images_results } = result;
                if (images_results.length > 5) {
                    resolve(images_results.slice(0, 4));
                }
                else {
                    resolve(images_results);
                }
            });
        }
        catch (e) {
            resolve(null);
        }
    });
});
module.exports = {
    searchGoogleImages,
};
