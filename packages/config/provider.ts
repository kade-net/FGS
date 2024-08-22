import { Config } from "./types";
import { Lama } from 'lama'


export class ConfigProvider {
    config: Config;
    store: Lama

    constructor(config: Config, store: Lama) {
        this.config = config;
        this.store = store;
    }

    static async init(config?: Config, pathToStore?: string) {
        const store = await Lama.init('config', pathToStore);
        const currentConfig = await store.get<Config>('config');

        if (!config && !currentConfig) {
            throw new Error("Please provide a config");
        }

        if (config && !currentConfig) {

            await store.put('config', config);

            return new ConfigProvider(config, store)
        }


        return new ConfigProvider(currentConfig, store);
    }
}