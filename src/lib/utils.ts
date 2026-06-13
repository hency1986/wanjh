import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// 价格配置接口
export interface PriceConfig {
  [key: number]: {
    price: number;
    alipayLink: string;
  };
}

// 系统配置接口
export interface SystemConfig {
  adminPassword: string;
  contactEmail: string;
  wechatId: string;
  wechatQrCodeUrl: string;
  instructions: string;
  // 支付宝配置
  alipayAppId?: string;
  alipayPrivateKey?: string;
  alipayPublicKey?: string;
  alipayGatewayUrl?: string;
  alipayNotifyUrl?: string;
  alipaySignType?: string;
}

// 支付记录接口
export interface PaymentRecord {
  id: string;
  machineCode: string;
  activationCode: string;
  period: number;
  price: number;
  paymentDate: string;
  ipAddress: string;
  userAgent: string;
}

// 默认价格配置
export const defaultPriceConfig: PriceConfig = {
  180: { 
    price: 58, 
    alipayLink: "https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=Alipay%20QR%20code%20for%2058%20CNY%20payment&sign=30135a22c2e741ac6ca50ac1782f0ba9"
  },
  365: { 
    price: 98, 
    alipayLink: "https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=Alipay%20QR%20code%20for%2098%20CNY%20payment&sign=a49ea097de1570cb5b237d80ce381ffe"
  },
  1095: { 
    price: 158, 
    alipayLink: "https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=Alipay%20QR%20code%20for%20158%20CNY%20payment&sign=a05e7a2e7d18fe624f21ed245273cb9b"
  },
  0: { 
    price: 268, 
    alipayLink: "https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=Alipay%20QR%20code%20for%20268%20CNY%20payment&sign=9b73367c8f7a5cf4946092f768204923"
  }
};

// 默认系统配置
export const defaultSystemConfig: SystemConfig = {
  adminPassword: 'admin123',
  contactEmail: '2813272709@qq.com',
  wechatId: 'software_support',
  wechatQrCodeUrl: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=WeChat%20QR%20code%20for%20friend%20adding&sign=c89bee6b2d74d46b20466473e54a87bf',
  instructions: '欢迎使用我们的软件激活服务。如有任何问题，请联系客服微信或发送邮件咨询。',
  // 支付宝沙箱环境默认配置
  alipayGatewayUrl: 'https://openapi.alipaydev.com/gateway.do',
  alipaySignType: 'RSA2'
};

// 导入API服务
import { apiService } from './apiService';

// 获取价格配置
export const getPriceConfig = async (): Promise<PriceConfig> => {
  try {
    // 先尝试从API获取数据
    const response = await apiService.getPriceConfig();
    if (response.success && response.data) {
      return response.data;
    }
    
    // API获取失败时，使用localStorage作为备份
    const savedConfig = localStorage.getItem('priceConfig');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
    
    return defaultPriceConfig;
  } catch (error) {
    console.error('获取价格配置失败:', error);
    
    // 出错时，尝试从localStorage获取
    try {
      const savedConfig = localStorage.getItem('priceConfig');
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
    } catch (localError) {
      console.error('从localStorage获取价格配置也失败:', localError);
    }
    
    return defaultPriceConfig;
  }
};

// 保存价格配置
export const savePriceConfig = async (config: PriceConfig): Promise<boolean> => {
  try {
    // 先尝试保存到API
    const response = await apiService.savePriceConfig(config);
    if (response.success) {
      // API保存成功后，也保存到localStorage作为备份
      try {
        localStorage.setItem('priceConfig', JSON.stringify(config));
      } catch (localError) {
        console.warn('保存到localStorage失败:', localError);
      }
      return true;
    }
    
    // API保存失败时，尝试只保存到localStorage
    localStorage.setItem('priceConfig', JSON.stringify(config));
    return false; // 返回false表示仅保存到了localStorage
  } catch (error) {
    console.error('保存价格配置失败:', error);
    
    // 出错时，尝试只保存到localStorage
    try {
      localStorage.setItem('priceConfig', JSON.stringify(config));
    } catch (localError) {
      console.error('保存到localStorage也失败:', localError);
      return false;
    }
    
    return false; // 返回false表示仅保存到了localStorage
  }
};

