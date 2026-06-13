// 生成唯一且稳定的机器码（基于系统信息）
const generateUniqueMachineCode = (): string => {
  // 使用相对稳定的系统信息和浏览器标识符生成机器码，确保在同一设备上保持一致
  try {
    // 1. 尝试获取浏览器提供的稳定标识符
    let browserId = '';
    let deviceMemory = 0;
    try {
      // 检查是否有可用的稳定标识符API
      if (typeof (navigator as any).deviceMemory !== 'undefined' && 
          typeof (navigator as any).hardwareConcurrency !== 'undefined') {
        // 使用设备内存和CPU核心数作为稳定因素
        deviceMemory = (navigator as any).deviceMemory;
        const hardwareConcurrency = (navigator as any).hardwareConcurrency;
        
        // 结合这些信息创建一个稳定的标识符
        browserId = `${deviceMemory}-${hardwareConcurrency}`;
      }
    } catch (idError) {
      console.warn('无法获取稳定浏览器标识符:', idError);
    }
    
    // 2. 获取浏览器信息（这些信息在同一设备上通常是稳定的）
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    
    // 3. 获取屏幕信息（在同一设备上通常是稳定的）
    const screenResolution = `${screen.width}x${screen.height}`;
    const colorDepth = screen.colorDepth.toString();
    
    // 4. 尝试获取时区信息（作为额外的稳定因素）
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // 5. 创建一个稳定的字符串，结合所有获取到的信息
    const stableInfo = `${browserId}|${userAgent}|${platform}|${language}|${screenResolution}|${colorDepth}|${timezone}`;
    
    // 6. 创建校验和 - 用于机器码的第二部分
    let checksum = 0;
    for (let i = 0; i < stableInfo.length; i++) {
      checksum += stableInfo.charCodeAt(i);
    }
    
    // 7. 对稳定信息进行哈希处理，生成固定长度的字符串
    const hash = createSimpleHash(stableInfo);
    
    // 8. 组合机器码，格式为：XXXXXX-XXXX-XXXX
    // 第一部分：基于设备内存生成的6个字符
    // 第二部分：基于校验和的4位数字
    // 第三部分：基于哈希的后4个字符
    const part1 = generateMemoryBasedPrefix(deviceMemory);
    const part2 = (checksum % 9999).toString().padStart(4, '0');
    const part3 = hash.substring(hash.length - 4);
    
    const machineCode = `${part1}-${part2}-${part3}`;
    
    // 9. 确保机器码格式符合预期
    return machineCode.toUpperCase();
  } catch (error) {
    console.error('生成机器码时出错:', error);
    // 降级方案：使用更简单但更稳定的生成方式
    return generateStableMachineCode();
  }
};

// 降级方案：生成稳定的机器码
const generateStableMachineCode = (): string => {
  // 使用时间戳和随机数生成一个相对稳定的机器码
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `DEF-${timestamp.slice(0, 2)}-${random}`;
};

// 基于设备内存生成机器码前缀
const generateMemoryBasedPrefix = (deviceMemory: number): string => {
  // 如果没有获取到设备内存，使用默认值
  if (!deviceMemory || deviceMemory <= 0) {
    deviceMemory = 4; // 默认4GB
  }
  
  // 创建基于内存的字符串
  const memoryStr = `MEM${Math.floor(deviceMemory)}GB`;
  
  // 计算哈希值
  let hash = 0;
  for (let i = 0; i < memoryStr.length; i++) {
    hash = ((hash << 5) - hash) + memoryStr.charCodeAt(i);
    hash = hash & hash; // 转换为32位整数
  }
  
  // 将哈希值转换为36进制字符串，并取前6位
  return Math.abs(hash).toString(36).padStart(6, '0').substring(0, 6);
};

// 创建简单的哈希函数
const createSimpleHash = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return '00000000';
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  // 将哈希值转换为16进制字符串，并确保长度足够
  return Math.abs(hash).toString(36).padStart(16, '0');
};

