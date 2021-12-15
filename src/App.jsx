import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "./utils/WavePortal.json";
import './App.css';

export default function App() {

  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const contractAddress = "0xd8f9f4d5b21f7B373a609918fDd1c794018053a8";
  const contractABI = abi.abi;
  const [msg, setMsg] = useState(null);
  const handleChange = e => { 
    setMsg(e.target.value); 
    }

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        getAllNotes();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get metamask");
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);  
    } catch (error) {
      console.log(error);
    }
  }
  
  const wave = async() => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalNotes();
        console.log("Retrieved total wave count...", count.toNumber());

        const waveTxn = await wavePortalContract.write(`${msg}`, { gasLimit: 300000 });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalNotes();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const getAllNotes = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        const notes = await wavePortalContract.getAllNotes();

        let notesCleaned = [];
        notes.forEach(note => {
          notesCleaned.push({
            address: note.sender,
            timestamp: new Date(note.timestamp * 1000),
            message: note.message
          });
        });
        notesCleaned.reverse();
        setAllWaves(notesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let wavePortalContract;

    const onNewNote = (from, timestamp, message) => {
      console.log('NewNote', from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on('NewNote', onNewNote);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('Newnote', onNewNote);
      }
    };
  }, []);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        ethNotes
        </div>

        <div className="bio">
        Read and write notes on the Ethereum blockchain. Just be aware, your personality might become attached to your address.
        </div>
        <div className="inputAlign">
          <textarea className="noteInput" name="note"rows="4" columns="50" value={msg} onChange={handleChange}>
          </textarea>
          <button className="waveButton" onClick={wave}>
          make a note
          </button>
        </div>

        {!currentAccount && (
          <div className="buttonAlign">
            <button className="connectButton"  onClick={connectWallet}> 
            connect wallet
            </button>
          </div>
        )}

        {allWaves.map((note, index) => {
          return (
            <div className="NoteFamily">
            <div key={index} className="Note">
              <div>Address: <span className="addy">{note.address}</span></div>
              <div>Time: {note.timestamp.toString()}</div>
              <div>Message: <span className="msg">{note.message}</span></div>
            </div>
            </div>)
        })}
      </div>
    </div>
  );
}
