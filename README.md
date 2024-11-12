# Conduit-AI

An A.I. chatbot built to allow users to have conversations with their favorite characters. Currently, Rick Sanchez is the only available character but I built it with the intention of adding more. Hence, Rick is componentized.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build

```

## How it works
> After starting the app, you can interact with Rick via text input and talk to him about whatever you'd like. His responses are somewhat brief, generally around 3-4 complete sentences but he will speak with TTS audio and have conversations.

## Features
- Character interaction utilizing the OpenAI LLM
- Text-to-speech audio & voice modeling with ElevenLabs
- Audio analysis and visualization *(Rick speaks and his mouth moves with the audio)*
- Portal gun interaction and Animations *(I might make this teleport him to another dimension)*
- Life like character animations *(Rick blinks and looks around)*
- Real-time database updates with firebase

## Technologies
- Vue 3 
- Vite 
- OpenAI API
- ElevenLabs
- FireBase 
- CSS animations 
- JavaScript
- Netlify

## Challenges while developing
**Syncing Ricks mouth with the audio.** 
> The audio may have pauses in order to sound more realistic, so syncing Ricks mouth movement with the audio was challenging. I had to analyze the audio volume output while it's playing to ensure his mouth stops moving if there's silence in the audio.

**Ensuring Rick speaks in complete sentences.** 
> The OpenAI responses are based off max-tokens so sometimes he would stop speaking mid sentence and increasing the tokens didn't guarantee a complete sentence response. The solution was simple but challenging to think of in the moment.

## Known issues
> If you're running this on a mobile device, sometimes the audio fails to play if you have low bandwidth. This happens because of browser autoplay restrictions. Audio playback for browsers require a user interaction or an event (button click) in order to play the audio. This means there is a timeout window in which the browser won't consider it part of the same click event. The payload responses are usually quick enough but under low bandwidth he won't speak but his responses will generate.

## I hope this project demonstrates:
- Ability to work with third party REST API's & A.I. technologies
- The ability to create and deploy standalone apps utilizing CI/CD
- Integrating a realtime database into an application (working knowledge) 
- Design skills. I created and exported all of the assets in ProCreate
- Problem solving abilities
- General creativity and what I can build with my imagination and some elbow grease
