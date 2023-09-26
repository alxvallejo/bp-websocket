// const { Configuration, OpenAIApi } = require('openai');
// import OpenAI from 'openai';
const OpenAI = require('openai');

const openAiKey = process.env.OPENAI_API_KEY;
console.log('openAiKey: ', openAiKey);

// const configuration = new Configuration({
//   apiKey: openAiKey,
// });
// const openai = new OpenAIApi(configuration);

const openai = new OpenAI({
  apiKey: openAiKey, // defaults to process.env["OPENAI_API_KEY"]
});

const newGamePrompt = (category) => {
  return `You can only respond in JSON format. Generate an interesting trivia question on the subject of ${category}, returning 4 possible answers under the property "options". Each option should have a boolean property "isAnswer". Each option should have a property "option". Only one answer can be correct. The trivia question should be returned on the property "question". Additionally, provide a 2-3 sentence explanation for the answer using the property "answerContext". Also, add a property called "keywords" and provide 1 sentence explaining the answer. Remove all line breaks from the json response and do not add a prefix to the json. Do not stringify the json. Make sure the json result is an object.`;
};

const newGame = async (category) => {
  try {
    const prompt = newGamePrompt(category);
    const completion = await openai.chat.completions.create({
      // model: 'text-davinci-003',
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      // prompt,
      max_tokens: 800,
      temperature: 1.3,
    });
    console.log('completion: ', completion);
    let result = completion.choices[0].message.content
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

    if (Array.isArray(resp)) {
      return resp[0];
    }

    return resp;
  } catch (e) {
    console.log('an error occurred, try again', e);
    // return e;
    debugger;
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
