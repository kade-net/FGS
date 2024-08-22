import { SerialStorage } from 'serial'
import { plugins } from './plugins'

export class Processor {
    static async process(path?: string) {
        const storage = await SerialStorage.init(path)


        try {
            await storage.processForPipeline(async ({ key, value }) => {

                console.log("Value::", value)
                const current_type = value.type

                const plugin = plugins.find(plugin => plugin.name === current_type)

                if (plugin) {
                    try {
                        await plugin.process({ key, value } as any)
                    }
                    catch (e) {
                        console.log(`error::${key}::❌`, e)
                    }
                } else {
                    console.log(`error::${key}::❌`, `No plugin found for type ${current_type}`)
                }
            })

        }
        catch (e) {
            console.log(`error::❌`, e)
        }


    }
}