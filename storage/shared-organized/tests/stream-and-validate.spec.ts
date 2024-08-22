import dummyNodeData from '../mock/events.json' assert {type: 'json'}
import { SerialStorage } from 'serial'
import { Processor } from '../src/processor'
import { NodeUpdateSchema, RegisterInboxSchema, ChangeActiveNodeSchema } from 'schema'
import fs from 'fs'


describe('Stream data and validate data', () => {

    it('should write mock data to lama', async () => {
        const serial = await SerialStorage.init("./tests")
        for (const event of dummyNodeData) {
            const parser = event.type == "node_update" ? NodeUpdateSchema : event.type == "register_inbox" ? RegisterInboxSchema : ChangeActiveNodeSchema
            const value = parser.safeParse(event)
            if (!value.success) {
                continue
            }
            await serial.put({
                ...value.data,
                type: event.type as any
            })
        }
    })

    it('should read data from lama and write to pg instance', async () => {
        // const serial = await SerialStorage.init("./tests")
        try {
            await Processor.process("./tests")
        }
        catch (e) {
            console.log("Something went wrong", e)
        }


    })

    after(async () => {
        fs.rmSync("./tests/data.mdb")
        fs.rmSync("./tests/lock.mdb")
    })

})