module.exports = {
    env: 'local',
    jwtSecret: '4DNSrMPuQ3Y3McBu96wd2GzGheDXuft8gDqLEQVWHnXQfcaGFtM2ZBgyNYzPN7CK',
    db: 'mongodb://localhost:27017/rodin-js-api-development',
    clientURL: 'http://localhost:8585/#',
    editorURL: 'http://localhost:8000/#',
    port: 3000,
    socketPort: 4000,
    host:'http://localhost:3000',
    socketURL: 'http://localhost:5000',
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
            clientId: '2fa42e9372769cc4c527',
            clientSecret: '88bc2d273572783ba635ac901fb0d7d909f45224',
        },
    },
    urlshortenerkey: 'AIzaSyCe5zVHHHhhv40N-WzeffxWva377dPQnH8',
    socket: {
        appId: '358b43a076ed7dc0',
        appSecret: '50835ec1-0392-7c98-60be-3f4ad1b7',
    },
    ios: {
        urls: {
            build: 'http://63.135.170.41:12000/api/v1/project',
            cancel: 'http://63.135.170.41:12000/api/v1/project',
            get: 'http://63.135.170.41:12000/api/v1/project',
            download: 'http://63.135.170.41:12000/api/v1/bin',
            getStatus: 'http://63.135.170.41:12000/api/v1/status',
        },
        appId: '0d5f6462d2ad2ecc',
        appSecret: '5119dbd5-cff3-252f-f8d9-966ff4d3',
    },
    android: {
        urls: {
            build: 'http://13.92.235.174:12001/api/v1/project',
            cancel: 'http://13.92.235.174:12001/api/v1/project',
            get: 'http://13.92.235.174:12001/api/v1/project',
            download: 'http://13.92.235.174:12001/api/v1/bin',
            getStatus: 'http://13.92.235.174:12001/api/v1/status',
        },
        appId: 'b87af47ca712792e',
        appSecret: '06c7b0df-75ac-2633-52b8-f3c5ecf2',
    },
    daydream: {
        urls: {
            build: 'http://13.92.235.174:12001/api/v1/project',
            cancel: 'http://13.92.235.174:12001/api/v1/project',
            get: 'http://13.92.235.174:12001/api/v1/project',
            download: 'http://13.92.235.174:12001/api/v1/bin',
            getStatus: 'http://13.92.235.174:12001/api/v1/status',
        },
        appId: 'b87af47ca712792e',
        appSecret: '06c7b0df-75ac-2633-52b8-f3c5ecf2',
    },
    oculus: {
        urls: {
            build: 'http://13.92.235.174:12002/api/v1/project',
            cancel: 'http://13.92.235.174:12002/api/v1/project',
            get: 'http://13.92.235.174:12002/api/v1/project',
            download: 'http://13.92.235.174:12002/api/v1/bin',
            getStatus: 'http://13.92.235.174:12002/api/v1/status',
        },
        appId: '8be8a15fa0ad2474',
        appSecret: 'bab5dad7-4237-752c-021a-57be0eae',
    },
    vive: {
        urls: {
            build: 'http://13.92.235.174:12003/api/v1/project',
            cancel: 'http://13.92.235.174:12003/api/v1/project',
            get: 'http://13.92.235.174:12003/api/v1/project',
            download: 'http://13.92.235.174:12003/api/v1/bin',
            getStatus: 'http://13.92.235.174:12003/api/v1/status',
        },
        appId: '371a0edcec224a5f',
        appSecret: 'e2195370-1121-7ecf-0a43-fb78c86f',
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
