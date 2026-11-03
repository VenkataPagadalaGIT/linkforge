/**
 * prove-nn-train.ts: headless proof that the live-training engine works.
 *
 * Usage: npx tsx scripts/prove-nn-train.ts
 * Trains the exact browser engine on the exact shipped subset and fails
 * (exit 1) if held-out accuracy does not reach the bar the guide states.
 * Run this before trusting any copy that quotes the live demo's accuracy.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseMnist, NnTrainer, BATCH } from "../src/lib/nnTrain";

const BAR = 0.9;
const EPOCHS = 20;

const buf = readFileSync(join(process.cwd(), "public", "data", "mnist-live.bin"));
const data = parseMnist(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
console.log(`data: ${data.nTrain} train / ${data.nTest} test`);

const t0 = Date.now();
const trainer = new NnTrainer(data, 1337);
const stepsPerEpoch = Math.floor(data.nTrain / BATCH);
for (let e = 1; e <= EPOCHS; e++) {
  for (let s = 0; s < stepsPerEpoch; s++) trainer.trainStep();
  const acc = trainer.evaluate();
  console.log(
    `epoch ${e}: loss(ema) ${trainer.lossEma.toFixed(3)}  test acc ${(acc * 100).toFixed(1)}%`,
  );
}
const final = trainer.evaluate();
const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`final test accuracy ${(final * 100).toFixed(1)}% in ${secs}s (${EPOCHS} epochs, seed 1337)`);
if (final < BAR) {
  console.error(`FAIL: below the ${BAR * 100}% bar`);
  process.exit(1);
}
console.log(`PASS: >= ${BAR * 100}%`);
