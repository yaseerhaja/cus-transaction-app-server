"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_graphql_1 = require("express-graphql");
const graphql_1 = require("graphql");
// Load transaction data
const transactionData = require('./transactions.json');
const app = (0, express_1.default)();
// Define GraphQL schema
const typeDefs = (0, graphql_1.buildSchema)(`
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
    hello: () => {
        return 'Hello, world!';
    },
    getAllTransactions: () => {
        if (transactionData && transactionData.days) {
            transactionData.days.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
            transactionData.days.forEach(day => {
                day.transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            });
            return transactionData.days.map((day) => ({
                id: day.id,
                transactions: day.transactions.map((transaction) => {
                    const data = {
                        id: transaction.id,
                        timestamp: transaction.timestamp,
                        amount: transaction.amount,
                        currencyCode: transaction.currencyCode,
                        currencyRate: transaction.currencyRate || null,
                        description: transaction.description,
                        otherParty: transaction.otherParty || null,
                    };
                    // Convert amount to EUR if necessary
                    const amountInEur = transaction.currencyCode === 'USD' && transaction.currencyRate
                        ? transaction.amount / transaction.currencyRate
                        : transaction.amount;
                    // Return the transaction with the amount in EUR and currencyCode as "EUR"
                    return Object.assign(Object.assign({}, data), { amount: amountInEur, currencyCode: 'EUR' });
                }),
            }));
        }
        else {
            throw new Error('No transaction data available.');
        }
    },
    getTransactionById: ({ transactionId }) => {
        let transaction = null;
        transactionData.days.some(day => {
            transaction = day.transactions.find(t => t.id === transactionId);
            return !!transaction;
        });
        if (!transaction) {
            throw new Error(`Transaction with ID: ${transactionId} not found`);
        }
        const amountInEur = transaction.currencyCode === 'USD' && transaction.currencyRate
            ? transaction.amount / transaction.currencyRate
            : transaction.amount;
        return Object.assign(Object.assign({}, transaction), { amount: amountInEur, currencyCode: 'EUR' });
    },
};
// Add GraphQL endpoint
app.use('/graphql', (0, express_graphql_1.graphqlHTTP)({
    schema: typeDefs,
    rootValue: resolvers,
    graphiql: true,
}));
// Start the server
app.listen(8081, () => {
    console.log('GraphQL server running at http://localhost:8081/graphql');
});
//# sourceMappingURL=server.js.map