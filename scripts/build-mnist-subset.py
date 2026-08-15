#!/usr/bin/env python3
"""Pack a real MNIST subset for the in-browser live-training demo.

Usage: python3 scripts/build-mnist-subset.py <dir-with-idx-files>

Reads the canonical IDX files (train-images-idx3-ubyte etc.), verifies the
IDX magic numbers, takes the FIRST 10,000 training and 1,000 test examples
(no cherry-picking: a deterministic, auditable slice), and writes
public/data/mnist-live.bin:

  bytes 0-3   magic "NNMN"
  bytes 4-7   u32 LE train count
  bytes 8-11  u32 LE test count
  then        train labels (u8 * nTrain)
  then        test labels  (u8 * nTest)
  then        train pixels (u8 * 784 * nTrain, row-major, 0=black)
  then        test pixels  (u8 * 784 * nTest)

Data: the MNIST database of handwritten digits (LeCun, Cortes, Burges);
see Deng 2012, IEEE Signal Processing Magazine, DOI 10.1109/MSP.2012.2211477.
"""
import struct
import sys
from pathlib import Path

N_TRAIN, N_TEST = 10000, 1000

def read_idx(path: Path, magic_expected: int):
    data = path.read_bytes()
    magic, n = struct.unpack(">II", data[:8])
    assert magic == magic_expected, f"{path.name}: magic {magic} != {magic_expected}"
    if magic_expected == 2051:
        rows, cols = struct.unpack(">II", data[8:16])
        assert (rows, cols) == (28, 28), f"unexpected image size {rows}x{cols}"
        return n, data[16:]
    return n, data[8:]

def main():
    src = Path(sys.argv[1])
    n_tr, tr_img = read_idx(src / "train-images-idx3-ubyte", 2051)
    _, tr_lab = read_idx(src / "train-labels-idx1-ubyte", 2049)
    n_te, te_img = read_idx(src / "t10k-images-idx3-ubyte", 2051)
    _, te_lab = read_idx(src / "t10k-labels-idx1-ubyte", 2049)
    assert n_tr >= N_TRAIN and n_te >= N_TEST

    out = Path(__file__).resolve().parent.parent / "public" / "data" / "mnist-live.bin"
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "wb") as f:
        f.write(b"NNMN")
        f.write(struct.pack("<II", N_TRAIN, N_TEST))
        f.write(tr_lab[:N_TRAIN])
        f.write(te_lab[:N_TEST])
        f.write(tr_img[: 784 * N_TRAIN])
        f.write(te_img[: 784 * N_TEST])

    import collections
    dist_tr = collections.Counter(tr_lab[:N_TRAIN])
    dist_te = collections.Counter(te_lab[:N_TEST])
    print(f"wrote {out} ({out.stat().st_size:,} bytes)")
    print("train label distribution:", dict(sorted(dist_tr.items())))
    print("test label distribution: ", dict(sorted(dist_te.items())))

if __name__ == "__main__":
    main()
