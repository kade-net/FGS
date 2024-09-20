import {GraphQLClient} from "graphql-request";
import {getSdk} from "./generated/sdk";
export * from './generated/sdk'
export * from './generated/types'
import { createClient } from 'graphql-ws'


export const getClient = (endpoint: string) => {
    const client = new GraphQLClient(endpoint)
    return getSdk(client)
}

export const getWsClient = (endpoint: string) => {
    return createClient({
        url: endpoint + '/subscriptions',
    })
}