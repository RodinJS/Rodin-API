module.exports = {
    env: 'local',
    jwtSecret: '4DNSrMPuQ3Y3McBu96wd2GzGheDXuft8gDqLEQVWHnXQfcaGFtM2ZBgyNYzPN7CK',
    db: 'mongodb://localhost/rodin-js-api-development',
    clientURL: 'http://localhost:8585/#',
    editorURL: 'http://localhost:8000/#',
    port: 3000,
    socketPort: 4000,
    socketURL: 'http://localhost:4000',
    modules: {
        socketService: {
            port: 5000,
        },
    },
    social: {
        facebook: {
            clientID: '216982868736046',
            clientSecret: '12377e383557cecdc463f202cdc89758',
            callbackURL: 'https://rodin.space/api/auth/facebook/callback',
        },
        google: {
            clientID: 'test',
            clientSecret: 'test',
            callbackURL: 'http://yourdormain:3000/auth/google/callback',
        },
        steam: {
            key: 'D62596D7F75C45FFCFA07B938478844F',
            clientSecret: '12377e383557cecdc463f202cdc89758',
            callbackURL: 'http://localhost:3000/api/auth/steam/callback',
        },
        github: {
            /*  clientId: '1600631d3a04c8eff4e7',
             clientSecret: '7334447b351bbbad91a5701e4b02b8ab47458789',*/
            clientId: '2350afe57c144672285b',
            clientSecret: '3b16cafe190ecdc3a659198dc32b396b95dff77a',
        },
    },
    urlshortenerkey: 'AIzaSyCe5zVHHHhhv40N-WzeffxWva377dPQnH8',
    socket: {
        appId: '358b43a076ed7dc0',
        appSecret: '50835ec1-0392-7c98-60be-3f4ad1b7',
    },
    ios: {
        urls: {
            build: 'http://63.135.170.41:10000/api/v1/project',
            cancel: 'http://63.135.170.41:10000/api/v1/project',
            get: 'http://63.135.170.41:10000/api/v1/project',
            download: 'http://63.135.170.41:10000/api/v1/bin',
            getStatus: 'http://63.135.170.41:10000/api/v1/status',
        },
        appId: '2e659ea81e645f84',
        appSecret: 'af7cffae-17ce-25b2-8b76-849df75a',
    },
    android: {
        urls: {
            build: 'http://13.92.235.174:10001/api/v1/project',
            cancel: 'http://13.92.235.174:10001/api/v1/project',
            get: 'http://13.92.235.174:10001/api/v1/project',
            download: 'http://13.92.235.174:10001/api/v1/bin',
            getStatus: 'http://13.92.235.174:10001/api/v1/status',
        },
        appId: 'f4357582f4711a27',
        appSecret: '780befc0-fa03-a5ef-f942-94c142da',
    },
    daydream: {
        urls: {
            build: 'http://13.92.235.174:10001/api/v1/project',
            cancel: 'http://13.92.235.174:10001/api/v1/project',
            get: 'http://13.92.235.174:10001/api/v1/project',
            download: 'http://13.92.235.174:10001/api/v1/bin',
            getStatus: 'http://13.92.235.174:10001/api/v1/status',
        },
        appId: 'f4357582f4711a27',
        appSecret: '780befc0-fa03-a5ef-f942-94c142da',
    },
    oculus: {
        urls: {
            build: 'http://13.92.235.174:10002/api/v1/project',
            cancel: 'http://13.92.235.174:10002/api/v1/project',
            get: 'http://13.92.235.174:10002/api/v1/project',
            download: 'http://13.92.235.174:10002/api/v1/bin',
            getStatus: 'http://13.92.235.174:10002/api/v1/status',
        },
        appId: 'f07e5efe21c47d2a',
        appSecret: '61d75b4f-d2d1-3cba-3129-ef4e3c03',
    },
    vive: {
        urls: {
            build: 'http://13.92.235.174:10003/api/v1/project',
            cancel: 'http://13.92.235.174:10003/api/v1/project',
            get: 'http://13.92.235.174:10003/api/v1/project',
            download: 'http://13.92.235.174:10003/api/v1/bin',
            getStatus: 'http://13.92.235.174:10003/api/v1/status',
        },
        appId: 'b17bbf258ca3e14a',
        appSecret: 'a13ecb3d-2fbe-2d2f-dbb4-21e4cdd0',
    },
    payments: {
        tokens: {
            stripe: {
                secret: 'sk_test_Yrs9CAb0mtmarXakiICOR57A',
                publish: 'pk_test_LHEyhlVOjm1mm7WXI2884CyG',
            },
            paypal: {
                mode: 'sandbox',
                clientId: 'AcILaf8OIR1IFIG5bCG6OaS7WI3DISrJHVkGgWWYjQ22Dwl-Covb1byyxI7zzy6ks9rLMLDNsbwIFqye',
                clientSecret: 'EFpzVs5Sad5mOnsqZqcJnw2X4MVozbD4iUzfD9K8AOrkdQl06_dx5VNkR80cy0f7Edyi5dUccTpz6rXb',
            },
        },
    },
    mandrill: 'ouOYaHWxlDaabLYVjrG1BA',
    stuff_path: '',
    redis: {
        host: '40.121.202.156',
        port: 6333,
        password: 'mTJV^ajEP4QJSSM6~SGHZZrX;fJz.NUm',
        // password: 'Gag0',
        db: {
            custom_domain: 0,
            jwt: 1,
        },
    },
};
