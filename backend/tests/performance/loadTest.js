const request = require('supertest');
const app = require('../server');

/**
 * Performance and Load Testing Utilities
 * Validates system performance under load
 */

class PerformanceTest {
  constructor() {
    this.results = [];
  }

  /**
   * Test concurrent user load
   * Target: 5,000 concurrent users (initial target)
   */
  async testConcurrentLoad(concurrentUsers = 100, endpoint = '/api/questions/generate') {
    console.log(`\n🔥 Starting concurrent load test with ${concurrentUsers} users...`);
    
    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < concurrentUsers; i++) {
      const promise = request(app)
        .post(endpoint)
        .send({
          userId: `test-user-${i}`,
          userType: 'student',
          sourceText: 'Database management systems provide data independence and efficient data access.',
          difficulty: 'medium',
          questionCount: 3
        })
        .then(response => ({
          status: response.status,
          latency: Date.now() - startTime,
          success: response.status === 200
        }))
        .catch(error => ({
          status: error.response?.status || 500,
          latency: Date.now() - startTime,
          success: false,
          error: error.message
        }));

      promises.push(promise);
    }

    const results = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    // Calculate metrics
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const successRate = (successCount / concurrentUsers) * 100;
    
    const latencies = results.map(r => r.latency);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);
    const minLatency = Math.min(...latencies);

    const report = {
      concurrentUsers,
      totalTime,
      successCount,
      failCount,
      successRate,
      avgLatency,
      maxLatency,
      minLatency,
      throughput: concurrentUsers / totalTime
    };

    console.log('\n📊 Load Test Results:');
    console.log(`   Concurrent Users: ${concurrentUsers}`);
    console.log(`   Total Time: ${totalTime.toFixed(2)}s`);
    console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`   Avg Latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`   Min/Max Latency: ${minLatency}ms / ${maxLatency}ms`);
    console.log(`   Throughput: ${report.throughput.toFixed(2)} req/s`);

    this.results.push(report);
    return report;
  }

  /**
   * Test response time under normal load
   */
  async testResponseTime(iterations = 50) {
    console.log(`\n⏱️  Testing response times (${iterations} iterations)...`);
    
    const latencies = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      
      await request(app)
        .post('/api/questions/generate')
        .send({
          userId: 'perf-test-user',
          userType: 'student',
          sourceText: 'SQL joins combine rows from two or more tables based on related columns.',
          difficulty: 'medium',
          questionCount: 3
        });

      const latency = Date.now() - start;
      latencies.push(latency);
    }

    // Calculate statistics
    latencies.sort((a, b) => a - b);
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const median = latencies[Math.floor(latencies.length / 2)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    const report = {
      iterations,
      avgLatency: avg,
      medianLatency: median,
      p95Latency: p95,
      p99Latency: p99,
      minLatency: Math.min(...latencies),
      maxLatency: Math.max(...latencies)
    };

    console.log('\n📊 Response Time Results:');
    console.log(`   Median: ${median}ms`);
    console.log(`   Average: ${avg.toFixed(2)}ms`);
    console.log(`   95th percentile: ${p95}ms`);
    console.log(`   99th percentile: ${p99}ms`);
    console.log(`   Min/Max: ${report.minLatency}ms / ${report.maxLatency}ms`);

    // PR-1 validation: median < 3000ms
    const passedPR1 = median < 3000;
    console.log(`   PR-1 Target (<3s): ${passedPR1 ? '✅ PASS' : '❌ FAIL'}`);

    this.results.push(report);
    return report;
  }

  /**
   * Test database query performance
   */
  async testDatabasePerformance() {
    console.log('\n💾 Testing database query performance...');
    
    const tests = [
      { name: 'Get User Questions', endpoint: '/api/questions/user', method: 'get' },
      { name: 'Filter Questions', endpoint: '/api/questions/filtered', method: 'get' },
      { name: 'Get Quiz', endpoint: '/api/quiz/list', method: 'get' }
    ];

    const results = [];

    for (const test of tests) {
      const iterations = 20;
      const latencies = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        
        if (test.method === 'get') {
          await request(app)
            .get(test.endpoint)
            .query({ userId: 'test-user', userType: 'student' });
        }

        latencies.push(Date.now() - start);
      }

      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      results.push({
        testName: test.name,
        avgLatency: avg,
        iterations
      });

      console.log(`   ${test.name}: ${avg.toFixed(2)}ms avg`);
    }

    return results;
  }

  /**
   * Test memory usage under load
   */
  async testMemoryUsage() {
    console.log('\n🧠 Testing memory usage...');
    
    const initialMemory = process.memoryUsage();
    
    // Generate load
    await this.testConcurrentLoad(50);
    
    const finalMemory = process.memoryUsage();
    
    const memoryIncrease = {
      heapUsed: ((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024).toFixed(2),
      external: ((finalMemory.external - initialMemory.external) / 1024 / 1024).toFixed(2),
      rss: ((finalMemory.rss - initialMemory.rss) / 1024 / 1024).toFixed(2)
    };

    console.log('\n📊 Memory Usage:');
    console.log(`   Heap Increase: ${memoryIncrease.heapUsed} MB`);
    console.log(`   External Increase: ${memoryIncrease.external} MB`);
    console.log(`   RSS Increase: ${memoryIncrease.rss} MB`);

    return memoryIncrease;
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport() {
    console.log('\n\n' + '='.repeat(60));
    console.log('📋 COMPREHENSIVE PERFORMANCE REPORT');
    console.log('='.repeat(60));

    this.results.forEach((result, index) => {
      console.log(`\nTest ${index + 1}:`, JSON.stringify(result, null, 2));
    });

    console.log('\n' + '='.repeat(60));
  }
}

// Export for use in tests
module.exports = PerformanceTest;

// Run if called directly
if (require.main === module) {
  const tester = new PerformanceTest();
  
  (async () => {
    try {
      // Run all performance tests
      await tester.testResponseTime(50);
      await tester.testConcurrentLoad(100);
      await tester.testDatabasePerformance();
      await tester.testMemoryUsage();
      
      tester.generateReport();
      
      console.log('\n✅ Performance testing completed!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Performance testing failed:', error);
      process.exit(1);
    }
  })();
}
