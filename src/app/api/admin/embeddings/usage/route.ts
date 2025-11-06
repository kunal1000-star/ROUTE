import { NextRequest, NextResponse } from 'next/server';

// Mock usage data based on the provider configurations
const MOCK_USAGE_DATA = {
  total: {
    requests: 2139,
    cost: 4.23
  },
  byProvider: {
    cohere: {
      requests: 1247,
      cost: 2.45,
      healthy: true
    },
    mistral: {
      requests: 892,
      cost: 1.78,
      healthy: true
    },
    google: {
      requests: 0,
      cost: 0,
      healthy: false
    }
  },
  dailyTrends: [
    { date: '2025-11-05', requests: 156, cost: 0.34 },
    { date: '2025-11-04', requests: 203, cost: 0.45 },
    { date: '2025-11-03', requests: 189, cost: 0.41 },
    { date: '2025-11-02', requests: 234, cost: 0.52 },
    { date: '2025-11-01', requests: 198, cost: 0.44 },
    { date: '2025-10-31', requests: 267, cost: 0.59 },
    { date: '2025-10-30', requests: 245, cost: 0.54 }
  ],
  topQueries: [
    { query: 'What is machine learning?', requests: 45, cost: 0.089 },
    { query: 'Explain neural networks', requests: 38, cost: 0.075 },
    { query: 'Python programming basics', requests: 32, cost: 0.063 },
    { query: 'Database normalization', requests: 29, cost: 0.057 },
    { query: 'API design principles', requests: 27, cost: 0.053 }
  ]
};

// GET /api/admin/embeddings/usage
export async function GET(request: NextRequest) {
  try {
    // Simulate data loading delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Add some randomization to make the data feel live
    const adjustedData = {
      ...MOCK_USAGE_DATA,
      total: {
        requests: MOCK_USAGE_DATA.total.requests + Math.floor(Math.random() * 10),
        cost: (MOCK_USAGE_DATA.total.cost + Math.random() * 0.1).toFixed(4)
      },
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: adjustedData
    });
  } catch (error) {
    console.error('Error fetching embedding usage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}

// POST /api/admin/embeddings/usage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'reset':
        // Reset all usage data
        const resetData = {
          total: {
            requests: 0,
            cost: 0
          },
          byProvider: {
            cohere: { requests: 0, cost: 0, healthy: true },
            mistral: { requests: 0, cost: 0, healthy: true },
            google: { requests: 0, cost: 0, healthy: false }
          },
          dailyTrends: [],
          topQueries: [],
          lastReset: new Date().toISOString()
        };

        return NextResponse.json({
          success: true,
          data: resetData
        });

      case 'export':
        // Export usage data as CSV format
        const csvData = [
          'Date,Provider,Requests,Cost,Status',
          ...Object.entries(MOCK_USAGE_DATA.byProvider).map(([provider, data]) => 
            `${new Date().toISOString().split('T')[0]},${provider},${data.requests},$${data.cost.toFixed(4)},${data.healthy ? 'Healthy' : 'Unhealthy'}`
          )
        ].join('\n');

        return new NextResponse(csvData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="embedding-usage.csv"'
          }
        });

      case 'generate-report':
        // Generate a detailed usage report
        const report = {
          period: 'Last 30 days',
          summary: {
            totalRequests: MOCK_USAGE_DATA.total.requests,
            totalCost: MOCK_USAGE_DATA.total.cost,
            averageCostPerRequest: (MOCK_USAGE_DATA.total.cost / MOCK_USAGE_DATA.total.requests).toFixed(6),
            topProvider: 'cohere',
            mostActiveDay: '2025-10-31'
          },
          providerBreakdown: MOCK_USAGE_DATA.byProvider,
          trends: MOCK_USAGE_DATA.dailyTrends,
          topQueries: MOCK_USAGE_DATA.topQueries,
          recommendations: [
            'Consider enabling Google AI provider for better redundancy',
            'Cohere usage is within normal limits',
            'Daily costs are well under budget thresholds'
          ],
          generatedAt: new Date().toISOString()
        };

        return NextResponse.json({
          success: true,
          data: report
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing embedding usage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process usage request' },
      { status: 500 }
    );
  }
}
