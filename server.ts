import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import { TransactionData, Day, Transaction } from './types';
const cors = require('cors');

// Load transaction data
const transactionData: TransactionData = require('./transactions.json');

require('dotenv').config();
const API_END_POINT = process.env.API_END_POINT;

const app = express();

// Define GraphQL schema
const typeDefs = buildSchema(`
  type Query {
    hello: String
    getAllTransactions: [Day]!
    getTransactionById(transactionId: Int!): Transaction
  }

  type Day {
    id: String!
    transactions: [Transaction]!
  }

  type Transaction {
    id: ID!
    timestamp: String!
    amount: Float!
    currencyCode: String!
    currencyRate: Float
    description: String!
    otherParty: OtherParty
  }

  type OtherParty {
    name: String
    iban: String
  }
`);

// Define resolvers
const resolvers = {
  hello: (): string => {
    return 'Hello, world!';
  },
  getAllTransactions: (): Day[] => {
    if (transactionData && transactionData.days) {
      transactionData.days.sort((a: Day, b: Day) => new Date(b.id).getTime() - new Date(a.id).getTime());

      transactionData.days.forEach(day => {
        day.transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });

      return transactionData.days.map((day: Day): Day => ({
        id: day.id,
        transactions: day.transactions.map((transaction: Transaction): Transaction => {
          const data = {
            id: transaction.id,
            timestamp: transaction.timestamp,
            amount: transaction.amount,
            currencyCode: transaction.currencyCode,
            currencyRate: transaction.currencyRate || null,
            description: transaction.description,
            otherParty: transaction.otherParty || null,
         }

          // Convert amount to EUR if necessary
          const amountInEur =
            transaction.currencyCode === 'USD' && transaction.currencyRate
              ? transaction.amount / transaction.currencyRate
              : transaction.amount;

          // Return the transaction with the amount in EUR and currencyCode as "EUR"
          return {
            ...data,
            amount: amountInEur,
            currencyCode: 'EUR',
          };
        }),
      }));
    } else {
      throw new Error('No transaction data available.');
    }
  },
  getTransactionById: ({transactionId}: { transactionId: number }): Transaction | null => {

    let transaction: Transaction | null = null;

    transactionData.days.some(day => {
      transaction = day.transactions.find(t => t.id === transactionId);
      return !!transaction;
    });

    if (!transaction) {
      throw new Error(`Transaction with ID: ${transactionId} not found`);
    }

    const amountInEur =
      transaction.currencyCode === 'USD' && transaction.currencyRate
        ? transaction.amount / transaction.currencyRate
        : transaction.amount;

    return {
      ...transaction,
      amount: amountInEur,
      currencyCode: 'EUR',
    };
  },
};

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

// Add GraphQL endpoint
app.use(
  '/graphql',
  graphqlHTTP({
    schema: typeDefs,
    rootValue: resolvers,
    graphiql: true,
  })
);

// Start the server
app.listen(8081, () => {
  console.log(
    `GraphQL server running at ${API_END_POINT}/graphql`
  );
});
