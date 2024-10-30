import { useState } from "react";
import server from "./server";
import { secp256k1 as secp } from "ethereum-cryptography/secp256k1"; 
import { keccak256 } from "ethereum-cryptography/keccak";
import { utf8ToBytes, hexToBytes, toHex } from "ethereum-cryptography/utils";

function Transfer({ address, setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    const amount = parseInt(sendAmount);
    const msg = `${address} sent ${amount} to ${recipient}`;
    const msgHash = toHex(keccak256(utf8ToBytes(msg)));
    const signature = await secp.sign(msgHash, hexToBytes(privateKey.slice(2)));

    try {
      console.log("before try");
      const {
        data: { balance },
      } = await server.post(`send`, {
        sender: address,
        hexSignature: signature.toCompactHex(),
        amount: amount,
        msg: msg,
        recipient,
        recoveryNum: signature.recovery,
      });
      console.log("after try");
      setBalance(balance);
    } catch (ex) {
      console.log(ex)
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer Securely" />
    </form>
  );
}

export default Transfer;
