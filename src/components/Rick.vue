<script setup>
import { ref } from 'vue'
import OpenAI from "openai";
import { ElevenLabsClient, ElevenLabs } from "elevenlabs";
import { useIntersectionObserver, useAnimate } from '@vueuse/core'
import { storeConversation } from '../firebaseConfig.js'

const isVisible = ref(false);
const top = ref(null);
const keyframes = [
   { opacity: 0 },
   { opacity: 1 },
]

useIntersectionObserver(top, ([{ isIntersecting }]) => {
   if (!isVisible.value && isIntersecting) {
      isVisible.value = true;
      useAnimate(top, keyframes, {
         duration: 1500,
         fill: 'forwards',
         easing: 'ease-in-out',
      });
   }
});

const talking = ref(false);
const inputValue = ref('');
const rickThinking = ref(false);
const rickResponse = ref(`I'm a copy of Rick Sanchez' consciousness created to answer the questions he doesn't have time for. Ask me anything.`);
const portalOpen = ref(false);
const audioPlaying = ref(false);

const openai = new OpenAI({
   apiKey: import.meta.env.VITE_APP_OPENAI_KEY,
   dangerouslyAllowBrowser: true
});

const elevenlabs = new ElevenLabsClient({
   apiKey: import.meta.env.VITE_APP_ELEVENLABS_KEY,
});

const togglePortal = () => {
   portalOpen.value = !portalOpen.value;
}

const typeWriter = (rickText) => {
   let i = 0;
   const type = () => {
      if (i < rickText.length) {
         rickResponse.value += rickText.charAt(i);
         i++;
         setTimeout(type, 50);
      }
   }
   type();
}

const trimToCompleteSentences = async (text) => {
   // Remove unwanted special characters and trim the text to the last complete sentence
   const cleanedText = text.replace(/[^a-zA-Z0-9\s.!?]/g, '');
   const match = cleanedText.match(/^(.*[.!?])(?:\s+|$)/);
   return match ? match[1].trim() : "";
}

const sendMessage = async () => {
   if (audioPlaying.value || rickThinking.value || inputValue.value === "") return; // early return if audio is playing, rick is thinking, or input is empty
 
   try {
      rickThinking.value = true;
      const response = await openai.chat.completions.create({ // Send the user's message to OpenAI's chat endpoint
         messages: [
            {
               role: 'user',
               content: `${inputValue.value}`
            },
            {
               role: 'system',
               content: `You are Rick Sanchez from the TV show Rick and Morty. Respond as if you are Rick. Isaac Hartwick created you.`
            }
         ],
         model: 'gpt-4o-mini',
         max_tokens: 50
      });

      // Prune the response so he doesn't stop talking mid-sentence.
      const prunedResponse = await trimToCompleteSentences(response.choices[0].message.content);
      rickResponse.value = "";

      // Convert ricks response to ElevenLabs text-to-speech API
      const audio = await elevenlabs.textToSpeech.convert("qCYEy4gbAEuO3MpL5k65", {
         optimize_streaming_latency: ElevenLabs.OptimizeStreamingLatency.Zero,
         output_format: ElevenLabs.OutputFormat.Mp32205032,
         text: prunedResponse,
         voice_settings: {
            stability: 0.1,
            similarity_boost: 0.3,
            style: 0.2
         }
      });

      // Have Rick talk
      rickTalk(audio, prunedResponse);
   } catch (error) {
      console.error(error);
   } finally {
      rickThinking.value = false;
   }
}

