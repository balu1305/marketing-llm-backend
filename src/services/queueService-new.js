// Queue service disabled - Redis functionality removed
// All queue operations return mock responses to maintain API compatibility

class QueueManager {
  constructor() {
    this.queues = {};
    this.isInitialized = false;
  }

  async initialize() {
    // Queue service disabled - no Redis needed
    console.log('⚠️  Queue service disabled - Redis functionality removed');
    this.isInitialized = true;
    return true;
  }

  setupQueueListeners() {
    // Disabled - no queue listeners needed
    console.log('⚠️  Queue listeners disabled');
  }

  registerProcessors() {
    // Disabled - no processors needed
    console.log('⚠️  Queue processors disabled');
  }

  async addContentGenerationJob(jobType, data, options = {}) {
    // Mock response - queue disabled
    console.log(`⚠️  Content generation job skipped (Redis disabled): ${jobType}`);
    return {
      id: `mock-job-${Date.now()}`,
      status: 'completed',
      message: 'Queue service disabled - job not processed'
    };
  }

  async addEmailJob(jobType, data, options = {}) {
    // Mock response - queue disabled
    console.log(`⚠️  Email job skipped (Redis disabled): ${jobType}`);
    return {
      id: `mock-job-${Date.now()}`,
      status: 'completed',
      message: 'Queue service disabled - job not processed'
    };
  }

  async addAnalyticsJob(jobType, data, options = {}) {
    // Mock response - queue disabled
    console.log(`⚠️  Analytics job skipped (Redis disabled): ${jobType}`);
    return {
      id: `mock-job-${Date.now()}`,
      status: 'completed',
      message: 'Queue service disabled - job not processed'
    };
  }

  async getJobStatus(queueName, jobId) {
    // Mock response - queue disabled
    return {
      id: jobId,
      status: 'completed',
      progress: 100,
      message: 'Queue service disabled'
    };
  }

  async getQueueStats(queueName) {
    // Mock response - queue disabled
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: 0
    };
  }

  async cleanup() {
    // No cleanup needed - queues disabled
    console.log('⚠️  Queue cleanup skipped - Redis disabled');
  }

  isHealthy() {
    // Always return false since queues are disabled
    return false;
  }

  async getAllQueuesStatus() {
    // Mock response - all queues disabled
    return {
      contentGeneration: { status: 'disabled', message: 'Redis not available' },
      emailSending: { status: 'disabled', message: 'Redis not available' },
      analytics: { status: 'disabled', message: 'Redis not available' },
      exports: { status: 'disabled', message: 'Redis not available' }
    };
  }
}

module.exports = new QueueManager();
