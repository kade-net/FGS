import lmdb from "lmdb"
import { Readable } from "stream"

export class Lama {

    db: lmdb.RootDatabase

    constructor(db: lmdb.RootDatabase) {
        this.db = db
    }

    static async init(name: string, path: string | undefined = "./lama-store") {
        const db = lmdb.open({
            path: path,
            maxDbs: 10,
            mapSize: 4 * 1024 * 1024 * 1024, // 4GB
            name,

        })

        return new Lama(db)
    }


    async put(key: string, value: string | Record<string, any>) {
        return this.db.put(key, value)
    }

    async get<T = any>(key: string) {
        return this.db.get(key) as T
    }

    async close() {
        this.db.close()
    }
}

export class LamaReader extends Readable {

    db: lmdb.RootDatabase
    lastKey?: lmdb.Key


    constructor(db: lmdb.RootDatabase, lastKey?: string) {
        super({ objectMode: true })
        this.db = db
        this.lastKey = lastKey
    }
    // processor: ( data: Record<string,string> )=> Promise<void>
    async _read() {
        while (true) {
            for (let { key, value } of this.db.getRange({
                start: this.lastKey,
            })) {
                this.push({ key, value })
                this.lastKey = key
            }
        }
    }

    async dataRead(processor: (data: any) => Promise<void>) {

        for (let { key, value } of this.db.getRange({
            start: this.lastKey,
        })) {
            this.lastKey = key
            let k = key as string
            try {
                await processor({ key: k, value })
            }
            catch (e) {
                console.log(`unable_to_read::${k}::❌`)
                console.log("error::", e)
            }
        }

    }

    async close() {
        this.db.close()
    }

    async setLastKey(key: string) {
        this.lastKey = key
    }



}