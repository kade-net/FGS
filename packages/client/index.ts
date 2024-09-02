import {GraphQLClient} from "graphql-request";
import {getSdk} from "./generated/sdk";
export * from './generated/types'


export const getClient = (endpoint: string) => {
    const client = new GraphQLClient(endpoint)
    return getSdk(client)
}