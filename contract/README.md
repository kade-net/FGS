# Federated GM Service Smart Contract Overview
- This smart contract will handle all on-chain activity required for the FGS to function.
- It will handle namespace and user registration, as well as namespace switching
- It also provides a way for users to verify the delivery of their messages, in case there's any disagreements with their nodes. 
- It notably doesn't handle the storage or delivery of individual messages, that is are offloaded to the nodes in the FGS network, however it does handle acknowledgements of receipt, which are important for verifying delivery of messages between nodes


## node_registry
- Handles the creation of new nodes/namespaces.
- Ensures unique and valid namespaces

## inbox_registry
- Handles the registration of new addresses in the network
- Handles user's switch their active nodes on the network
- Handles conversation invite advertisement
- Conversation invite acceptance
- Conversation invite rejections
- Sending Conversation Acknowledgement markers
