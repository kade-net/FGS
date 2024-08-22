import { SerialStorage } from "../src";
import dummyNodeUpdateEvents from '../mock/events.json' assert { type: "json" };
import fs from 'fs'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Write to serial store', () => {

    it('should write to serial store', async () => {
        const serial = await SerialStorage.init("./tests")

        for (const event of dummyNodeUpdateEvents) {
            await serial.put<"node_update">(event as any)
        }

    })

    it('should read from serial store', async () => {
        const serial = await SerialStorage.init("./tests")

        await serial.processForPipeline(async (data) => {
            console.log("read::", data?.key)
        })
    })

    after(async () => {
        fs.rmSync("./tests/data.mdb")
        fs.rmSync("./tests/lock.mdb")
    })
});
