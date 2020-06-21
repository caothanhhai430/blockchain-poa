import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";
import BlockChain from "../blockchains/models";
import Block from "../blocks/models";
const ENDPOINT = "http://127.0.0.1:3000";
const blockchain = new BlockChain();
var objCodec = require('object-encode');

function Test() {
  const [sockets, setSockets] = useState();
  const updateChain = (chain)=>{
    const temp = [];
      for (var i = 0; i < chain.length; i++) {
        const block = new Block();
        Object.assign(block,chain[i]);
        temp.push(block);
      }
      blockchain.updateLatestChain(temp);  
  }
  const saveChain = () =>{
    const d = objCodec.encode(JSON.stringify(blockchain.chain), 'base64', 10);
    localStorage.setItem('block-chain-data', d);
  }

  useEffect(() => {
    const d = localStorage.getItem('block-chain-data');
    if (!!d) {
      const chain = JSON.parse(objCodec.decode(d, 'base64', 10));
      updateChain(chain);
    }
    const socket = socketIOClient(ENDPOINT);
    socket.on("CONNECT", data => {
      console.log(data);
      setSockets(data.sockets);
      if(data.currentChain.length > blockchain.chain.length)
        updateChain(data.currentChain);
      else 
        socket.emit('UPDATE', blockchain.chain);
      console.log(blockchain.chain);
    });
    socket.on('NEW VOTE', (vote) => {
      console.log(vote);
      blockchain.addVote(vote);
      blockchain.add(vote);
      socket.emit('SYNC', blockchain.chain);
      saveChain();
    });
    socket.on('SYNC', data => {
      console.log(data);
      const temp = new BlockChain();
      temp.chain = data;
      if (temp.isValidChain() && data.length > blockchain.chain.length) {
        blockchain.updateLatestChain(data);
        socket.emit('UPDATE', blockchain.chain);
      }
    })
  }, []);

  return (
    <p>
      POA networks
    </p>
  );
}

export default Test;