module.exports = {
    env: 'test',
    jwtSecret: '4DNSrMPuX3Y3McBu96wd2GzGheDX4ft8gDqLEQVWHnXQfcaGFtM2ZBgyNYzPN87F',
    db: 'mongodb://localhost/rodin-js-api-test',
    port: 5000,
    socketPort: 6000,
    host:'http://localhost:3000',
    socketURL: 'http://localhost:5000',
    clientURL: 'https://rodin.space',
    modules: {
        socketService: {
            URL: 'http://localhost:4000',
            port: 4000,
        },
    },
    social: {
        facebook: {
            clientID: 'test',
            clientSecret: 'test',
            callbackURL: 'http://localhost:3000/auth/facebook/callback',
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
    },
    urlshortenerkey: 'AIzaSyCe5zVHHHhhv40N-WzeffxWva377dPQnH8',
    socket: {
        appId: '358b43a076ed7dc0',
        appSecret: '50835ec1-0392-7c98-60be-3f4ad1b7',
    },
    payments: {
        tokens: {
            stripe: {
                secret: 'sk_test_Yrs9CAb0mtmarXakiICOR57A',
                publish: 'pk_test_LHEyhlVOjm1mm7WXI2884CyG',
            },
        },
    },
    stuff_path: '',
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
