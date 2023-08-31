const { Configuration, OpenAIApi } = require('openai');

const openAiKey = process.env.OPENAI_API_KEY;
console.log('openAiKey: ', openAiKey);

const configuration = new Configuration({
  apiKey: openAiKey,
});
const openai = new OpenAIApi(configuration);

const newGamePrompt = (category) => {
  return `You can only respond in JSON format. Generate an interesting trivia question in Spanish on the topic of ${category}, returning 4 possible answers in Spanish under the property "options" along with whether each option is correct using a boolean property "isAnswer". Each option is in the format of "{ option, isAnswer }". Only one answer can be correct. The trivia question should be returned on the property "question". Additionally, provide a 2-3 sentence explanation for the answer using the property "answerContext". Also, add a property called "keywords" and provide 1 sentence explaining the answer. Remove all line breaks from the json response and do not add a prefix to the json. Do not stringify the json. Make sure the json string is wrapped in brackets.`;
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
    // console.log('result: ', result);
    const resp = JSON.parse(result);
    console.log('resp: ', resp);

    return resp;
  } catch (e) {
    console.log('an error occurred, try again');
    // return e;
    if (category) {
      return newGame(category);
    }
  }
};

const parseForPlayer = (resp) => {
  console.log('parseForPlayer resp: ', resp);
  // Remove the answer from the payload
  let options = resp.options?.map((a) => a.option);
  // Additionally remove the answerContext field
  delete resp.answerContext;
  delete resp.keywords;
  return {
    ...resp,
    options,
  };
};

module.exports = {
  newGame,
  parseForPlayer,
};
