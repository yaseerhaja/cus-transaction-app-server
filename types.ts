// types.ts
export interface OtherParty {
  name: string;
  iban: string;
}

export interface Transaction {
  id: number;
  timestamp: string;
  amount: number;
  currencyCode: string;
  currencyRate?: number;
  description: string;
  otherParty?: OtherParty;
}

export interface Day {
  id: string;
  transactions: Transaction[];
}

export interface TransactionData {
  days: Day[];
}
