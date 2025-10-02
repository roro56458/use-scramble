import { ref, onMounted, onUnmounted, watch } from 'vue';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomChar(range: RangeOrCharCodes) {
  let rand = 0;
  if (range.length === 2) {
    rand = getRandomInt(range[0], range[1]);
  } else {
    rand = range[getRandomInt(0, range.length - 1)];
  }
  return String.fromCharCode(rand);
}

type RangeOrCharCodes = { 0: number; 1: number } & Array<number>;

export type UseScrambleProps = {
  playOnMount?: boolean;
  text?: string;
  speed?: number;
  tick?: number;
  step?: number;
  chance?: number;
  seed?: number;
  scramble?: number;
  ignore?: string[];
  range?: RangeOrCharCodes;
  overdrive?: boolean | number;
  overflow?: boolean;
  onAnimationStart?: Function;
  onAnimationEnd?: Function;
  onAnimationFrame?: (result: string) => void;
};

export function useScramble(props: UseScrambleProps) {
  let {
    playOnMount = true,
    text = '',
    speed = 1,
    seed = 1,
    step = 1,
    tick = 1,
    scramble = 1,
    chance = 1,
    overflow = true,
    range = [65, 125],
    overdrive = true,
    onAnimationStart,
    onAnimationFrame,
    onAnimationEnd,
    ignore = [' '],
  } = props;

  const nodeRef = ref<HTMLElement | null>(null);
  let rafRef: number;
  let elapsed = 0;
  const fpsInterval = 1000 / (60 * speed);

  let stepCounter = 0;
  let scrambleIndex = 0;
  let control: Array<string | number | null> = [];
  let overdriveIndex = 0;

  const setIfNotIgnored = (value: string | number | null, replace: string | number | null) =>
    ignore.includes(`${value}`) ? value : replace;

  const seedForward = () => {
    if (scrambleIndex === text.length) return;
    for (let i = 0; i < seed; i++) {
      const index = getRandomInt(scrambleIndex, control.length);
      if (typeof control[index] !== 'number' && typeof control[index] !== 'undefined') {
        control[index] = setIfNotIgnored(
          control[index],
          getRandomInt(0, 10) >= (1 - chance) * 10 ? scramble || seed : 0
        );
      }
    }
  };

  const stepForward = () => {
    for (let i = 0; i < step; i++) {
      if (scrambleIndex < text.length) {
        const currentIndex = scrambleIndex;
        const shouldScramble = getRandomInt(0, 10) >= (1 - chance) * 10;
        control[currentIndex] = setIfNotIgnored(
          text[scrambleIndex],
          shouldScramble ? scramble + getRandomInt(0, Math.ceil(scramble / 2)) : 0
        );
        scrambleIndex++;
      }
    }
  };

  const resizeControl = () => {
    if (text.length < control.length) {
      control.pop();
      control.splice(text.length, step);
    }
    for (let i = 0; i < step; i++) {
      if (control.length < text.length) {
        control.push(setIfNotIgnored(text[control.length + 1], null));
      }
    }
  };

  const onOverdrive = () => {
    if (!overdrive) return;
    for (let i = 0; i < step; i++) {
      const max = Math.max(control.length, text.length);
      if (overdriveIndex < max) {
        control[overdriveIndex] = setIfNotIgnored(
          text[overdriveIndex],
          typeof overdrive === 'boolean' ? String.fromCharCode(95) : overdrive
        );
        overdriveIndex++;
      }
    }
  };

  const onTick = () => {
    stepForward();
    resizeControl();
    seedForward();
  };

  const draw = () => {
    if (!nodeRef.value) return;
    let result = '';

    for (let i = 0; i < control.length; i++) {
      const controlValue = control[i];
      switch (true) {
        case typeof controlValue === 'number' && controlValue > 0:
          result += getRandomChar(range);
          if (i <= scrambleIndex) control[i] = (control[i] as number) - 1;
          break;
        case typeof controlValue === 'string' && (i >= text.length || i >= scrambleIndex):
          result += controlValue;
          break;
        case controlValue === text[i] && i < scrambleIndex:
          result += text[i];
          break;
        case controlValue === 0 && i < text.length:
          result += text[i];
          control[i] = text[i];
          break;
        default:
          result += '';
      }
    }

    nodeRef.value.innerHTML = result;
    onAnimationFrame?.(result);

    if (result === text) {
      control.splice(text.length, control.length);
      onAnimationEnd?.();
      cancelAnimationFrame(rafRef);
    }

    stepCounter++;
  };

  const animate = (time: number) => {
    if (!speed) return;
    rafRef = requestAnimationFrame(animate);
    onOverdrive();

    const timeElapsed = time - elapsed;
    if (timeElapsed > fpsInterval) {
      elapsed = time;
      if (stepCounter % tick === 0) onTick();
      draw();
    }
  };

  const reset = () => {
    stepCounter = 0;
    scrambleIndex = 0;
    overdriveIndex = 0;
    if (!overflow) control = new Array(text.length);
  };

  const play = () => {
    cancelAnimationFrame(rafRef);
    reset();
    onAnimationStart?.();
    rafRef = requestAnimationFrame(animate);
  };

  onMounted(() => {
    if (!playOnMount) {
      control = text.split('');
      stepCounter = scrambleIndex = overdriveIndex = text.length;
      draw();
      cancelAnimationFrame(rafRef);
    } else {
      rafRef = requestAnimationFrame(animate);
    }
  });

  onUnmounted(() => cancelAnimationFrame(rafRef));

  watch(() => text, () => {
    reset();
    rafRef = requestAnimationFrame(animate);
  });

  return { ref: nodeRef, replay: play };
}