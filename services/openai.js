const { Configuration, OpenAIApi } = require('openai');

const openAiKey = process.env.OPENAI_API_KEY;
console.log('openAiKey: ', openAiKey);

const configuration = new Configuration({
  apiKey: openAiKey,
});
const openai = new OpenAIApi(configuration);

const newGamePrompt = `Generate 4 different trivia questions, each with 4 possible answer options, and define categories in the format of jeopardy for each, returning the list of questions in json format along with whether each option is correct using a boolean property "isAnswer". Remove all line breaks from the json response.`;

const newGame = async () => {
  try {
    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: newGamePrompt,
      max_tokens: 800,
      temperature: 1.3,
    });
    let result = completion.data.choices[0].text
      .trim()
      .replace(/(\r\n|\n|\r)/gm, '');
    console.log('result: ', result);
    result = result.charAt(0) !== '[' ? '[' + result : result;

    const resp = result;
    return resp;
  } catch (e) {
    return e;
  }
};

const parseForPlayer = (resp) => {
  const type = typeof resp;
  console.log('type: ', type);
  // const { options } = resp
  return resp;
};

module.exports = {
  newGame,
  parseForPlayer,
};
