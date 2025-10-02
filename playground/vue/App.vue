<template>
  <div>
    <p ref="scramble.ref"></p>
    <div class="controls">
      <button @click="replay">Replay</button>
      <button @click="randomize">Randomize</button>
      <label>
        Overdrive
        <input type="checkbox" v-model="params.overdrive" />
      </label>
      <label>
        Speed
        <input type="range" v-model.number="params.speed" min="0" max="1" step="0.01" />
      </label>
      <label>
        Tick
        <input type="number" v-model.number="params.tick" min="1" max="10" />
      </label>
      <label>
        Step
        <input type="number" v-model.number="params.step" min="1" max="42" />
      </label>
      <label>
        Scramble
        <input type="number" v-model.number="params.scramble" min="0" max="42" />
      </label>
      <label>
        Seed
        <input type="number" v-model.number="params.seed" min="0" max="10" />
      </label>
      <label>
        Chance
        <input type="range" v-model.number="params.chance" min="0" max="1" step="0.01" />
      </label>
      <label>
        Overflow
        <input type="checkbox" v-model="params.overflow" />
      </label>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, watch } from 'vue';
import { useScramble } from '../../dist';
import tragedy from 'iphigenia-in-aulis';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

const generateWords = (index: number | null = null) =>
  tragedy[index ?? getRandomInt(0, tragedy.length)];

const sample = ref(generateWords());

const params = reactive({
  overdrive: false,
  speed: 0.85,
  tick: 1,
  step: 1,
  scramble: 4,
  seed: 0,
  chance: 0.85,
  overflow: false,
});

const scramble = useScramble({
  text: sample.value,
  ...params,
});

const replay = () => scramble.replay();

const randomize = () => {
  sample.value = generateWords();
};

watch(
  [sample, () => ({ ...params })],
  () => {
    useScramble({
      text: sample.value,
      ...params,
    });
  },
  { deep: true }
);
</script>

<style scoped>
.controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

button {
  width: fit-content;
}
</style>
