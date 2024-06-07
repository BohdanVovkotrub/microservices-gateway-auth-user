const mongoose = require('mongoose');

const thisScriptPath = `core/MongoDB.js`;

class MongoDB {
  constructor(mongodbConfig) {
    this.username = mongodbConfig.MONGO_USERNAME;
    this.password = mongodbConfig.MONGO_PASSWORD;
    this.replicaSetId = mongodbConfig.MONGO_REPLICA_SET_ID;
    this.host_primary = mongodbConfig.MONGO_HOST_PRIMARY;
    this.port_primary = mongodbConfig.MONGO_PORT_PRIMARY;
    this.host_secondary_1 = mongodbConfig.MONGO_HOST_SECONDARY_1;
    this.port_secondary_1 = mongodbConfig.MONGO_PORT_SECONDARY_1;
    this.host_secondary_2 = mongodbConfig.MONGO_HOST_SECONDARY_2;
    this.port_secondary_2 = mongodbConfig.MONGO_PORT_SECONDARY_2;
    this.dbName = mongodbConfig.MONGO_DB;

  };

  connectToReplicaSet = async () => {
    try {
      const hosts = [
        `${this.host_primary}:${this.port_primary}`,
        `${this.host_secondary_1}:${this.port_secondary_1}`,
        `${this.host_secondary_2}:${this.port_secondary_2}`,
      ];
      const uri = `mongodb://${hosts.join(',')}/?replicaSet=${this.replicaSetId}`;
      await mongoose.connect(uri, {
        dbName: this.dbName,
        auth: {
          username: this.username,
          password: this.password,
        },
      });
      console.log(`Connected to MongoDB <${uri}>`);
      return;
    } catch (error) {
      console.error(`Error while <connectToReplicaSet> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    };
  };
};

module.exports = MongoDB;