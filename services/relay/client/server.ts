import 'dotenv/config'
import express from 'express'
import { GraphQLScalarType, Kind } from 'graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'
import GraphQLJSON from "graphql-type-json";
import TypeDef from './typedef'
import { createServer } from 'http';
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

const expressApp = express()
expressApp.use('/', cors({ origin: '*' }), express.json())

const dateScalar = new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    serialize(value) {
        if (value instanceof Date) {
            return value.getTime(); // Convert outgoing Date to integer for JSON
        }
        throw Error('GraphQL Date Scalar serializer expected a `Date` object');
    },
    parseValue(value) {
        if (typeof value === 'number') {
            return new Date(value); // Convert incoming integer to Date
        }
        throw new Error('GraphQL Date Scalar parser expected a `number`');
    },
    parseLiteral(ast) {
        if (ast.kind === Kind.INT) {
            // Convert hard-coded AST string to integer and then to Date
            return new Date(parseInt(ast.value, 10));
        }
        // Invalid hard-coded value (not an integer)
        return null;
    },
});

const schema = makeExecutableSchema({
    typeDefs: TypeDef,
    resolvers: [
        {
            Date: dateScalar,
            JSON: GraphQLJSON
        }] as any
})




const httpServer = createServer(expressApp)

const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/subscriptions'
})

const serverCleanup = useServer({ schema }, wsServer);

const mainServer = new ApolloServer({
    schema,
    plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
            async serverWillStart() {
                return {
                    async drainServer() {
                        await serverCleanup.dispose();
                    },
                };
            },
        },
    ],
    introspection: true
});

await mainServer.start()

expressApp.use('/', cors({ origin: '*' }), express.json())

httpServer.listen(process.env.PORT || 4000, () => {
    console.log("Server started on port::", process.env.PORT || 4000)
})
