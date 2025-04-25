# Transcriber Fullstack bot launcher and interactor and Discord Bot

For Palantir Launch Project!

Node.js server can be found in /backend

React code for frontend can be found in /frontend

Transcribe bot can be found /transcribe_bot

## Node.js instructions

1. npm install in both /frontend and /backend

2. put ur .env keys 

3. cd into /backend

4. npm run fullstack:dev

For discord bot, you would need to pull from a docker image, but I haven't made that public yet

## Transcribe Bot 

instructions can be found in /transcribe_bot

# Foundry Stuff:

/Pipeline_AI_function

This is the typescript code I used to define the pipeline that takes the transcript text, who said who, and converts that into a relations ship heirarchy using the ontology. It's basically AIP but in typescript.

The foundry code is not runnable locally, but runs on the the foundry ontology, the code is just pasted here so my approach is viewable.

/ReactDevConsole

This is the react code shown in the demo and at https://clientlandscape-5ilramrr6upknllk.apps.usw-18.palantirfoundry.com/

This page unfor. can't be open since only I can open it. I don't have really any groups to share the project with on foundry, but if you want to view it email me.

### NOTE:

For the transcribe bot, you need to create a /audio_segment directory, as git won't put it in its commit since i'm ignoring it

without it the bot will fail to create a .wav file, since it needs the directory to be present. Why it doesn't just make the directory is beyond me lol


Slides can be found here: https://docs.google.com/presentation/d/1U29R78nS_YQGHIegFz2Nufxn9RWVn5VePcwyGqEhMbA/edit?usp=sharing 