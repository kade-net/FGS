import { InterNodeServiceClient } from 'inter-node'
import { credentials } from '@grpc/grpc-js'

export const relayClient = new InterNodeServiceClient('relay', credentials.createInsecure())

export const createRelayClient = (namespace: string) => {
    // TODO: look up the namespace in the registry

    return new InterNodeServiceClient(namespace, credentials.createInsecure())
}