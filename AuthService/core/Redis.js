const IORedis = require('ioredis');

class Redis {
  client;
  constructor({
    sentinel1_address, sentinel1_port,
    sentinel2_address, sentinel2_port,
    sentinel3_address, sentinel3_port,
    password,
    sentinelName,
    showConnectionInfo,
  }) {
    this.showConnectionInfo = showConnectionInfo || false;
    this.sentinels = [
      { host: sentinel1_address, port: sentinel1_port },
      { host: sentinel2_address, port: sentinel2_port },
      { host: sentinel3_address, port: sentinel3_port },
    ];
    this.password = password || undefined;
    this.sentinelName = sentinelName;
  };

  cloneConnection = async () => {
    const {
      sentinel1_address, sentinel1_port,
      sentinel2_address, sentinel2_port,
      sentinel3_address, sentinel3_port,
      password,
      sentinelName,
      showConnectionInfo,
    } = this;

    const clone = new Redis({
      sentinel1_address, sentinel1_port,
      sentinel2_address, sentinel2_port,
      sentinel3_address, sentinel3_port,
      password,
      sentinelName,
      showConnectionInfo,
    });

    await clone.connect();

    return clone;
  };

  connect = () => {
    return new Promise((resolve, reject) => {
      const options = {
        sentinels: this.sentinels,
        name: this.sentinelName,
        maxRetriesPerRequest: 3,
      };
      if (typeof this.password !== 'undefined' && typeof this.password === 'string') {
        options.password = this.password;
        options.sentinelPassword = this.password;
      };
      this.client = new IORedis(options);
      this.client.on('error', (err) => {
        reject(`Redis connection refused: ${err.message}`);
      });
      this.client.on('ready', async () => {
        console.log(`Connected to Redis Sentinels <${this.sentinels.map(({host, port}) => `${host}:${port}`).join(',')}>`)
        if (this.showConnectionInfo === true) {
          const info = await this.client.info();
          console.log(`Redis connection info:`, info);
        }
        resolve(this.client)
      });
    });
  };
};

module.exports = Redis;