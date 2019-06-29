var kurento = require('kurento-client');
var client = null, task = null;

kurento.getKurentoClient = async function() {
    if (client) {
        return client;
    }
    if (!task) {
        task = new Promise((resolve, reject) => {
            kurento('ws://192.168.56.103:8888/kurento', function(error, kurentoClient) {
                if (error) {
                    reject(error);
                } else {
                    client = kurentoClient;
                    resolve(kurentoClient);
                }
            });
        });
    }
    return task;
};

class PipelineTask {
    constructor(client) {
        this.client = client;
    }
    async getPipeline() {
        if (this.pipeline) {
            return this.pipeline;
        }
        if (!this.pipelinePromise) {
            this.pipelinePromise = this.client.create('MediaPipeline');
            this.pipeline = await this.pipelinePromise;
            delete this.pipelinePromise;
            return this.pipeline;
        }
        return await this.pipelinePromise;
    }
    async getComposite() {
        if (this.composite) {
            return this.composite;
        }
        if (!this.compositePromise) {
            this.compositePromise = new Promise(async (resolve) => {
                const pipeline = await this.getPipeline();
                resolve(await pipeline.create('Composite'));
            });
            this.composite = await this.compositePromise;
            delete this.compositePromise;
            return this.composite;
        }
        return await this.compositePromise;
    }
    async release() {
        if (this.released) {
            return;
        }
        if (this.pipeline) {
            this.released = true;
            this.pipeline.release();
            return;
        }
        if (this.pipelinePromise) {
            this.released = true;
            const pipeline = await this.pipelinePromise();
            pipeline.release();
        }
    }
}

kurento.PipelineTask = PipelineTask;

module.exports = kurento;
