interface Config {
	server: {
		port: Number;
	},
    db: {
        database: string;
        host: string;
        port: Number;
    },
    solana: {
        rpc: string;
    }
}

const config: Config = {
	server: {
		port: 3000
	},
    db: {
        database: "fatira",
        host: "0.0.0.0",
        port: 27017
    },
    solana: {
        rpc: ""
    }
}

export default config;