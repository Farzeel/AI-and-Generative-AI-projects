import { GoogleGenAI, Type } from "@google/genai";
import readlineSync from "readline-sync"
import dotenv from "dotenv"
dotenv.config()


const systemPrompt =process.env.SYSTEM_PROMPT



const ai = new GoogleGenAI({});

async function get_weather_forecast({ location }) {

try {
    const response = await fetch(`http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API}&q=${location}`);
const data = await response.json();
return data


} catch (error) {
    console.log(error , "in getting weather")
}

}
  
async function cryptoCurrency({coin}) {

try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&ids=${coin}`);
    const data = await response.json();
    return data;
} catch (error) {
    console.log(error , "in getting Crypto")
}
  }

  const toolFunctions = {
    "get_weather_forecast":get_weather_forecast,
    "cryptoCurrency":cryptoCurrency
  };

  const tools = [
    {
      functionDeclarations: [
        {
          name: "get_weather_forecast",
          description:
            "You can get the current weather information of any city like london, goa etc",
          parameters: {
            type: Type.OBJECT,
            properties: {
              location: {
                type: Type.STRING,
                description:"Name of the city for which I have to fetch weather information like london, goa etc"
              },
            },
            required: ["location"],
          },
        },
        {
          name: "cryptoCurrency",
          description: "We can give you the current price or other information related to cryptocurrency like bitcoin and ethereum etc",
          parameters: {
            type: Type.OBJECT,
            properties: {
              coin: {
                type: Type.STRING,
                description: "It will be the name of the cryptocurrency like bitcoin, ethereum, etc"
              },
            },
            required: ["coin"],
          },
        },
      ],
    },
  ];

  let history = [];

  async function runAgent(){
    while (true) {
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents:history,
            config: { 
                systemInstruction:systemPrompt,
                tools },
          });

          if (result.functionCalls && result.functionCalls.length > 0) {
            console.log("function calling")
            const functionCall = result.functionCalls[0];

            const { name, args } = functionCall;
            const toolResponse =await toolFunctions[name](args);
          

            const functionResponsePart = {
                name: functionCall.name,
                response: {
                  result: toolResponse,
                },
              };

              history.push({
                role: "model",
                parts: [
                  {
                    functionCall: functionCall,
                  },
                ],
              });
              history.push({
                role: "user",
                parts: [
                  {
                    functionResponse: functionResponsePart,
                  },
                ],
              });

          }else{
            console.log(result.text);
            break;
          }

    }

  }
 
  async function main(){
    while (true){
        let query = readlineSync.question('Ask me anything ');
        if(query.toLowerCase().trim()=="exit"){
            break;
        }
        history.push(
            {
                role: "user",
                parts: [
                  {
                    text: query,
                  },
                ],
              },
        )
       
    
        await runAgent()
    }
   

  }

  main()
