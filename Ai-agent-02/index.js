import { GoogleGenAI, Type } from "@google/genai";
import {exec} from "child_process";
import readlineSync from 'readline-sync';
import 'dotenv/config'
import util from "util";
import os from 'os';

const platform = os.platform();

const execute = util.promisify(exec);

const systemPrompt =process.env.SYSTEM_PROMPT;


const ai = new GoogleGenAI({});



// tool: 

async function executeCommand({command}){
    
    try{
    const {stdout,stderr}   = await execute(command);
     
    if(stderr){
        return `Error: ${stderr}`
    }

    return `Success: ${stdout}`

    }
    catch(err){
        return `Error: ${err}`
    }
}


const commandExecuter = {
    name:"executeCommand",
    description: "It takes any shell/terminal command and execute it. It will help us to create, read, write, update, delete any folder and file",
    parameters:{
        type: Type.OBJECT,
        properties:{
            command:{
                type:Type.STRING,
                description: "It is the terminal/shell command. Ex: mkdir calculator , touch calculator/index.js etc"
            }
        },
        required:['command']
    }
}


const History = [];

async function buildWebsite() {

    
    while(true){

    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: History,
        config: { 
         systemInstruction:` ${systemPrompt} . userplatform: ${platform} `
         ,

         tools: [
            {
                functionDeclarations:[commandExecuter]
            }
         ]
        },
    });


    if(result.functionCalls&&result.functionCalls.length>0){

        const functionCall = result.functionCalls[0];

        const { name, args } = functionCall;

        const toolResponse = await executeCommand(args);


        const functionResponsePart = {
            name: functionCall.name,
            response: {
                result: toolResponse,
            },
        };

    History.push({
      role: "model",
      parts: [
        {
          functionCall: functionCall,
        },
      ],
    });

    History.push({
      role: "user",
      parts: [
        {
          functionResponse: functionResponsePart,
        },
      ],

    })
    }
    else{
       
        console.log(result.text);
        History.push({
            role:"model",
            parts:[{text:result.text}]
        })
        break;
    }

    }

    
}







while(true){

    const question = readlineSync.question("what can i build for you -->  ");
    
    if(question=='exit'){
        break;
    }
    
    History.push({
        role:'user',
        parts:[{text:question}]
    });
   
    await buildWebsite();

}






