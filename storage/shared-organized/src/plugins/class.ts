import { DATA, K, SerialStorage } from 'serial'

export abstract class Plugin {
    abstract name: K
    abstract process(data: { key: string, value: any & { type: K } }): Promise<void>
}