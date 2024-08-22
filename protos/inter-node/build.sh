#!/bin/bash
echo "Generating gRPC files"
grpc_tools_node_protoc \
    --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
    --js_out=import_style=commonjs,binary:./generated \
    --grpc_out=grpc_js:./generated \
    --ts_out=grpc_js:./generated \
    -I ./schema \
    schema/*.proto
