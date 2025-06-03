export function checkEnvVars(keys: string[]) {
    keys.forEach(key => {
        if(!process.env[key])
            throw new Error(`${key} is missing from env.`);
    });
}