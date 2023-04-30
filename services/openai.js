const { Configuration, OpenAIApi } = require('openai');

const openAiKey = process.env.OPENAI_API_KEY;
console.log('openAiKey: ', openAiKey);

const configuration = new Configuration({
  apiKey: openAiKey,
});
const openai = new OpenAIApi(configuration);

const newGamePrompt = (category) => {
  return `Generate a trivia question in json format using a single property "question" for the category of ${category}, returning 4 possible answers under the property "options" along with whether each option is correct using a boolean property "isAnswer". Each option is in the format of "{ option, isAnswer }". Remove all line breaks from the json response and do not add a prefix to the json. Do not stringify the json.`;
};

const newGame = async (category) => {
  try {
    const prompt = newGamePrompt(category);
    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 800,
      temperature: 1.3,
    });
    let result = completion.data.choices[0].text
      .trim()
      .replace(/(\r\n|\n|\r)/gm, '');
    // Sometimes it uses a For example: in the response
    // if (result.startsWith('For example:')) {
    //   result = result.replace('For example:', '');
    // } else {
    //   result = result.charAt(0) !== '[' ? '[' + result : result;
    //   result = result.slice(-1) !== ']' ? result + ']' : result;
    // }
    console.log('result: ', result);
    const resp = JSON.parse(result);
    console.log('resp: ', resp);

    return resp;
  } catch (e) {
    return e;
  }
};

const parseForPlayer = (resp) => {
  // Remove the answer from the payload
  let options = resp.options.map((a) => a.option);
  return {
    ...resp,
    options,
  };
};

module.exports = {
  newGame,
  parseForPlayer,
};
