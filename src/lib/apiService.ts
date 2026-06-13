// 模拟API服务层，用于与MySQL数据库交互

// 定义API响应接口
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 基础API URL
const API_BASE_URL = '/api';

// 模拟API延迟
const simulateDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 模拟API请求函数
const mockApiRequest = async <T>(endpoint: string, method: string = 'GET', data?: any): Promise<ApiResponse<T>> => {
  try {
    // 模拟网络延迟
    await simulateDelay();
    
    // 在实际应用中，这里会发送真实的API请求
    // const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    //   method,
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: data ? JSON.stringify(data) : undefined
    // });
    // const result = await response.json();
    // return result;
    
    // 模拟从localStorage读取数据（实际应用中会从MySQL数据库读取）
    const storageKey = endpoint.replace(/\//g, '_').substring(1); // 去除开头的斜杠并替换剩余斜杠为下划线
    
    // 根据不同的endpoint和method返回不同的模拟数据
    if (method === 'GET') {
      if (endpoint === '/system-config') {
        const config = localStorage.getItem('systemConfig');
        return {
          success: true,
          data: config ? JSON.parse(config) : null
        };
      } else if (endpoint === '/price-config') {
        const config = localStorage.getItem('priceConfig');
        return {
          success: true,
          data: config ? JSON.parse(config) : null
        };
      } else if (endpoint === '/payment-records') {
        const records = localStorage.getItem('paymentRecords');
        return {
          success: true,
          data: records ? JSON.parse(records) : []
        };
      }
    } else if (method === 'POST' || method === 'PUT') {
      if (endpoint === '/system-config') {
        localStorage.setItem('systemConfig', JSON.stringify(data));
        return {
          success: true,
          data
        };
      } else if (endpoint === '/price-config') {
        localStorage.setItem('priceConfig', JSON.stringify(data));
        return {
          success: true,
          data
        };
      } else if (endpoint === '/payment-records') {
        const records = localStorage.getItem('paymentRecords');
        const recordsArray = records ? JSON.parse(records) : [];
        const newRecord = {
          ...data,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        };
        recordsArray.push(newRecord);
        localStorage.setItem('paymentRecords', JSON.stringify(recordsArray));
        return {
          success: true,
          data: newRecord
        };
      }
    }
    
    // 默认返回成功但无数据
    return {
      success: true,
      data: null as unknown as T
    };
  } catch (error) {
    console.error(`API请求失败: ${endpoint}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

// 导出API服务函数
export const apiService = {
  // 获取系统配置
  getSystemConfig: async () => {
    return mockApiRequest<any>('/system-config', 'GET');
  },
  
  // 保存系统配置
  saveSystemConfig: async (config: any) => {
    return mockApiRequest<any>('/system-config', 'PUT', config);
  },
  
  // 获取价格配置
  getPriceConfig: async () => {
    return mockApiRequest<any>('/price-config', 'GET');
  },
  
  // 保存价格配置
  savePriceConfig: async (config: any) => {
    return mockApiRequest<any>('/price-config', 'PUT', config);
  },
  
  // 获取支付记录
  getPaymentRecords: async () => {
    return mockApiRequest<any>('/payment-records', 'GET');
  },
  
  // 保存支付记录
  savePaymentRecord: async (record: any) => {
    return mockApiRequest<any>('/payment-records', 'POST', record);
  }
};