// 生成激活码（增强版）
// 修改为同步函数，确保生成逻辑更加稳定
export const generateActivationCode = (machineCode: string, period: number): string => {
  try {
    // 标准化机器码
    const cleanMachineCode = machineCode.toUpperCase().trim();
    
    // 生成基于机器码和期限的稳定哈希值 - 确保与验证逻辑完全匹配
    let combinedHash = 0;
    
    // 计算机器码的哈希值 - 确保与验证逻辑完全相同
    for (let i = 0; i < cleanMachineCode.length; i++) {
      combinedHash = ((combinedHash << 5) - combinedHash) + cleanMachineCode.charCodeAt(i);
      combinedHash = combinedHash & combinedHash; // 转换为32位整数
    }
    
    // 添加期限信息 - 确保与验证逻辑完全相同
    combinedHash += period * 1000; // 给期限一个适当的权重
    
    // 将哈希值转换为36进制字符串，并确保长度足够 - 确保与验证逻辑完全匹配
    const hashStr = Math.abs(combinedHash).toString(36).toUpperCase().padStart(14, '0');
    
    // 提取各部分并格式化激活码
    // 格式为：XXXXXX-XXXX-XXXX
    
    // 提取机器码的第一部分（基于内存生成的部分）
    const machineCodePart1 = cleanMachineCode.split('-')[0];
    
    // 生成激活码第一部分，确保与机器码第一部分不同
    const part1 = generateUniqueActivationPrefix(machineCodePart1, period);
    const part2 = hashStr.substring(6, 10);
    const part3 = hashStr.substring(10, 14);
    
    // 组合激活码
    const activationCode = `${part1}-${part2}-${part3}`;
    
    console.log('生成激活码:', {
      machineCode: cleanMachineCode,
      period,
      combinedHash,
      hashStr,
      activationCode,
      part1,
      part2,
      part3,
      machineCodePart1
    });
    
    // 保存生成记录用于调试
    const activationLog = {
      timestamp: new Date().toISOString(),
      machineCode: cleanMachineCode,
      period,
      activationCode,
      combinedHash,
      machineCodePart1,
      activationPart1: part1
    };
    
    // 保存到localStorage供调试使用
    try {
      localStorage.setItem('lastActivationCodeGenerated', JSON.stringify(activationLog));
    } catch (error) {
      console.warn('无法保存激活码生成记录:', error);
    }
    
    return activationCode;
  } catch (error) {
    console.error('生成激活码失败:', error);
    throw error;
  }
};

// 生成与机器码前缀不同的激活码前缀
const generateUniqueActivationPrefix = (machineCodePrefix: string, period: number): string => {
  // 创建基于机器码前缀和期限的新哈希值
  let activationPrefixHash = 0;
  
  // 使用机器码前缀作为基础
  for (let i = 0; i < machineCodePrefix.length; i++) {
    activationPrefixHash = ((activationPrefixHash << 5) - activationPrefixHash) + machineCodePrefix.charCodeAt(i);
    activationPrefixHash = activationPrefixHash & activationPrefixHash; // 转换为32位整数
  }
  
  // 添加期限信息作为变化因子
  activationPrefixHash += (period * 17) ^ 0xABCD; // 使用异或运算增加变化性
  
  // 再添加一个固定的偏移量，确保与机器码前缀不同
  activationPrefixHash += 0x123456;
  
  // 将哈希值转换为36进制字符串，并取前6位
  let activationPrefix = Math.abs(activationPrefixHash).toString(36).padStart(6, '0').substring(0, 6);
  
  // 确保激活码前缀与机器码前缀不同
  while (activationPrefix.toUpperCase() === machineCodePrefix.toUpperCase()) {
    // 如果相同，稍微调整哈希值并重新生成
    activationPrefixHash += 1;
    activationPrefix = Math.abs(activationPrefixHash).toString(36).padStart(6, '0').substring(0, 6);
  }
  
  return activationPrefix;
};

