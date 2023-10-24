import { CounterZkapp } from '../../src'
import { Field, PrivateKey, PublicKey } from 'o1js';
import { initLocalBlockchain, localDeploy, LocalBlockchainData, executeTransaction } from './testUtils'; 
import { beforeAll, beforeEach, describe, expect, it } from 'bun:test';

let proofsEnabled = true;

describe('CounterZkapp', () => {
  let localData: LocalBlockchainData;
  let zkApp: CounterZkapp;

  beforeAll(async () => {
    if (proofsEnabled) await CounterZkapp.compile();
  });

  beforeEach(() => {
    localData = initLocalBlockchain(proofsEnabled);
    zkApp = localData.zkApp;
  });

  it('deploys the `CounterZkapp` smart contract with initial counter state Field(0)', async () => {
    await localDeploy(localData.deployerPublicKey, zkApp, [localData.deployerPrivateKey, localData.zkAppPrivateKey]);
    const counter = await zkApp.counter.get();
    expect(counter).toEqual(Field(0));
  });

  it('apply actions and rolls up pending actions to update the counter', async () => {
    await localDeploy(localData.deployerPublicKey, zkApp, [localData.deployerPrivateKey, localData.zkAppPrivateKey]);
    
    await executeTransaction(zkApp.incrementCounter, localData.userOnePublicKey, [localData.userOnePrivateKey]);
    await executeTransaction(zkApp.incrementCounter, localData.userTwoPublicKey, [localData.userTwoPrivateKey]);
    await executeTransaction(zkApp.rollupIncrements, localData.deployerPublicKey, [localData.deployerPrivateKey]);
    
    const counter = await zkApp.counter.get();
    expect(counter).toEqual(Field(2));
  });
});