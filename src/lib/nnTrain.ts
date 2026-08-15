/**
 * nnTrain.ts: the guide's 784-16-16-10 network, trained for real.
 *
 * This is the exact machine the 3D scene draws, implemented with typed
 * arrays so it trains live in the visitor's browser on real MNIST digits.
 * Every design choice matches what the guide teaches, on purpose:
 *
 *   - He initialization for the ReLU hidden layers: std = sqrt(2/n_in)
 *     (He et al. 2015), Glorot-style scaling for the linear output layer.
 *   - ReLU hidden activations, softmax output, cross-entropy loss.
 *   - Adam with the paper's own defaults: alpha 0.001, beta1 0.9,
 *     beta2 0.999, epsilon 1e-8, with bias correction (Kingma & Ba 2015).
 *   - Mini-batches of 32, reshuffled every epoch.
 *
 * Deterministic: a seeded PRNG drives init and shuffling, so a given seed
 * reproduces the same run. No dependencies, main-thread friendly (a full
 * batch step is ~2.5M flops; browsers do thousands of those per frame).
 */

export const LAYERS = [784, 16, 16, 10] as const;
export const BATCH = 32;

/* ------------------------------------------------------------------ */

/** mulberry32: tiny deterministic PRNG. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller gaussian from a uniform PRNG. */
function gauss(rand: () => number) {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface MnistData {
  nTrain: number;
  nTest: number;
  trainLabels: Uint8Array;
  testLabels: Uint8Array;
  trainPixels: Uint8Array; // 784 * nTrain, 0-255
  testPixels: Uint8Array;
}

/** Parse public/data/mnist-live.bin (see scripts/build-mnist-subset.py). */
export function parseMnist(buf: ArrayBuffer): MnistData {
  const u8 = new Uint8Array(buf);
  if (String.fromCharCode(u8[0], u8[1], u8[2], u8[3]) !== "NNMN")
    throw new Error("bad MNIST pack magic");
  const dv = new DataView(buf);
  const nTrain = dv.getUint32(4, true);
  const nTest = dv.getUint32(8, true);
  let o = 12;
  const trainLabels = u8.slice(o, o + nTrain); o += nTrain;
  const testLabels = u8.slice(o, o + nTest); o += nTest;
  const trainPixels = u8.slice(o, o + 784 * nTrain); o += 784 * nTrain;
  const testPixels = u8.slice(o, o + 784 * nTest);
  return { nTrain, nTest, trainLabels, testLabels, trainPixels, testPixels };
}

/* ------------------------------------------------------------------ */

export class NnTrainer {
  // parameters
  w1 = new Float32Array(16 * 784);
  b1 = new Float32Array(16);
  w2 = new Float32Array(16 * 16);
  b2 = new Float32Array(16);
  w3 = new Float32Array(10 * 16);
  b3 = new Float32Array(10);

  // Adam moments
  private m: Float32Array[];
  private v: Float32Array[];
  private params: Float32Array[];
  private grads: Float32Array[];

  // gradient accumulators
  private gw1 = new Float32Array(16 * 784);
  private gb1 = new Float32Array(16);
  private gw2 = new Float32Array(16 * 16);
  private gb2 = new Float32Array(16);
  private gw3 = new Float32Array(10 * 16);
  private gb3 = new Float32Array(10);

  // per-sample activation scratch (also what the scene visualizes)
  x = new Float32Array(784);
  z1 = new Float32Array(16);
  a1 = new Float32Array(16);
  z2 = new Float32Array(16);
  a2 = new Float32Array(16);
  z3 = new Float32Array(10);
  probs = new Float32Array(10);

  // run state
  step = 0;
  epoch = 0;
  adamT = 0;
  lossEma = Number.NaN;
  lastLoss = 0;
  lastLabel = -1;
  lastPred = -1;
  accHistory: { step: number; acc: number }[] = [];

  readonly data: MnistData;
  private order: Int32Array;
  private cursor = 0;
  private rand: () => number;

  constructor(data: MnistData, seed = 1337) {
    this.data = data;
    this.rand = rng(seed);
    this.order = new Int32Array(data.nTrain);
    for (let i = 0; i < data.nTrain; i++) this.order[i] = i;
    this.shuffle();

    // He init for ReLU layers, Glorot-style for the linear output head
    const s1 = Math.sqrt(2 / 784), s2 = Math.sqrt(2 / 16), s3 = Math.sqrt(1 / 16);
    for (let i = 0; i < this.w1.length; i++) this.w1[i] = gauss(this.rand) * s1;
    for (let i = 0; i < this.w2.length; i++) this.w2[i] = gauss(this.rand) * s2;
    for (let i = 0; i < this.w3.length; i++) this.w3[i] = gauss(this.rand) * s3;

    this.params = [this.w1, this.b1, this.w2, this.b2, this.w3, this.b3];
    this.grads = [this.gw1, this.gb1, this.gw2, this.gb2, this.gw3, this.gb3];
    this.m = this.params.map((p) => new Float32Array(p.length));
    this.v = this.params.map((p) => new Float32Array(p.length));
  }

  private shuffle() {
    for (let i = this.order.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      const t = this.order[i]; this.order[i] = this.order[j]; this.order[j] = t;
    }
  }

  /** Forward pass on 784 pixels already loaded into this.x. */
  forward() {
    const { x, z1, a1, z2, a2, z3, probs, w1, b1, w2, b2, w3, b3 } = this;
    for (let j = 0; j < 16; j++) {
      let s = b1[j];
      const off = j * 784;
      for (let i = 0; i < 784; i++) s += w1[off + i] * x[i];
      z1[j] = s;
      a1[j] = s > 0 ? s : 0;
    }
    for (let j = 0; j < 16; j++) {
      let s = b2[j];
      const off = j * 16;
      for (let i = 0; i < 16; i++) s += w2[off + i] * a1[i];
      z2[j] = s;
      a2[j] = s > 0 ? s : 0;
    }
    let max = -Infinity;
    for (let k = 0; k < 10; k++) {
      let s = b3[k];
      const off = k * 16;
      for (let i = 0; i < 16; i++) s += w3[off + i] * a2[i];
      z3[k] = s;
      if (s > max) max = s;
    }
    let sum = 0;
    for (let k = 0; k < 10; k++) { probs[k] = Math.exp(z3[k] - max); sum += probs[k]; }
    for (let k = 0; k < 10; k++) probs[k] /= sum;
  }

  private loadSample(pixels: Uint8Array, idx: number) {
    const off = idx * 784;
    for (let i = 0; i < 784; i++) this.x[i] = pixels[off + i] / 255;
  }

  /** One Adam mini-batch step. Returns mean cross-entropy of the batch. */
  trainStep(): number {
    const d = this.data;
    for (const g of this.grads) g.fill(0);
    let batchLoss = 0;

    const d2 = new Float32Array(16); // dL/dz2
    const d1 = new Float32Array(16); // dL/dz1

    for (let b = 0; b < BATCH; b++) {
      if (this.cursor >= d.nTrain) { this.cursor = 0; this.epoch++; this.shuffle(); }
      const idx = this.order[this.cursor++];
      this.loadSample(d.trainPixels, idx);
      const label = d.trainLabels[idx];
      this.forward();

      batchLoss += -Math.log(Math.max(this.probs[label], 1e-12));
      this.lastLabel = label;
      let am = 0; this.lastPred = 0;
      for (let k = 0; k < 10; k++) if (this.probs[k] > am) { am = this.probs[k]; this.lastPred = k; }

      // backward: softmax + cross-entropy gives dL/dz3 = probs - onehot
      for (let k = 0; k < 10; k++) {
        const dz = this.probs[k] - (k === label ? 1 : 0);
        this.gb3[k] += dz;
        const off = k * 16;
        for (let i = 0; i < 16; i++) this.gw3[off + i] += dz * this.a2[i];
      }
      for (let i = 0; i < 16; i++) {
        let s = 0;
        for (let k = 0; k < 10; k++) s += (this.probs[k] - (k === this.lastLabel ? 1 : 0)) * this.w3[k * 16 + i];
        d2[i] = this.z2[i] > 0 ? s : 0;
        this.gb2[i] += d2[i];
        const off = i * 16;
        for (let j = 0; j < 16; j++) this.gw2[off + j] += d2[i] * this.a1[j];
      }
      for (let i = 0; i < 16; i++) {
        let s = 0;
        for (let j = 0; j < 16; j++) s += d2[j] * this.w2[j * 16 + i];
        d1[i] = this.z1[i] > 0 ? s : 0;
        this.gb1[i] += d1[i];
        const off = i * 784;
        for (let p = 0; p < 784; p++) this.gw1[off + p] += d1[i] * this.x[p];
      }
    }

    // Adam update with the paper's defaults and bias correction
    this.adamT++;
    const alpha = 0.001, beta1 = 0.9, beta2 = 0.999, eps = 1e-8;
    const bc1 = 1 - Math.pow(beta1, this.adamT);
    const bc2 = 1 - Math.pow(beta2, this.adamT);
    for (let p = 0; p < this.params.length; p++) {
      const P = this.params[p], G = this.grads[p], M = this.m[p], V = this.v[p];
      for (let i = 0; i < P.length; i++) {
        const g = G[i] / BATCH;
        M[i] = beta1 * M[i] + (1 - beta1) * g;
        V[i] = beta2 * V[i] + (1 - beta2) * g * g;
        P[i] -= alpha * (M[i] / bc1) / (Math.sqrt(V[i] / bc2) + eps);
      }
    }

    this.step++;
    this.lastLoss = batchLoss / BATCH;
    this.lossEma = Number.isNaN(this.lossEma) ? this.lastLoss : 0.95 * this.lossEma + 0.05 * this.lastLoss;
    return this.lastLoss;
  }

  /** Accuracy on n test samples (default: the whole held-out set). */
  evaluate(n?: number): number {
    const d = this.data;
    const N = Math.min(n ?? d.nTest, d.nTest);
    let correct = 0;
    for (let t = 0; t < N; t++) {
      this.loadSample(d.testPixels, t);
      this.forward();
      let am = 0, pred = 0;
      for (let k = 0; k < 10; k++) if (this.probs[k] > am) { am = this.probs[k]; pred = k; }
      if (pred === d.testLabels[t]) correct++;
    }
    const acc = correct / N;
    this.accHistory.push({ step: this.step, acc });
    return acc;
  }

  /** Show one test digit through the current network (for the live scene). */
  showTestSample(idx: number) {
    const d = this.data;
    const i = ((idx % d.nTest) + d.nTest) % d.nTest;
    this.loadSample(d.testPixels, i);
    this.forward();
    this.lastLabel = d.testLabels[i];
    let am = 0; this.lastPred = 0;
    for (let k = 0; k < 10; k++) if (this.probs[k] > am) { am = this.probs[k]; this.lastPred = k; }
  }
}
