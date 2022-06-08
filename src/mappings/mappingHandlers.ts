import { SubstrateEvent } from "@subql/types";
import { Contract, DappStakingReward, Account, ContractType, UnbondAndUnstake, BondAndStake } from "../types";
import { Balance } from "@polkadot/types/interfaces";
import { u32 } from "@polkadot/types";

export async function handleBondAndStake(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [account, smartContract, balanceOf],
    },
  } = event;
  const accountId = account.toString();
  const balance = Number(balanceOf as Balance);
  const smartContractObj = JSON.parse(smartContract.toString());
  const contractType = smartContractObj.hasOwnProperty("wasm") ? "wasm" : "evm";
  const contractId = smartContractObj[contractType];
  await ensureAccount(accountId, 0, balance);
  await ensureContract(contractId, 0, balance);
  const entity = new BondAndStake(`${event.block.block.header.number}-${event.idx.toString()}`);
  entity.accountId = accountId;
  entity.contractId = contractId;
  entity.contractType = ContractType[contractType.toUpperCase()];
  entity.amount = balance.toString();
  entity.timestamp = event.block.timestamp;
  await entity.save();
}

export async function handleUnbondAndUnstake(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [account, smartContract, balanceOf],
    },
  } = event;
  const accountId = account.toString();
  const balance = Number(balanceOf as Balance);
  const smartContractObj = JSON.parse(smartContract.toString());
  const contractType = smartContractObj.hasOwnProperty("wasm") ? "wasm" : "evm";
  const contractId = smartContractObj[contractType];
  await ensureAccount(accountId, 0, -balance);
  await ensureContract(contractId, 0, -balance);
  const entity = new UnbondAndUnstake(`${event.block.block.header.number}-${event.idx.toString()}`);
  entity.accountId = accountId;
  entity.contractId = contractId;
  entity.contractType = ContractType[contractType.toUpperCase()];
  entity.amount = balance.toString();
  entity.timestamp = event.block.timestamp;
  await entity.save();
}

export async function handleDappStakingReward(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [account, smartContract, era, balanceOf],
    },
  } = event;

  const balance = Number(balanceOf as Balance);
  const accountId = account.toString();
  const smartContractObj = JSON.parse(smartContract.toString());
  const contractType = smartContractObj.hasOwnProperty("wasm") ? "wasm" : "evm";
  const contractId = smartContractObj[contractType];
  await ensureAccount(accountId, balance, Number(0));
  await ensureContract(contractId, balance, Number(0));
  const entity = new DappStakingReward(`${event.block.block.header.number}-${event.idx.toString()}`);
  entity.accountId = accountId;
  entity.contractId = contractId;
  entity.contractType = ContractType[contractType.toUpperCase()];
  entity.amount = balance.toString();
  entity.eraIndex = (era as u32).toNumber();
  entity.timestamp = event.block.timestamp;
  await entity.save();
}

async function ensureAccount(accountId: string, reward: number = Number(0), staking: number = Number(0)): Promise<void> {
  let account = await Account.get(accountId);
  if (!account) {
    account = new Account(accountId);
    account.totalRewarded = Number(0).toString();
    account.totalStaking = Number(0).toString();
  }
  account.totalRewarded = (Number(account.totalRewarded) + Number(reward)).toString();
  account.totalStaking = (Number(account.totalStaking) + Number(staking)).toString();
  await account.save();
}

async function ensureContract(contractId: string, balance: Number = Number(0), staked: Number = Number(0)): Promise<void> {
  let contract = await Contract.get(contractId);
  if (!contract) {
    contract = new Contract(contractId);
    contract.totalReward = Number(0).toString();
    contract.totalStaked = Number(0).toString();
  }
  contract.totalReward = (Number(contract.totalReward) + Number(balance)).toString();
  contract.totalStaked = (Number(contract.totalStaked) + Number(staked)).toString();
  await contract.save();
}

// function insertStr(str, index, insert) {
//   return str.slice(0, index) + insert + str.slice(index, str.length);
// }

// function correctBalance(balanceOf: BigInt): number {
//   let balance = balanceOf.toString();
//   while (balance.length < 18) {
//     balance = "0" + balance;
//   }
//   if (balance.length > 18) {
//     balance = insertStr(balance, balance.length - 18, ".");
//   } else {
//     balance = "0." + balance;
//   }
//   return parseFloat(balance);
// }
