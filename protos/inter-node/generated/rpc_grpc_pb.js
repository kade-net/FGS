// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var events_pb = require('./events_pb.js');

function serialize_inter_node_AckEvent(arg) {
  if (!(arg instanceof events_pb.AckEvent)) {
    throw new Error('Expected argument of type inter_node.AckEvent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_inter_node_AckEvent(buffer_arg) {
  return events_pb.AckEvent.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_inter_node_ChangeActiveNodeEvent(arg) {
  if (!(arg instanceof events_pb.ChangeActiveNodeEvent)) {
    throw new Error('Expected argument of type inter_node.ChangeActiveNodeEvent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_inter_node_ChangeActiveNodeEvent(buffer_arg) {
  return events_pb.ChangeActiveNodeEvent.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_inter_node_InviteAcceptEvent(arg) {
  if (!(arg instanceof events_pb.InviteAcceptEvent)) {
    throw new Error('Expected argument of type inter_node.InviteAcceptEvent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_inter_node_InviteAcceptEvent(buffer_arg) {
  return events_pb.InviteAcceptEvent.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_inter_node_InviteCreateEvent(arg) {
  if (!(arg instanceof events_pb.InviteCreateEvent)) {
    throw new Error('Expected argument of type inter_node.InviteCreateEvent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_inter_node_InviteCreateEvent(buffer_arg) {
  return events_pb.InviteCreateEvent.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_inter_node_InviteRejectEvent(arg) {
  if (!(arg instanceof events_pb.InviteRejectEvent)) {
    throw new Error('Expected argument of type inter_node.InviteRejectEvent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_inter_node_InviteRejectEvent(buffer_arg) {
  return events_pb.InviteRejectEvent.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_inter_node_MessageDownloadRequest(arg) {
  if (!(arg instanceof events_pb.MessageDownloadRequest)) {
    throw new Error('Expected argument of type inter_node.MessageDownloadRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_inter_node_MessageDownloadRequest(buffer_arg) {
  return events_pb.MessageDownloadRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_inter_node_MessageEvent(arg) {
  if (!(arg instanceof events_pb.MessageEvent)) {
    throw new Error('Expected argument of type inter_node.MessageEvent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_inter_node_MessageEvent(buffer_arg) {
  return events_pb.MessageEvent.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_inter_node_NodeChangeAuthorizationString(arg) {
  if (!(arg instanceof events_pb.NodeChangeAuthorizationString)) {
    throw new Error('Expected argument of type inter_node.NodeChangeAuthorizationString');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_inter_node_NodeChangeAuthorizationString(buffer_arg) {
  return events_pb.NodeChangeAuthorizationString.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_inter_node_RequestNodeChangeAuthorizationString(arg) {
  if (!(arg instanceof events_pb.RequestNodeChangeAuthorizationString)) {
    throw new Error('Expected argument of type inter_node.RequestNodeChangeAuthorizationString');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_inter_node_RequestNodeChangeAuthorizationString(buffer_arg) {
  return events_pb.RequestNodeChangeAuthorizationString.deserializeBinary(new Uint8Array(buffer_arg));
}


var InterNodeServiceService = exports.InterNodeServiceService = {
  sendMessageEvent: {
    path: '/InterNodeService/SendMessageEvent',
    requestStream: false,
    responseStream: false,
    requestType: events_pb.MessageEvent,
    responseType: events_pb.AckEvent,
    requestSerialize: serialize_inter_node_MessageEvent,
    requestDeserialize: deserialize_inter_node_MessageEvent,
    responseSerialize: serialize_inter_node_AckEvent,
    responseDeserialize: deserialize_inter_node_AckEvent,
  },
  sendInviteCreateEvent: {
    path: '/InterNodeService/SendInviteCreateEvent',
    requestStream: false,
    responseStream: false,
    requestType: events_pb.InviteCreateEvent,
    responseType: events_pb.AckEvent,
    requestSerialize: serialize_inter_node_InviteCreateEvent,
    requestDeserialize: deserialize_inter_node_InviteCreateEvent,
    responseSerialize: serialize_inter_node_AckEvent,
    responseDeserialize: deserialize_inter_node_AckEvent,
  },
  sendInviteAcceptEvent: {
    path: '/InterNodeService/SendInviteAcceptEvent',
    requestStream: false,
    responseStream: false,
    requestType: events_pb.InviteAcceptEvent,
    responseType: events_pb.AckEvent,
    requestSerialize: serialize_inter_node_InviteAcceptEvent,
    requestDeserialize: deserialize_inter_node_InviteAcceptEvent,
    responseSerialize: serialize_inter_node_AckEvent,
    responseDeserialize: deserialize_inter_node_AckEvent,
  },
  sendInviteRejectEvent: {
    path: '/InterNodeService/SendInviteRejectEvent',
    requestStream: false,
    responseStream: false,
    requestType: events_pb.InviteRejectEvent,
    responseType: events_pb.AckEvent,
    requestSerialize: serialize_inter_node_InviteRejectEvent,
    requestDeserialize: deserialize_inter_node_InviteRejectEvent,
    responseSerialize: serialize_inter_node_AckEvent,
    responseDeserialize: deserialize_inter_node_AckEvent,
  },
  sendRequestNodeChangeAuthorizationString: {
    path: '/InterNodeService/SendRequestNodeChangeAuthorizationString',
    requestStream: false,
    responseStream: false,
    requestType: events_pb.RequestNodeChangeAuthorizationString,
    responseType: events_pb.NodeChangeAuthorizationString,
    requestSerialize: serialize_inter_node_RequestNodeChangeAuthorizationString,
    requestDeserialize: deserialize_inter_node_RequestNodeChangeAuthorizationString,
    responseSerialize: serialize_inter_node_NodeChangeAuthorizationString,
    responseDeserialize: deserialize_inter_node_NodeChangeAuthorizationString,
  },
  sendChangeActiveNodeEvent: {
    path: '/InterNodeService/SendChangeActiveNodeEvent',
    requestStream: false,
    responseStream: false,
    requestType: events_pb.ChangeActiveNodeEvent,
    responseType: events_pb.AckEvent,
    requestSerialize: serialize_inter_node_ChangeActiveNodeEvent,
    requestDeserialize: deserialize_inter_node_ChangeActiveNodeEvent,
    responseSerialize: serialize_inter_node_AckEvent,
    responseDeserialize: deserialize_inter_node_AckEvent,
  },
  downloadMessageEventsToNewActiveNode: {
    path: '/InterNodeService/DownloadMessageEventsToNewActiveNode',
    requestStream: false,
    responseStream: true,
    requestType: events_pb.MessageDownloadRequest,
    responseType: events_pb.MessageEvent,
    requestSerialize: serialize_inter_node_MessageDownloadRequest,
    requestDeserialize: deserialize_inter_node_MessageDownloadRequest,
    responseSerialize: serialize_inter_node_MessageEvent,
    responseDeserialize: deserialize_inter_node_MessageEvent,
  },
};

exports.InterNodeServiceClient = grpc.makeGenericClientConstructor(InterNodeServiceService);
