import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { generateActivationCode, getMachineCode, validateActivationCode } from '@/lib/activationService';
import { cn, getPriceConfig } from '@/lib/utils';

// 激活期限选项
const activationPeriods = [
  { label: '6个月', value: 180 },
  { label: '1年', value: 365 },
  { label: '3年', value: 1095 },
  { label: '永久', value: 0 },
];

import { getSystemConfig, SystemConfig } from '@/lib/utils';

export default function SoftwareLicenseManager() {
  const { theme, toggleTheme } = useTheme();
  const [machineCode, setMachineCode] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(180); // 默认6个月
  const [activationCode, setActivationCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validationMachineCode, setValidationMachineCode] = useState('');
  const [validationActivationCode, setValidationActivationCode] = useState('');
  const [validationPeriod, setValidationPeriod] = useState(180);
  const [priceConfig, setPriceConfig] = useState<Record<number, {price: number, alipayLink: string}>>({});
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({});
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  
  // 尝试从URL参数或剪贴板获取机器码并加载配置
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const machineCodeParam = urlParams.get('machineCode');
    
    if (machineCodeParam) {
      setMachineCode(machineCodeParam);
    } else {
      // 尝试从剪贴板读取机器码
      if (navigator.clipboard) {
        navigator.clipboard.readText().then(text => {
          if (text && text.length > 10) { // 简单检查是否可能是机器码
            setMachineCode(text);
          }
        }).catch(() => {
          console.log('无法从剪贴板读取机器码');
        });
      }
    }
    
    // 加载配置
    loadConfigs();
    
    // 监听localStorage变化，更新价格配置
    const handleStorageChange = () => {
      loadConfigs();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // 加载配置
  const loadConfigs = async () => {
    try {
      const [priceConfigData, systemConfigData] = await Promise.all([
        getPriceConfig(),
        getSystemConfig()
      ]);
      
      setPriceConfig(priceConfigData);
      setSystemConfig(systemConfigData);
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };
  
  const handleGenerateActivationCode = async () => {
    if (!machineCode.trim()) {
      toast.error('请输入机器码');
      return;
    }
    
    // 显示支付步骤
    setShowPaymentStep(true);
    setPaymentConfirmed(false);
    setActivationCode('');
  };
  
  const handleConfirmPayment = () => {
    setPaymentConfirmed(true);
    
    // 模拟支付确认后的激活码生成
    setIsGenerating(true);
    
    try {
      // 清除之前可能存在的生成记录
      localStorage.removeItem('lastActivationCodeGenerated');
      
       // 生成激活码
      const code = generateActivationCode(machineCode.trim(), selectedPeriod);
      console.log('生成激活码详情:', {
        machineCode: machineCode.trim(),
        selectedPeriod,
        activationCode: code,
        generationTime: new Date().toISOString()
      });
      setActivationCode(code);
      toast.success('激活码生成成功');
      
      // 自动复制生成的激活码到剪贴板
      setTimeout(() => {
        navigator.clipboard.writeText(code).then(() => {
          toast.success('激活码已复制到剪贴板');
        }).catch(() => {
          // 忽略复制失败的错误
        });
      }, 500);
      
      // 保存支付记录
      try {
        const ipAddress = '127.0.0.1'; // 实际应用中应获取真实IP
        const price = currentPriceInfo.price;
        
        // 尝试从API获取IP地址（模拟）
        fetch('https://api.ipify.org?format=json')
          .then(response => response.json())
          .then(async data => {
            // 保存支付记录到localStorage
            const record = {
              machineCode: machineCode.trim(),
              activationCode: code,
              period: selectedPeriod,
              price,
              paymentDate: new Date().toISOString(),
              ipAddress: data.ip || '127.0.0.1',
              userAgent: navigator.userAgent
            };
            
                // 保存支付记录到数据库
               try {
                 const savedRecords = localStorage.getItem('paymentRecords') || '[]';
                 const recordsArray = JSON.parse(savedRecords);
                 recordsArray.push(record);
                 localStorage.setItem('paymentRecords', JSON.stringify(recordsArray));
               } catch (error) {
                 console.error('保存支付记录失败:', error);
               }
           })
          .catch(async error => {
            console.error('获取IP地址失败:', error);
            // 即使获取IP失败也保存记录
            const record = {
              machineCode: machineCode.trim(),
              activationCode: code,
              period: selectedPeriod,
              price,
              paymentDate: new Date().toISOString(),
              ipAddress,
              userAgent: navigator.userAgent
            };
            
                // 保存支付记录到数据库
               try {
                 const savedRecords = localStorage.getItem('paymentRecords') || '[]';
                 const recordsArray = JSON.parse(savedRecords);
                 recordsArray.push(record);
                 localStorage.setItem('paymentRecords', JSON.stringify(recordsArray));
               } catch (error) {
                 console.error('保存支付记录失败:', error);
               }
           });
      } catch (error) {
        console.error('保存支付记录失败:', error);
      }
    } catch (error) {
      toast.error('生成激活码失败');
      console.error('生成激活码失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopyActivationCode = () => {
    if (!activationCode) {
      toast.error('没有可复制的激活码');
      return;
    }
    
    navigator.clipboard.writeText(activationCode).then(() => {
      toast.success('激活码已复制到剪贴板');
    }).catch(() => {
      toast.error('复制失败，请手动复制');
    });
  };

  const handleValidateActivationCode = () => {
    if (!validationMachineCode.trim() || !validationActivationCode.trim()) {
      toast.error('请输入机器码和激活码');
      return;
    }
    
    setValidationStatus('validating');
    
    try {
      const isValid = validateActivationCode(validationMachineCode.trim(), validationActivationCode.trim(), validationPeriod);
      
      if (isValid) {
        setValidationStatus('valid');
        toast.success('激活码验证成功');
      } else {
        setValidationStatus('invalid');
        toast.error('激活码验证失败');
      }
    } catch (error) {
      setValidationStatus('invalid');
      toast.error('验证失败');
      console.error('验证激活码失败:', error);
    }
  };

   const handleGetMachineCode = () => {
    const code = getMachineCode();
    setMachineCode(code);
    setValidationMachineCode(code);
    // 默认选择永久期限
    setSelectedPeriod(0);
    // 自动弹出收款码
    setShowPaymentStep(true);
    setPaymentConfirmed(false);
    setActivationCode('');
    toast.success('已获取当前设备的机器码，并选择永久授权');
  };
  
  // 获取当前选择期限的价格和支付宝链接
  const getCurrentPriceInfo = () => {
    return priceConfig[selectedPeriod] || { 
      price: 58, 
    alipayLink: "https://space.coze.cn/api/coze_space/gen_image?image_size=square_hd&prompt=Alipay%20QR%20code%20for%20payment&sign=488a346a5ff375139a299ce4aeb9bc47"
    };
  };
  
  const currentPriceInfo = getCurrentPriceInfo();
  
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden`}>
      {/* 底纹：渐变小方格组成的曲面图案 */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-50" 
          style={{
            backgroundImage: `
              linear-gradient(135deg, rgba(147, 197, 253, 0.2) 25%, transparent 25%),
              linear-gradient(225deg, rgba(147, 197, 253, 0.2) 25%, transparent 25%),
              linear-gradient(45deg, rgba(147, 197, 253, 0.2) 25%, transparent 25%),
              linear-gradient(315deg, rgba(147, 197, 253, 0.2) 25%, rgba(226, 232, 240, 0.5) 25%)
            `,
            backgroundPosition: '10px 0, 10px 0, 0 0, 0 0',
            backgroundSize: '20px 20px',
            backgroundRepeat: 'repeat'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800" />
      </div>

       {/* 顶部导航栏 */}
      <div className={`fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-4 ${
        theme === 'dark' ? 'bg-slate-900/90 backdrop-blur-lg border-b border-slate-700' : 'bg-white/90 backdrop-blur-lg border-b border-slate-200'
      }`}>
        <h1 className="text-2xl font-bold">软件授权管理中心</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.location.href = '/admin'}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              theme === 'dark' 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <i className="fa-solid fa-cog mr-1"></i>管理后台
          </button>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full ${
              theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
            }`}
            aria-label="切换主题">
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="mt-20 w-full max-w-6xl relative z-10">
        {/* 激活码生成和说明区域 */}
        <div className="w-full flex flex-col lg:flex-row gap-8 mb-8">
          {/* 激活码生成工具 - 宽度加倍 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`w-full lg:w-2/3 p-8 rounded-2xl shadow-xl ${
              theme === 'dark' ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/80 border border-slate-100'
            }`}
          >
             <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              获取激活码
            </h2>
            
            {/* 机器码输入 */}
            <div className="mb-6">
              <label htmlFor="machineCode" className="block text-sm font-medium mb-2">机器码</label>
              <div className="flex">
                <input
                  id="machineCode"
                  type="text"
                  value={machineCode}
                  onChange={(e) => setMachineCode(e.target.value)}
                  placeholder="请输入机器码"
                  className={`flex-1 px-4 py-3 rounded-l-lg focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                      : 'bg-white border border-slate-300 focus:border-blue-500'
                  }`}
                />
                <button
                  onClick={handleGetMachineCode}
                  className={`px-4 py-3 rounded-r-lg font-medium flex items-center justify-center ${
                    theme === 'dark' 
                      ? 'bg-slate-700 hover:bg-slate-600 border border-l-0 border-slate-600' 
                      : 'bg-slate-100 hover:bg-slate-200 border border-l-0 border-slate-300'
                  }`}
                >
                  <i className="fa-solid fa-microchip mr-2"></i>获取
                </button>
              </div>
            </div>
            
            {/* 期限选择 */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">选择使用期限</label>
              <div className="grid grid-cols-2 gap-2">
                {activationPeriods.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => {
                      setSelectedPeriod(period.value);
                      // 重置支付确认状态，隐藏已生成的激活码
                      setPaymentConfirmed(false);
                    }}
                    className={`px-4 py-3 rounded-lg text-center font-medium ${
                      selectedPeriod === period.value
                        ? (theme === 'dark' 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white': 'bg-blue-500 hover:bg-blue-600 text-white')
                        : (theme === 'dark' 
                            ? 'bg-slate-700 hover:bg-slate-600' 
                            : 'bg-white hover:bg-slate-100 border border-slate-300')
                    }`}
                  >
                    {period.label} - ¥{priceConfig[period.value]?.price || 58}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 生成按钮 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateActivationCode}
              disabled={isGenerating || !machineCode.trim()}
              className={`w-full py-3 rounded-lg font-medium text-white flex items-center justify-center ${
                (isGenerating || !machineCode.trim())
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isGenerating ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>生成中...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-key mr-2"></i>生成激活码
                </>
              )}
            </motion.button>
            
            {/* 支付步骤 */}
            {showPaymentStep && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="mt-6 p-6 rounded-xl border-2 border-dashed"
                style={{ 
                  borderColor: theme === 'dark' ? '#475569' : '#cbd5e1' 
                }}
              >
                <h3 className="text-xl font-semibold mb-4 text-center">请完成支付</h3>
                
                <div className="flex flex-col items-center justify-center mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">¥{currentPriceInfo.price}</div>
                  <div className="text-sm text-center">
                    激活码：{activationPeriods.find(p => p.value === selectedPeriod)?.label}
                  </div>
                </div>
                
                {/* 支付宝收款码 */}
                <div className="flex justify-center mb-6">
                  <div className="w-48 h-48 bg-white p-2 rounded-lg shadow-md flex items-center justify-center">
                    <img 
                      src={currentPriceInfo.alipayLink} 
                      alt="支付宝收款码" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                
                <div className="text-sm text-center mb-6">
                  <p>请使用支付宝扫描上方二维码完成支付</p>
                  <p className="mt-2">支付完成后点击下方按钮获取激活码</p>
                </div>
                
                {/* 确认支付按钮 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmPayment}
                  disabled={isGenerating}
                  className={`w-full py-3 rounded-lg font-medium text-white flex items-center justify-center ${
                    isGenerating
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>处理中...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check-circle mr-2"></i>我已完成支付，获取激活码
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
            
            {/* 生成的激活码显示 */}
            {paymentConfirmed && activationCode && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="mt-6 p-4 rounded-lg flex flex-col"
              >
                <div className={`flex items-center justify-between mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  <span className="text-sm font-medium">生成的激活码</span>
                  <span className="text-xs">{activationPeriods.find(p => p.value === selectedPeriod)?.label}</span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-lg font-mono text-lg ${
                  theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'
                }`}>
                  <span>{activationCode}</span>
                  <button
                    onClick={handleCopyActivationCode}
                    className={`p-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-slate-600 hover:bg-slate-500' 
                        : 'bg-white hover:bg-slate-100 border border-slate-200'
                    }`}
                    aria-label="复制激活码"
                  >
                    <i className="fa-solid fa-copy"></i>
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

           {/* 右侧：激活说明 */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`w-full lg:w-1/3 p-8 rounded-2xl shadow-xl flex-shrink-0 ${
              theme === 'dark' ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/80 border border-slate-100'
            }`}
          >
            <h3 className="text-2xl font-bold mb-6 text-center">激活说明</h3>
            <div className={`space-y-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              <div className="flex items-start p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <i className="fa-solid fa-microchip"></i>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium mb-1">机器码说明</h4>
                  <p className="text-sm">机器码是基于您设备的硬件信息生成的唯一标识符，确保激活码与您的设备绑定。</p>
                </div>
              </div>
              
              <div className="flex items-start p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <i className="fa-solid fa-credit-card"></i>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium mb-1">支付流程</h4>
                  <p className="text-sm">选择合适的使用期限后，通过支付宝完成支付，支付成功后系统将自动生成激活码。</p>
                </div>
              </div>
              
              <div className="flex items-start p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <i className="fa-solid fa-shield-alt"></i>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium mb-1">安全保障</h4>
                  <p className="text-sm">激活码与您的设备机器码绑定，确保授权的唯一性和安全性，防止未授权使用。</p>
                </div>
              </div>
              
               <div className="flex items-start p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <i className="fa-solid fa-clock"></i>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium mb-1">有效期管理</h4>
                  <p className="text-sm">您可以选择不同的有效期选项，包括6个月、1年、3年或永久授权，灵活满足您的需求。</p>
                </div>
              </div>
              
                <div className="flex items-start p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                 <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                   <i className="fa-solid fa-headset"></i>
                 </div>
                 <div className="ml-4">
                   <h4 className="text-lg font-medium mb-1">客户支持</h4>
                   <p className="text-sm">{systemConfig.instructions || '我们提供7×24小时客户支持，如有任何问题，请随时联系我们。'}</p>
                 </div>
               </div>
              
              <div className="mt-8 p-5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center justify-center mb-3">
                  <i className="fa-solid fa-envelope text-blue-600 dark:text-blue-400 text-xl"></i>
                </div>
                <p className="text-sm text-center mb-2">如有问题，请联系我们</p>
                <div className="grid grid-cols-1 gap-2">
                  <a 
                    href={`mailto:${systemConfig.contactEmail}`} 
                    className="text-blue-600 hover:underline dark:text-blue-400 flex items-center justify-center text-sm font-medium p-2 rounded-lg bg-white/50 dark:bg-blue-800/30"
                  >
                    <i className="fa-solid fa-at mr-1"></i> {systemConfig.contactEmail}
                  </a>
                   <div className="text-green-600 dark:text-green-400 flex flex-col items-center justify-center text-sm font-medium p-2 rounded-lg bg-white/50 dark:bg-green-800/30">
                     <i className="fa-brands fa-weixin mr-1"></i> 微信：{systemConfig.wechatId}
                     <div className="w-24 h-24 mt-2">
                       <img 
                         src={systemConfig.wechatQrCodeUrl} 
                         alt="微信二维码" 
                         className="w-full h-full object-contain"
                       />
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 验证激活码部分 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`w-full max-w-4xl mx-auto p-8 rounded-2xl shadow-xl ${
            theme === 'dark' ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/80 border border-slate-100'
          }`}
        >
          <h2 className="text-2xl font-bold mb-6 text-center">激活码验证</h2>
          
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="validationMachineCode" className="block text-sm font-medium mb-2">机器码</label>
                <input
                  id="validationMachineCode"
                  type="text"
                  value={validationMachineCode}
                  onChange={(e) => setValidationMachineCode(e.target.value)}
                  placeholder="请输入机器码"
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                      : 'bg-white border border-slate-300 focus:border-blue-500'
                  }`}
                />
              </div>
              
              <div>
                <label htmlFor="validationActivationCode" className="block text-sm font-medium mb-2">激活码</label>
                <input
                  id="validationActivationCode"
                  type="text"
                  value={validationActivationCode}
                  onChange={(e) => setValidationActivationCode(e.target.value)}
                  placeholder="请输入激活码"
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                      : 'bg-white border border-slate-300 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>
          
          <div className="mb-6 flex items-center">
            <label className="block text-sm font-medium mb-2 mr-4">使用期限</label>
            <select
              value={validationPeriod}
              onChange={(e) => setValidationPeriod(Number(e.target.value))}
              className={`w-40 px-4 py-2 rounded-lg focus:outline-none ${
                theme === 'dark' 
                  ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                  : 'bg-white border border-slate-300 focus:border-blue-500'
              }`}
            >
              {activationPeriods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleValidateActivationCode}
              disabled={validationStatus === 'validating'}
              className={`ml-auto px-6 py-2 rounded-lg font-medium text-white flex items-center justify-center ${
                validationStatus === 'validating'
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {validationStatus === 'validating' ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>验证中...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check-circle mr-2"></i>验证激活码
                </>
              )}
            </motion.button>
          </div>
          
          {/* 验证结果显示 */}
          {validationStatus !== 'idle' && (
            <div className={`mt-4 p-3 rounded-lg flex items-center justify-center text-sm font-medium ${
              validationStatus === 'valid' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                : validationStatus === 'invalid'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {validationStatus === 'valid' && (
                <>
                  <i className="fa-solid fa-check-circle mr-2"></i>激活码验证成功
                </>
              )}
              {validationStatus === 'invalid' && (
                <>
                  <i className="fa-solid fa-times-circle mr-2"></i>激活码验证失败
                </>
              )}
              {validationStatus === 'validating' && (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>正在验证...
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* 底部说明 */}
      <div className={`mt-auto py-8 text-center text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} relative z-10`}>
         <p>软件授权管理中心 © {new Date().getFullYear()}</p>
       </div>
    </div>
  );
}