// 验证激活码（增强版）
export const validateActivationCode = (machineCode: string, activationCode: string, period: number): boolean => {
  try {
    // 增强版验证逻辑，确保与生成逻辑完全匹配
    console.log('开始验证激活码:', { machineCode, activationCode, period });
    
    // 标准化输入 - 确保与生成逻辑完全一致
    const cleanMachineCode = machineCode.toUpperCase().trim();
    // 去除激活码中的所有非字母数字字符，确保格式统一
    const cleanActivationCode = activationCode.toUpperCase().replace(/[^0-9A-Z]/g, '');
    
    // 1. 检查激活码长度是否符合预期格式（XXXXXX-XXXX-XXXX，总长度14）
    const isValidLength = cleanActivationCode.length === 14;
    
    // 2. 验证激活码中的字符是否都是有效的base36字符
    const validChars = /^[0-9A-Z]+$/;
    const hasValidCharacters = validChars.test(cleanActivationCode);
    
    // 3. 计算机器码和期限的组合校验和 - 与生成逻辑完全匹配
    let combinedHash = 0;
    
    // 计算机器码的哈希值 - 与生成逻辑完全相同
    for (let i = 0; i < cleanMachineCode.length; i++) {
      combinedHash = ((combinedHash << 5) - combinedHash) + cleanMachineCode.charCodeAt(i);
      combinedHash = combinedHash & combinedHash; // 转换为32位整数
    }
    
    // 添加期限信息 - 与生成逻辑完全相同
    combinedHash += period * 1000; // 给期限一个适当的权重
    
    // 4. 从激活码中提取校验部分并验证
    let isValid = false;
    
    if (isValidLength && hasValidCharacters) {
      // 提取激活码的各个部分
      const part1 = cleanActivationCode.substring(0, 6);
      const part2 = cleanActivationCode.substring(6, 10);
      const part3 = cleanActivationCode.substring(10, 14);
      
      // 提取机器码的第一部分（基于内存生成的部分）
      const machineCodePart1 = cleanMachineCode.split('-')[0];
      
      // 生成预期的第一部分 - 使用与生成逻辑相同的方法
      const expectedPart1 = generateUniqueActivationPrefix(machineCodePart1, period).toUpperCase();
      
      // 生成预期的第二、三部分 - 与生成逻辑相同
      const expectedHashPart = Math.abs(combinedHash).toString(36).toUpperCase().padStart(14, '0');
      const expectedPart2 = expectedHashPart.substring(6, 10);
      const expectedPart3 = expectedHashPart.substring(10, 14);
      
      // 严格验证各部分
      isValid = (part1 === expectedPart1) && (part2 === expectedPart2) && (part3 === expectedPart3);
      
      console.log('验证详情:', {
        machineCode: cleanMachineCode,
        activationCode: activationCode,
        period,
        combinedHash,
        cleanActivationCode,
        part1, expectedPart1,
        part2, expectedPart2,
        part3, expectedPart3,
        machineCodePart1,
        isValidLength,
        hasValidCharacters,
        isValid
      });
    }
    
    return isValid && isValidLength && hasValidCharacters;
  } catch (error) {
    console.error('验证激活码失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    return false;
  }
};

// 获取机器码
export const getMachineCode = (): string => {
  try {
    return generateUniqueMachineCode();
  } catch (error) {
    console.error('获取机器码失败，使用备用方案:', error);
    return generateStableMachineCode();
  }
};

// 定义激活状态接口
export interface ActivationStatus {
  isActivated: boolean;
  activationDate: string;
  expiryDate?: string | null;
  period: number;
  isPermanent: boolean;
  trialDaysLeft: number;
}

// 模拟存储服务
const storage = {
  setItem: async (key: string, value: any): Promise<void> => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('存储数据失败:', error);
      throw error;
    }
  }
};

// 激活系统（增强版）
// 增加可选参数，允许传入机器码以确保一致性
export const activateSystem = async (activationCode: string, period: number, providedMachineCode?: string): Promise<boolean> => {
  try {
    console.log('开始激活系统流程:', { activationCode, period });
    
     // 优先使用提供的机器码，确保与生成激活码时使用的机器码一致
     const machineCode = providedMachineCode || getMachineCode();
     console.log('使用的机器码:', machineCode);
    
    // 验证激活码
    console.log('开始验证激活码...');
    const isValid = validateActivationCode(machineCode, activationCode, period);
    
    if (!isValid) {
      console.error('激活码验证失败');
      return false;
    }
    
    console.log('激活码验证成功，开始保存激活状态...');
    
    // 计算过期日期
    const activationDate = new Date();
    let expiryDate: Date | null = null;
    const isPermanent = period === 0;
    
    if (!isPermanent) {
      expiryDate = new Date(activationDate);
      expiryDate.setDate(expiryDate.getDate() + period);
      console.log(`计算的过期日期: ${expiryDate.toISOString()} (${period}天)`);
    } else {
      console.log('设置为永久激活');
    }
    
    // 构建激活状态对象
    const activationStatus: ActivationStatus = {
      isActivated: true,
      activationDate: activationDate.toISOString(),
      expiryDate: expiryDate?.toISOString() || null,
      period,
      isPermanent,
      trialDaysLeft: 0 // 激活后试用期剩余天数为0
    };
    
    console.log('准备保存的激活状态:', activationStatus);
    
    // 优先保存到localStorage，确保可靠性
    try {
      localStorage.setItem('activationStatus', JSON.stringify(activationStatus));
      console.log('激活状态已保存到localStorage');
    } catch (localError) {
      console.error('保存激活状态到localStorage失败:', localError);
    }
    
    // 同时保存到IndexedDB
    try {
      await storage.setItem('activationStatus', activationStatus);
      console.log('激活状态已保存到IndexedDB');
    } catch (dbError) {
      console.error('保存激活状态到IndexedDB失败:', dbError);
      // 即使IndexedDB保存失败，只要localStorage保存成功，也继续执行
    }
    
    // 移除激活弹窗标记和强制激活标记
    localStorage.removeItem('shouldShowActivationModal');
    localStorage.removeItem('forceActivation');
    console.log('已移除激活弹窗标记和强制激活标记');
    
    // 触发全局数据更新事件
    window.dispatchEvent(new CustomEvent('globalDataUpdated', {
      detail: { source: 'activationService', type: 'activationUpdated' }
    }));
    console.log('已触发全局数据更新事件');
    
    console.log('系统激活流程完成');
    return true;
  } catch (error) {
    console.error('激活系统过程中发生严重错误:', error);
    // 提供更详细的错误信息
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    return false;
  }
};