<script setup>
import { ref } from 'vue'
import OpenAI from "openai";
import { ElevenLabsClient, ElevenLabs } from "elevenlabs";

const talking = ref(false);
const inputValue = ref('');
const rickThinking = ref(false);
const rickResponse = ref(`Before you ask, I'm a copy of Rick Sanchez' consciousness created to do the things he doesn't want to do.`);
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

const rickTalk = async (audio, rickText) => {
   typeWriter(rickText);
   talking.value = !talking.value;
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

   function detectSilence() {
      analyser.getByteTimeDomainData(dataArray);

      // Calculate the average volume of the signal
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
         sum += Math.abs(dataArray[i] - 128);
      }

      const average = sum / bufferLength;

      if (average < silenceThreshold) {
         talking.value = false;
      } else {
         talking.value = true;
      }
      if (!audioPlayer.ended) {
         animationFrameId = requestAnimationFrame(detectSilence);
      }
   }
   audioPlayer.addEventListener('ended', () => {
      cancelAnimationFrame(animationFrameId);
      talking.value = false;
      audioPlaying.value = false;
   });
   detectSilence();
}

const sendMessage = async () => {
   if (audioPlaying.value || rickThinking.value || inputValue.value === "") {
      return;
   }
   try {
      rickThinking.value = true;
      const response = await openai.chat.completions.create({
         messages: [
            {
               role: 'user',
               content: `${inputValue.value} Please respond in one or two complete sentences.`
            },
            {
               role: 'assistant',
               content: `You are Rick Sanchez from the TV show Rick and Morty. Respond as if you are Rick.`
            }
         ],
         model: 'gpt-4o-mini',
         max_tokens: 50
      });
      rickResponse.value = "";

      const audio = await elevenlabs.textToSpeech.convert("qCYEy4gbAEuO3MpL5k65", {
         optimize_streaming_latency: ElevenLabs.OptimizeStreamingLatency.Zero,
         output_format: ElevenLabs.OutputFormat.Mp32205032,
         text: response.choices[0].message.content,
         voice_settings: {
            stability: 0.1,
            similarity_boost: 0.3,
            style: 0.2
         }
      });
      rickTalk(audio, response.choices[0].message.content);
   } catch (error) {
      console.error(error);
   } finally {
      rickThinking.value = false;
   }
}
</script>

<template>
   <div>
      <div class="input">
         <input type="input" :value="inputValue" @input="event => inputValue = event.target.value"
            placeholder="Talk to Rick" class="input-field" v-on:keyup.enter="sendMessage">
         <button @click="sendMessage" class="button-52">Talk to Rick</button>
      </div>

      <div class="rick">
         <div v-if="rickThinking" class="thought-bubbles">
            <div class="bubble-1"></div>
            <div class="bubble-2"></div>
         </div>
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
         <p class="typewriter">{{ rickResponse }}</p>
      </div>
   </div>
</template>

<style scoped>
.thought-bubbles {
   position: absolute;
   top: 20px;
   left: 30px;
   width: 110px;
   height: 90px;
   background-image: url('../assets/images/rick-dancing.gif');
   background-size: cover;
   z-index: -1;
   border-radius: 60px;
   border: 2px solid black;
}

.bubble-1 {
   position: absolute;
   top: 77px;
   left: 89px;
   width: 28px;
   height: 28px;
   background-color: white;
   border-radius: 100px;
   border: 1px solid black;
}

.bubble-2 {
   position: absolute;
   top: 91px;
   left: 110px;
   width: 17px;
   height: 17px;
   background-color: white;
   border-radius: 100px;
   border: 1px solid black;
}

.button-52 {
   font-size: 16px;
   font-weight: 200;
   letter-spacing: 1px;
   padding: 10px 10px 10px;
   outline: 0;
   border: 1px solid black;
   cursor: pointer;
   position: relative;
   background-color: rgba(0, 0, 0, 0);
   user-select: none;
   -webkit-user-select: none;
   touch-action: manipulation;
   display: inline-block;
   left: 5px;
}

.button-52:after {
   content: "";
   background-color: #7fc043;
   width: 100%;
   z-index: -1;
   position: absolute;
   height: 100%;
   top: 7px;
   left: 7px;
   transition: 0.2s;
}

.button-52:hover:after {
   top: 0px;
   left: 0px;
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
   animation-duration: 5s;
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
   animation-duration: 5s;
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