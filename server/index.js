const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

const { secp256k1 } = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { utf8ToBytes, toHex, hexToBytes, } = require("ethereum-cryptography/utils");

app.use(cors());
app.use(express.json());

const balances = {
  "0x0342c1e9ea3bb53f6f455c505ec27b9ada0cec27aed95a901b1d5c2bbcbaf166aa": 100,
  // Private Key: 0x18b1f64fddd85e100d1a45882475f05cfa781f630b53b001ad5655c93c9f3b86
  "0x034690303fd199765acadf9a1d61a594473ae7cf8097e3cb6d9e0e28acdb9e2613": 50,
  // Private Key: 0x83790a38b9f1522da6f9bbb6c8abab3513b73725ce0730b6ffb4f5fbbaab602e
  "0x03a9e1a551000addc7d0d1a527fada766d47d3289dcd0ef050fff078490dbbf463": 75,
  // Private Key: 0xc4ce35da3588eb96a2a3917291b8b6da2fd805f0f467045869eb6f8eff582a11
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount, hexSignature, msg, recoveryNum } = req.body;

  setInitialBalance(sender);
  setInitialBalance(recipient);

  const signature = secp256k1.Signature.fromCompact(hexSignature).addRecoveryBit(recoveryNum);
  const msgHash = toHex(keccak256(utf8ToBytes(msg)));
  const publicKeyHex_PREFIXED = `0x${signature.recoverPublicKey(msgHash).toHex()}`;
  const publicKeyHex = publicKeyHex_PREFIXED.slice(2);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } 
  else if (!secp256k1.verify(signature, msgHash, publicKeyHex)) {
    res.status(400).send({ message: "Signature unverifiable!" });
  } 
  else if (publicKeyHex_PREFIXED !== sender) {
    res.status(400).send({ message: "Signed by a different public key!" });
  } 
  else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
