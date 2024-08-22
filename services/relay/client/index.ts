import { InterNodeServiceClient } from 'inter-node'
import { credentials } from '@grpc/grpc-js'

export const relayClient = new InterNodeServiceClient('relay', credentials.createInsecure())

export const createRelayClient = (namespace: string) => {
    // TODO: look up the namespace in the registry - check for the namespace from the registry on chain

    return new InterNodeServiceClient(namespace, credentials.createInsecure())
}