// 获取系统配置
export const getSystemConfig = async (): Promise<SystemConfig> => {
  try {
    // 先尝试从API获取数据
    const response = await apiService.getSystemConfig();
    if (response.success && response.data) {
      return response.data;
    }
    
    // API获取失败时，使用localStorage作为备份
    const savedConfig = localStorage.getItem('systemConfig');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
    
    return defaultSystemConfig;
  } catch (error) {
    console.error('获取系统配置失败:', error);
    
    // 出错时，尝试从localStorage获取
    try {
      const savedConfig = localStorage.getItem('systemConfig');
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
    } catch (localError) {
      console.error('从localStorage获取系统配置也失败:', localError);
    }
    
    return defaultSystemConfig;
  }
};

// 保存系统配置
export const saveSystemConfig = async (config: SystemConfig): Promise<boolean> => {
  try {
    // 先尝试保存到API
    const response = await apiService.saveSystemConfig(config);
    if (response.success) {
      // API保存成功后，也保存到localStorage作为备份
      try {
        localStorage.setItem('systemConfig', JSON.stringify(config));
      } catch (localError) {
        console.warn('保存到localStorage失败:', localError);
      }
      return true;
    }
    
    // API保存失败时，尝试只保存到localStorage
    localStorage.setItem('systemConfig', JSON.stringify(config));
    return false; // 返回false表示仅保存到了localStorage
  } catch (error) {
    console.error('保存系统配置失败:', error);
    
    // 出错时，尝试只保存到localStorage
    try {
      localStorage.setItem('systemConfig', JSON.stringify(config));
    } catch (localError) {
      console.error('保存到localStorage也失败:', localError);
      return false;
    }
    
    return false; // 返回false表示仅保存到了localStorage
  }
};

// 获取支付记录
export const getPaymentRecords = async (): Promise<PaymentRecord[]> => {
  try {
    // 先尝试从API获取数据
    const response = await apiService.getPaymentRecords();
    if (response.success && response.data) {
      return response.data;
    }
    
    // API获取失败时，使用localStorage作为备份
    const savedRecords = localStorage.getItem('paymentRecords');
    if (savedRecords) {
      return JSON.parse(savedRecords);
    }
    
    return [];
  } catch (error) {
    console.error('获取支付记录失败:', error);
    
    // 出错时，尝试从localStorage获取
    try {
      const savedRecords = localStorage.getItem('paymentRecords');
      if (savedRecords) {
        return JSON.parse(savedRecords);
      }
    } catch (localError) {
      console.error('从localStorage获取支付记录也失败:', localError);
    }
    
    return [];
  }
};

// 保存支付记录
export const savePaymentRecord = async (record: Omit<PaymentRecord, 'id'>): Promise<boolean> => {
  try {
    // 先尝试保存到API
    const response = await apiService.savePaymentRecord(record);
    if (response.success) {
      // API保存成功后，也保存到localStorage作为备份
      try {
        const records = await getPaymentRecords();
        const newRecord: PaymentRecord = {
          ...record,
          id: response.data?.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
        };
        // 避免重复添加
        if (!records.some(r => r.id === newRecord.id)) {
          records.push(newRecord);
          localStorage.setItem('paymentRecords', JSON.stringify(records));
        }
      } catch (localError) {
        console.warn('保存到localStorage失败:', localError);
      }
      return true;
    }
    
    // API保存失败时，尝试只保存到localStorage
    const records = await getPaymentRecords();
    const newRecord: PaymentRecord = {
      ...record,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    records.push(newRecord);
    localStorage.setItem('paymentRecords', JSON.stringify(records));
    return false; // 返回false表示仅保存到了localStorage
  } catch (error) {
    console.error('保存支付记录失败:', error);
    
    // 出错时，尝试只保存到localStorage
    try {
      const records = await getPaymentRecords();
      const newRecord: PaymentRecord = {
        ...record,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      };
      records.push(newRecord);
      localStorage.setItem('paymentRecords', JSON.stringify(records));
    } catch (localError) {
      console.error('保存到localStorage也失败:', localError);
      return false;
    }
    
    return false; // 返回false表示仅保存到了localStorage
  }
};

// 管理类名合并
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
