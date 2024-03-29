module.exports = {
    env: 'production',
    jwtSecret: '4DNSrMPuQ3Y3McBu96wd2GzGheDXuft8gDqLEQVWHnXQfcaGFtM2ZBgyNYzPN7CK',
    db: 'mongodb://localhost/rodin-js-api-production',
    clientURL: 'https://rodin.io',
    editorURL: 'https://editor.rodin.io',
    port: 3000,
    socketPort: 4000,
    host:'http://localhost:3000',
    socketURL: 'http://localhost:5000',
    modules: {
        ROOT: 'https://modules.rodin.io',
        socketService: {
            URL: 'https://modules.rodin.io',
            port: 4000,
        },
    },
    social: {
        facebook: {
            clientID: '214577345643265',
            clientSecret: 'c7c79a4791b592c54cb79a8b3a671384',
            callbackURL: 'https://rodinapp.com/auth/facebook/callback',
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
            clientId: 'd2030c37902fa3d4d0c7',
            clientSecret: 'eb3b8ec68c8dfc03b81383f9486c3f424146a144',
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
            build: 'http://45.55.92.49:9001/api/v1/project',
            cancel: 'http://45.55.92.49:9001/api/v1/project',
            get: 'http://45.55.92.49:9001/api/v1/project',
            download: 'http://45.55.92.49:9001/api/v1/bin',
            getStatus: 'http://45.55.92.49:9001/api/v1/status',
        },
        appId: 'b250ab167fca8e94',
        appSecret: '6a1e68ce-ea2b-d99d-b5eb-7cbca83a',
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
            build: 'http://45.55.92.49:9002/api/v1/project',
            cancel: 'http://45.55.92.49:9002/api/v1/project',
            get: 'http://45.55.92.49:9002/api/v1/project',
            download: 'http://45.55.92.49:9002/api/v1/bin',
            getStatus: 'http://45.55.92.49:9002/api/v1/status',
        },
        appId: '8fb0e4c6fdac3847',
        appSecret: '86bae61d-ddfe-9fbe-e4cd-904fced2',
    },
    vive: {
        urls: {
            build: 'http://45.55.92.49:9003/api/v1/project',
            cancel: 'http://45.55.92.49:9003/api/v1/project',
            get: 'http://45.55.92.49:9003/api/v1/project',
            download: 'http://45.55.92.49:9003/api/v1/bin',
            getStatus: 'http://45.55.92.49:9003/api/v1/status',
        },
        appId: '1f07df95852ba6b1',
        appSecret: '6d221d4d-aad7-7b94-1542-de2f31b4',
    },
    payments: {
        tokens: {
            stripe: {
                secret: 'sk_live_pZFiK96Dp8SYIWaIayj0y4mo',
                publish: 'pk_live_p1dRUyM6Dq6iLeFgXBV4VeK2',
            },
        },
    },
    mandrill: 'ouOYaHWxlDaabLYVjrG1BA',
    stuff_path: '/var/www/stuff/',
    nginx_template_path: '/var/www/api.rodinapp.com/resources/nginx/',
    nginx_dest_path: '/etc/nginx/custom/',
    redis: {
        // host: '40.121.202.156',
        host: 'redis-domain',
        port: 6379,
        password: 'mTJV^ajEP4QJSSM6~SGHZZrX;fJz.NUm',
        db: {
            custom_domain: 0,
            jwt: 1,
        },
    },
};