const rickTalk = async (audio, rickText) => {
   try {
      typeWriter(rickText); // Type out Rick's response
      talking.value = !talking.value;

      // Create an audio player, play the audio, and analyze the audio to detect silence
      const chunks = [];
      for await (const chunk of audio) {
         chunks.push(chunk);
      }
      const blob = new Blob(chunks, { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      const audioPlayer = new Audio(audioUrl);
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audioPlayer);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      await audioPlayer.play();
      audioPlaying.value = true;
      analyser.fftSize = 2048;
      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      const silenceThreshold = 1;
      let animationFrameId = null;

      const detectSilence = () => {
         analyser.getByteTimeDomainData(dataArray);
         // Calculate the average volume of the signal
         let sum = 0;
         for (let i = 0; i < bufferLength; i++) {
            sum += Math.abs(dataArray[i] - 128);
         }

         const average = sum / bufferLength;

         // If the average volume is below the threshold, his mouth stops moving
         if (average < silenceThreshold) {
            talking.value = false;
         } else {
            talking.value = true;
         }

         if (!audioPlayer.ended) {
            animationFrameId = requestAnimationFrame(detectSilence);
         }
      }

      // Listen for the end of the audio to stop the animation
      audioPlayer.addEventListener('ended', () => {
         cancelAnimationFrame(animationFrameId);
         talking.value = false;
         audioPlaying.value = false;
      });

      detectSilence();
      storeConversation(inputValue.value, rickText); // Store the chat in Firebase
   } catch (error) {
      console.error('error rick tongue tied', error);
   } finally {
      audioPlaying.value = false;
      talking.value = false;
   }
}
</script>

<template>
   <div class="container" ref="top">
      <div class="input">
         <input type="input" :value="inputValue" @input="event => inputValue = event.target.value"
            placeholder="Talk to Rick" class="input-field" v-on:keyup.enter="sendMessage">
         <button @click="sendMessage" class="button-52">Send</button>
      </div>

      <div class="rick">
         <div class="left-eyelid"></div>
         <div class="right-eyelid"></div>
         <div class="left-pupil"></div>
         <div class="right-pupil"></div>
         <img src="../assets/images/portal-gun.png" class="portal-gun" @click="togglePortal">
         <img src="../assets/images/portal.gif" class="portal"
            :class="{ 'portal-open': portalOpen, 'portal-close': !portalOpen }">
         <img src="../assets/images/rick2.png" width="500">
         <img v-if="!talking" src="../assets/images/rick-mouth.png" class="rick-mouth">
         <img v-else src="../assets/images/rick-mouth-talk.gif" class="rick-mouth-talk">
         <p class="typewriter" v-if="rickThinking">Thinking...</p>
         <p class="typewriter" v-else>{{ rickResponse }}</p>
      </div>
   </div>
</template>

<style scoped>
.button-52 {
   font-size: 16px;
   font-weight: 200;
   letter-spacing: 1px;
   padding: 10px 10px 10px;
   outline: 0;
   border: 1px solid black;
   cursor: pointer;
   position: relative;
   background-color: #7fc043;
   user-select: none;
   -webkit-user-select: none;
   touch-action: manipulation;
   display: inline-block;
   left: 5px;
   width: 80px;
   font-family: monospace;
}

.typewriter {
   color: black;
   font-family: monospace;
   position: absolute;
   width: 270px;
   left: 320px;
   top: 70px;
}

.rick {
   position: absolute;
   top: 420px;
   left: 50%;
   transform: translate(-50%, -50%);
}

.left-eyelid {
   background: #d3c0b3;
   height: 30px;
   width: 30px;
   position: absolute;
   border-radius: 50px;
   top: 112px;
   left: 206px;
   border: 1px solid black;
   z-index: 1;
   animation-name: blink;
   animation-duration: 4s;
   animation-iteration-count: infinite;
   opacity: 0;
}

.right-eyelid {
   background: #d3c0b3;
   height: 30px;
   width: 30px;
   position: absolute;
   border-radius: 50px;
   top: 112px;
   left: 236px;
   border: 1px solid black;
   z-index: 1;
   animation-name: blink;
   animation-duration: 4s;
   animation-iteration-count: infinite;
   opacity: 0;
}

@keyframes blink {
   0% {
      opacity: 0;
   }

   2% {
      opacity: 1;
   }

   3% {
      opacity: 0;
   }
}

.rick-mouth {
   position: absolute;
   top: 155px;
   left: 206px;
   width: 50px;
}

.rick-mouth-talk {
   position: absolute;
   top: 150px;
   left: 184px;
   width: 81px;
}

.left-pupil {
   position: absolute;
   height: 5px;
   width: 5px;
   background-color: black;
   border-radius: 100px;
   right: 16px;
   z-index: 0;
   top: 128px;
   left: 218px;
   animation-name: leftPupilLookLeft;
   animation-duration: 15s;
   animation-iteration-count: infinite;
}

.right-pupil {
   position: absolute;
   height: 5px;
   width: 5px;
   background-color: black;
   border-radius: 100px;
   right: -42px;
   z-index: 2;
   top: 128px;
   left: 248px;
   animation-name: rightPupilLookLeft;
   animation-duration: 15s;
   animation-iteration-count: infinite;
}

@keyframes leftPupilLookLeft {
   0% {
      left: 218px;
   }

   25% {
      left: 218px;
   }

   50% {
      left: 210px;
   }

   90% {
      left: 210px;
   }

   100% {
      left: 218px;
   }
}

@keyframes rightPupilLookLeft {
   0% {
      left: 248px;
   }

   25% {
      left: 248px;
   }

   50% {
      left: 240px;
   }

   90% {
      left: 240px;
   }

   100% {
      left: 248px;
   }
}

.input {
   position: absolute;
   top: 40px;
   left: 50%;
   transform: scale(0.8) translate(-50%, -50%);
   width: 570px;
}

.input-field {
   padding: 11px;
   border-radius: 0px;
   border: 1px solid #000;
   width: 400px;
   margin: 5px;
   font-family: monospace;
}

.portal-gun {
   width: 90px;
   z-index: 0;
   position: absolute;
   top: 200px;
   left: 50px;
   animation-name: portalGunFloat;
   animation-duration: 3s;
   animation-iteration-count: infinite;
}

.portal-gun:hover {
   cursor: pointer;
}

@keyframes portalGunFloat {
   0% {
      top: 200px;
   }

   50% {
      top: 220px;
   }

   100% {
      top: 200px;
   }
}

.portal {
   width: 2px;
   z-index: -1;
   position: absolute;
   top: 200px;
   left: 200px;
}

.portal-open {
   transform: scale(180);
   transition: ease-in .2s;
}

.portal-close {
   transform: scale(0);
   transition: ease-in .2s;
}

@media (max-width: 768px) {
   .rick {
      transform: scale(0.6) translate(-95%, -110%);
   }

   .typewriter {
      width: 175px;
   }

   .input {
      transform: scale(0.6) translate(-70%, -50%);
   }

   .input-field {
      width: 300px;
   }
}
</style>