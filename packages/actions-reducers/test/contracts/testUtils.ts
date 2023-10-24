import { Mina, PrivateKey, AccountUpdate, PublicKey, Reducer, Field } from 'o1js';
import { CounterZkapp } from '../../src';

export interface LocalBlockchainData {
    deployerPublicKey: PublicKey;
    deployerPrivateKey: PrivateKey;
    userOnePublicKey: PublicKey;
    userOnePrivateKey: PrivateKey;
    userTwoPublicKey: PublicKey;
    userTwoPrivateKey: PrivateKey;
    zkApp: CounterZkapp;
    zkAppAddress: PublicKey;
    zkAppPrivateKey: PrivateKey;
  }
  
  export function initLocalBlockchain(proofsEnabled: boolean): LocalBlockchainData {
    const local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(local);
  
    const deployer = local.testAccounts[0];
    const userOne = local.testAccounts[1];
    const userTwo = local.testAccounts[2];
    const zkAppPrivateKey = PrivateKey.random();
    const zkAppAddress = zkAppPrivateKey.toPublicKey();
    const zkApp = new CounterZkapp(zkAppAddress);
  
    return {
      deployerPublicKey: deployer.publicKey,
      deployerPrivateKey: deployer.privateKey,
      userOnePublicKey: userOne.publicKey,
      userOnePrivateKey: userOne.privateKey,
      userTwoPublicKey: userTwo.publicKey,
      userTwoPrivateKey: userTwo.privateKey,
      zkApp,
      zkAppAddress,
      zkAppPrivateKey
    };
  }

export async function localDeploy(
  publicKey: PublicKey, 
  zkApp: CounterZkapp, 
  privateKeys: PrivateKey[]
): Promise<void> {
  const deployTxn = await Mina.transaction(publicKey, () => {
    AccountUpdate.fundNewAccount(publicKey);
    zkApp.deploy();
    zkApp.counter.set(Field(0));
    zkApp.actionState.set(Reducer.initialActionState);
  });

  await deployTxn.prove();
  await deployTxn.sign(privateKeys).send();
}

export async function executeTransaction(
    contractMethod: () => void, 
    userKey: PublicKey, 
    privateKeys: PrivateKey[]
): Promise<void> {
    const txn = await Mina.transaction(userKey, () => contractMethod());
    await txn.prove();
    await txn.sign(privateKeys);
    await txn.send();
}
