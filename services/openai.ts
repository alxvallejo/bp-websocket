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

// const get_trivia_question(category) {

// }

const getFunctions = () => {
  return [
    {
      name: 'parse_trivia_question',
      description: 'Format the trivia question',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The trivia question',
          },
          options: {
            type: 'array',
            description:
              'The 4 possible options to the question with only one being correct.',
            items: {
              type: 'object',
              description: 'An answer choice to the trivia question.',
              properties: {
                option: {
                  type: 'string',
                  description: 'The answer choice text.',
                },
                isAnswer: {
                  type: 'boolean',
                  description: 'Whether or not the option is the answer.',
                },
              },
            },
          },
          answerContext: {
            type: 'string',
            description: 'A description of the answer.',
          },
          keywords: {
            type: 'string',
            description: 'Some keywords that describe the answer.',
          },
        },
      },
      required: ['question', 'options', 'answerContext', 'keywords'],
    },
  ];
};

// const newGamePrompt = (category) => {
//   return `You can only respond in JSON format with no line breaks and no text before the JSON. All answers must be in English. Generate an interesting trivia question on the subject of ${category}, returning 4 possible answers under the property "options". Each option should have a boolean property "isAnswer". Each option should have a property "option" and should contain only text. Only one answer can be correct. The trivia question should be returned on the property "question". Additionally, provide a 2-3 sentence explanation for the answer using the property "answerContext". Also, add a property called "keywords" and provide 1 sentence explaining the answer. Remove all line breaks from the json response and do not add a prefix to the json. Do not stringify the json. Make sure the json result is an object.`;
// };

const newGamePrompt = (subject: string) => {
  return `Given the topic ${subject}, generate a random trivia question that is fun and interesting along with 4 possible answers and provide some context on the answer.`;
};

const tryAgain = async (category: string) => {
  try {
    const prompt = `Pick a different trivia question on the topic of ${category}.`;
    console.log(`Trying again for ${category}...`);
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 1.7,
      functions: getFunctions(),
    });
    console.log('completion: ', completion);
    let result = completion.choices[0].message.function_call?.arguments
      .trim()
      .replace(/(\r\n|\n|\r)/gm, '');
    console.log('result: ', result);
    if (Object.keys(result).length === 0) {
      return newGame(category);
    }
    const resp = JSON.parse(result);
    console.log('resp: ', resp);
    if (Array.isArray(resp)) {
      return resp[0];
    }
    return resp;
  } catch (e) {
    console.log('an error occurred, try again', e);
    if (category) {
      return newGame(category);
    }
  }
};

const newGame = async (category: string): Promise<any> => {
  try {
    const prompt = newGamePrompt(category);
    console.log(`Looking up new completion for ${category}...`);
    const completion = await openai.chat.completions.create({
      // model: 'text-davinci-003',
      // model: 'gpt-4',
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      // prompt,
      max_tokens: 800,
      temperature: 1.7,
      functions: getFunctions(),
    });
    console.log('completion: ', completion);
    // If using chat...
    // let result = completion.choices[0].message.content
    //   .trim()
    //   .replace(/(\r\n|\n|\r)/gm, '');
    // If using instruct
    // let result = completion.choices[0].text
    //   .trim()
    //   .replace(/(\r\n|\n|\r)/gm, '');
    // If using function calls
    let result = completion.choices[0].message.function_call.arguments
      .trim()
      .replace(/(\r\n|\n|\r)/gm, '');
    // Sometimes it uses a For example: in th e response
    // if (result.startsWith('For example:')) {
    //   result = result.replace('For example:', '');
    // } else {
    //   result = result.charAt(0) !== '[' ? '[' + result : result;
    //   result = result.slice(-1) !== ']' ? result + ']' : result;
    // }
    console.log('result: ', result);
    const resp = JSON.parse(result);
    console.log('resp: ', resp);

    if (Array.isArray(resp)) {
      return resp[0];
    }

    return resp;
  } catch (e) {
    console.log('an error occurred, try again', e);
    // return e;
    // debugger;
    if (category) {
      return newGame(category);
    }
  }
};

const parseForPlayer = (resp: {
  options: any[];
  answerContext: any;
  keywords: any;
}) => {
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
  tryAgain,
  parseForPlayer,
};
