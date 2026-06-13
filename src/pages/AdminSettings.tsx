import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { 
  cn, 
  getPriceConfig, 
  savePriceConfig, 
  getSystemConfig, 
  saveSystemConfig,
  getPaymentRecords,
  PriceConfig,
  SystemConfig,
  PaymentRecord
} from '@/lib/utils';
import { utils, write, read } from 'xlsx';
import { useNavigate } from 'react-router-dom';

// 激活期限选项
const activationPeriods = [
  { label: '6个月', value: 180 },
  { label: '1年', value: 365 },
  { label: '3年', value: 1095 },
  { label: '永久', value: 0 },
];

export default function AdminSettings() {
  const { theme, toggleTheme } = useTheme();
  const [priceConfig, setPriceConfig] = useState<PriceConfig>({});
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({});
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [currentTab, setCurrentTab] = useState<'settings' | 'records'>('settings');
  const [isSaving, setIsSaving] = useState(false);
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();
  
  // 检查是否已认证并加载初始数据
  useEffect(() => {
    const authState = localStorage.getItem('adminAuthenticated');
    if (authState === 'true') {
      setIsAuthenticated(true);
      loadAllData();
    }
  }, []);
  
  // 加载所有数据
  const loadAllData = async () => {
    try {
      const [priceConfigData, systemConfigData, paymentRecordsData] = await Promise.all([
        getPriceConfig(),
        getSystemConfig(),
        getPaymentRecords()
      ]);
      
      setPriceConfig(priceConfigData);
      setSystemConfig(systemConfigData);
      setPaymentRecords(paymentRecordsData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    }
  };

  // 加载支付记录
  const loadPaymentRecords = async () => {
    try {
      const records = await getPaymentRecords();
      setPaymentRecords(records);
    } catch (error) {
      console.error('加载支付记录失败:', error);
      toast.error('加载支付记录失败');
    }
  };
  
  const handleLogin = async () => {
    try {
      const config = await getSystemConfig();
      if (password === config.adminPassword) {
        setIsAuthenticated(true);
        localStorage.setItem('adminAuthenticated', 'true');
        setLoginError('');
        await loadAllData();
        toast.success('登录成功');
      } else {
        setLoginError('密码错误，请重试');
        toast.error('密码错误，请重试');
      }
    } catch (error) {
      console.error('登录失败:', error);
      setLoginError('登录失败，请稍后重试');
      toast.error('登录失败，请稍后重试');
    }
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuthenticated');
    toast.success('已退出登录');
    navigate('/');
  };
  
  const handlePriceChange = (period: number, field: 'price' | 'alipayLink', value: number | string) => {
    setPriceConfig(prev => ({
      ...prev,
      [period]: {
        ...prev[period],
        [field]: value
      }
    }));
  };
  
  const handleSystemConfigChange = (field: keyof SystemConfig, value: string) => {
    setSystemConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSaveConfig = async () => {
    setIsSaving(true);
    
    try {
      // 并行保存配置
      const [priceResult, systemResult] = await Promise.all([
        savePriceConfig(priceConfig),
        saveSystemConfig(systemConfig)
      ]);
      
      if (priceResult && systemResult) {
        toast.success('配置已成功保存到数据库');
      } else if (priceResult || systemResult) {
        toast.success('配置已保存，但部分数据可能仅保存到本地');
      } else {
        toast.warning('配置仅保存到本地，数据库连接失败');
      }
      
      // 通知其他页面配置已更新
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      toast.error('保存配置失败');
      console.error('保存配置失败:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // 如果未认证，显示登录界面
  if (!isAuthenticated) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center p-4 bg-gradient-to-br', 
        theme === 'dark' ? 'from-slate-900 to-slate-800 text-white' : 'from-blue-50 to-indigo-50 text-slate-900')}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn('w-full max-w-md mx-auto p-8 rounded-2xl shadow-xl',
            theme === 'dark' ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/80 border border-slate-100')}
        >
          <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            管理员登录
          </h2>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium mb-2">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入管理员密码"
              className={cn('w-full px-4 py-3 rounded-lg focus:outline-none',
                theme === 'dark' 
                  ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                  : 'bg-white border border-slate-300 focus:border-blue-500')}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            {loginError && (
              <p className="mt-2 text-sm text-red-500">{loginError}</p>
            )}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            className={cn('w-full py-3 rounded-lg font-medium text-white flex items-center justify-center',
              'bg-blue-600 hover:bg-blue-700')}
          >
            <i className="fa-solid fa-sign-in-alt mr-2"></i>登录
          </motion.button>
          
          <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>此页面仅管理员可访问</p>
          </div>
        </motion.div>
      </div>
    );
  }
  
  // 已认证，显示设置界面
  return (
    <div className={cn('min-h-screen flex flex-col items-center justify-start p-4 bg-gradient-to-br', 
      theme === 'dark' ? 'from-slate-900 to-slate-800 text-white' : 'from-blue-50 to-indigo-50 text-slate-900')}>
      {/* 顶部导航栏 */}
      <div className={cn('fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-4', 
        theme === 'dark' ? 'bg-slate-900/90 backdrop-blur-lg border-b border-slate-700' : 'bg-white/90 backdrop-blur-lg border-b border-slate-200')}>
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/')}
            className={cn('mr-4 p-2 rounded-full', 
              theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200')}
            aria-label="返回首页"
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <h1 className="text-2xl font-bold">授权管理后台</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className={cn('p-2 rounded-full', 
              theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200')}
            aria-label="切换主题"
          >
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          <button 
            onClick={handleLogout}
            className={cn('p-2 rounded-full', 
              theme === 'dark' ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-700')}
            aria-label="退出登录"
          >
            <i className="fa-solid fa-sign-out-alt"></i>
          </button>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="mt-24 w-full max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn('w-full p-6 rounded-2xl shadow-xl',
            theme === 'dark' ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/80 border border-slate-100')}
        >
          {/* 标签切换 */}
          <div className="flex border-b mb-6">
            <button
              onClick={() => setCurrentTab('settings')}
              className={`py-3 px-6 font-medium text-sm transition-colors ${
                currentTab === 'settings'
                  ? (theme === 'dark' 
                      ? 'border-b-2 border-blue-500 text-blue-400' 
                      : 'border-b-2 border-blue-500 text-blue-600')
                  : (theme === 'dark' 
                      ? 'text-slate-400 hover:text-slate-300' 
                      : 'text-slate-500 hover:text-slate-700')
              }`}
            >
              <i className="fa-solid fa-cog mr-2"></i>系统设置
            </button>
            <button
              onClick={() => {
                setCurrentTab('records');
                loadPaymentRecords();
              }}
              className={`py-3 px-6 font-medium text-sm transition-colors ${
                currentTab === 'records'
                  ? (theme === 'dark' 
                      ? 'border-b-2 border-blue-500 text-blue-400' 
                      : 'border-b-2 border-blue-500 text-blue-600')
                  : (theme === 'dark' 
                      ? 'text-slate-400 hover:text-slate-300' 
                      : 'text-slate-500 hover:text-slate-700')
              }`}
            >
              <i className="fa-solid fa-history mr-2"></i>支付记录 ({paymentRecords.length})
            </button>
          </div>

          {/* 设置标签内容 */}
          {currentTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">系统配置</h2>
              
              {/* 基本设置 */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">基本设置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="adminPassword" className="block text-sm font-medium mb-2">管理员密码</label>
                    <input
                      id="adminPassword"
                      type="password"
                      value={systemConfig.adminPassword}
                      onChange={(e) => handleSystemConfigChange('adminPassword', e.target.value)}
                      placeholder="请输入管理员密码"
                      className={cn('w-full px-4 py-2 rounded-lg focus:outline-none',
                        theme === 'dark' 
                          ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                          : 'bg-white border border-slate-300 focus:border-blue-500')}
                    />
                  </div>
                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium mb-2">联系邮箱</label>
                    <input
                      id="contactEmail"
                      type="email"
                      value={systemConfig.contactEmail}
                      onChange={(e) => handleSystemConfigChange('contactEmail', e.target.value)}
                      placeholder="请输入联系邮箱"
                      className={cn('w-full px-4 py-2 rounded-lg focus:outline-none',
                        theme === 'dark' 
                          ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                          : 'bg-white border border-slate-300 focus:border-blue-500')}
                    />
                  </div>
                  <div>
                    <label htmlFor="wechatId" className="block text-sm font-medium mb-2">微信客服ID</label>
                    <input
                      id="wechatId"
                      type="text"
                      value={systemConfig.wechatId}
                      onChange={(e) => handleSystemConfigChange('wechatId', e.target.value)}
                      placeholder="请输入微信客服ID"
                      className={cn('w-full px-4 py-2 rounded-lg focus:outline-none',
                        theme === 'dark' 
                          ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                          : 'bg-white border border-slate-300 focus:border-blue-500')}
                    />
                  </div>
                </div>
                
                 <div className="mt-4">
                   <label htmlFor="wechatQrCodeUrl" className="block text-sm font-medium mb-2">微信二维码图片链接</label>
                   <input
                     id="wechatQrCodeUrl"
                     type="text"
                     value={systemConfig.wechatQrCodeUrl}
                     onChange={(e) => handleSystemConfigChange('wechatQrCodeUrl', e.target.value)}
                     placeholder="请输入微信二维码图片链接"
                     className={cn('w-full px-4 py-2 rounded-lg focus:outline-none',
                       theme === 'dark' 
                         ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                         : 'bg-white border border-slate-300 focus:border-blue-500')}
                   />
                 </div>
                 
                 <div className="mt-4">
                   <label htmlFor="instructions" className="block text-sm font-medium mb-2">说明文字</label>
                   <textarea
                     id="instructions"
                     value={systemConfig.instructions}
                     onChange={(e) => handleSystemConfigChange('instructions', e.target.value)}
                     placeholder="请输入说明文字"
                    rows={3}
                    className={cn('w-full px-4 py-2 rounded-lg focus:outline-none',
                      theme === 'dark' 
                        ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                        : 'bg-white border border-slate-300 focus:border-blue-500')}
                  />
               </div>
              </div>
              
              {/* 支付宝配置 */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">支付宝沙箱环境配置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="appId" className="block text-sm font-medium mb-2">App ID</label>
                    <input
                      id="appId"
                      type="text"
                      value={systemConfig.alipayAppId || ''}
                      onChange={(e) => handleSystemConfigChange('alipayAppId', e.target.value)}
                      placeholder="请输入支付宝沙箱App ID"
                      className={cn('w-full px-4 py-2 rounded-lg focus:outline-none',
                        theme === 'dark' 
                          ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                          : 'bg-white border border-slate-300 focus:border-blue-500')}
                    />
                  </div>
                  <div>
                    <label htmlFor="merchantPrivateKey" className="block text-sm font-medium mb-2">商户私钥</label>
                    <input
                      id="merchantPrivateKey"
                      type="text"
                      value={systemConfig.alipayPrivateKey || ''}
                      onChange={(e) => handleSystemConfigChange('alipayPrivateKey', e.target.value)}
                      placeholder="请输入商户私钥"
                      className={cn('w-full px-4 py-2 rounded-lg focus:outline-none',
                        theme === 'dark' 
                          ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                          : 'bg-white border border-slate-300 focus:border-blue-500')}
                    />
                  </div>
                  <div>
                    <label htmlFor="alipayPublicKey" className="block text-sm font-medium mb-2">支付宝公钥</label>
                    <input
                      id="alipayPublicKey"
                      type="text"
                      value={systemConfig.alipayPublicKey || ''}
                      onChange={(e) => handleSystemConfigChange('alipayPublicKey', e.target.value)}
                      placeholder="请输入支付宝公钥"
                      className={cn('w-full px-4 py-2 rounded-lg focus:outline-none',
                        theme === 'dark' 
                          ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                          : 'bg-white border border-slate-300 focus:border-blue-500')}
                    />
                  </div>
                  <div>
                    <label htmlFor="gatewayUrl" className="block text-sm font-medium mb-2">网关地址</label>
                    <input
                      id="gatewayUrl"
                      type="text"
                      value={systemConfig.alipayGatewayUrl || 'https://openapi.alipaydev.com/gateway.do'}
                      onChange={(e) => handleSystemConfigChange('alipayGatewayUrl', e.target.value)}
                      placeholder="请输入支付宝网关地址"
                      className={cn('w-full px-4 py-2 rounded-lg focus:outline-none',
                        theme === 'dark' 
                          ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                          : 'bg-white border border-slate-300 focus:border-blue-500')}
                    />
                  </div>
                  <div>
                    <label htmlFor="notifyUrl" className="block text-sm font-medium mb-2">异步回调地址</label>
                    <input
                      id="notifyUrl"
                      type="text"
                      value={systemConfig.alipayNotifyUrl || ''}
                      onChange={(e) => handleSystemConfigChange('alipayNotifyUrl', e.target.value)}
                      placeholder="请输入异步回调地址"
                      className={cn('w-full px-4 py-2 rounded-lg focus:outline-none',
                        theme === 'dark' 
                          ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                          : 'bg-white border border-slate-300 focus:border-blue-500')}
                    />
                  </div>
                  <div>
                    <label htmlFor="signType" className="block text-sm font-medium mb-2">签名方式</label>
                    <select
                      id="signType"
                      value={systemConfig.alipaySignType || 'RSA2'}
                      onChange={(e) => handleSystemConfigChange('alipaySignType', e.target.value)}
                      className={cn('w-full px-4 py-2 rounded-lg focus:outline-none',
                        theme === 'dark' 
                          ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                          : 'bg-white border border-slate-300 focus:border-blue-500')}
                    >
                      <option value="RSA2">RSA2</option>
                      <option value="RSA">RSA</option>
                    </select>
                  </div>
                </div>
                
                {/* 价格设置 */}
                <h3 className="text-xl font-semibold mb-4">价格设置</h3>
               <div className="overflow-x-auto">
                  <table className={cn('w-full min-w-[600px]', theme === 'dark' ? 'text-white' : 'text-slate-900')}>
                    <thead>
                      <tr className={cn('border-b', theme === 'dark' ? 'border-slate-700' : 'border-slate-200')}>
                        <th className="py-3 px-4 text-left">使用期限</th>
                        <th className="py-3 px-4 text-left">价格 (元)</th>
                        <th className="py-3 px-4 text-left">支付宝收款码链接</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activationPeriods.map((period) => (
                        <tr key={period.value} className={cn('border-b', theme === 'dark' ? 'border-slate-700' : 'border-slate-200')}>
                          <td className="py-4 px-4 font-medium">{period.label}</td>
                          <td className="py-4 px-4">
                            <input
                              type="number"
                              min="0"
                              value={priceConfig[period.value]?.price || 0}
                              onChange={(e) => handlePriceChange(period.value, 'price', Number(e.target.value))}
                              className={cn('w-24 px-3 py-2 rounded-lg focus:outline-none',
                                theme === 'dark' 
                                  ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                                  : 'bg-white border border-slate-300 focus:border-blue-500')}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <input
                              type="text"
                              value={priceConfig[period.value]?.alipayLink || ''}
                              onChange={(e) => handlePriceChange(period.value, 'alipayLink', e.target.value)}
                              placeholder="输入支付宝收款码链接"
                              className={cn('w-full px-3 py-2 rounded-lg focus:outline-none',
                                theme === 'dark' 
                                  ? 'bg-slate-700 border border-slate-600 focus:border-blue-500' 
                                  : 'bg-white border border-slate-300 focus:border-blue-500')}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
               {/* 保存和导出按钮 */}
               <div className="flex flex-col sm:flex-row gap-4">
                 <motion.button
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={handleSaveConfig}
                   disabled={isSaving}
                   className={cn('flex-1 py-3 rounded-lg font-medium text-white flex items-center justify-center',
                     isSaving
                       ? 'bg-blue-400 cursor-not-allowed'
                       : 'bg-green-600 hover:bg-green-700')}
                 >
                   {isSaving ? (
                     <>
                       <i className="fa-solid fa-spinner fa-spin mr-2"></i>保存中...
                     </>
                   ) : (
                     <>
                       <i className="fa-solid fa-save mr-2"></i>保存配置
                     </>
                   )}
                 </motion.button>
                 
                 <motion.button
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={async () => {
                      try {
                        // 准备导出数据
                       const exportData = {
                         systemConfig,
                         priceConfig
                       };
                       
                       // 创建工作簿
                       const workbook = utils.book_new();
                       
                       // 添加系统配置工作表
                       const systemConfigSheet = utils.json_to_sheet([exportData.systemConfig]);
                       utils.book_append_sheet(workbook, systemConfigSheet, '系统配置');
                       
                       // 添加价格配置工作表
                       const priceConfigArray = Object.entries(exportData.priceConfig).map(([period, config]) => ({
                         period: period === '0' ? '永久' : `${period}天`,
                         ...config
                       }));
                       const priceConfigSheet = utils.json_to_sheet(priceConfigArray);
                       utils.book_append_sheet(workbook, priceConfigSheet, '价格配置');
                       
                       // 生成Excel文件并下载
                       const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
                       const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                       const url = URL.createObjectURL(blob);
                       const link = document.createElement('a');
                       link.href = url;
                       link.download = `系统配置_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`;
                       document.body.appendChild(link);
                       link.click();
                       document.body.removeChild(link);
                       URL.revokeObjectURL(url);
                       
                       toast.success('配置已成功导出为Excel文件');
                     } catch (error) {
                       console.error('导出配置失败:', error);
                       toast.error('导出配置失败，请稍后重试');
                     }
                   }}
                   className={cn('flex-1 py-3 rounded-lg font-medium text-white flex items-center justify-center',
                     'bg-blue-600 hover:bg-blue-700')}
                 >
                   <i className="fa-solid fa-file-export mr-2"></i>导出配置
                 </motion.button>
               </div>
              
              <div className="mt-6 p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 text-sm">
                <p className="flex items-start">
                  <i className="fa-solid fa-info-circle mt-1 mr-2"></i>
                  <span>修改配置后，所有用户将看到更新后的设置。请确保所有链接和信息正确有效。</span>
                </p>
              </div>
            </div>
          )}

            {/* 支付记录标签内容 */}
            {currentTab === 'records' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">支付记录管理</h2>
                
                {/* 导出Excel按钮 */}
                <div className="mb-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      try {
                        // 准备导出数据
                        const exportData = paymentRecords.map(record => ({
                          '机器码': record.machineCode,
                          '激活码': record.activationCode,
                          '使用期限': record.period === 0 ? '永久' : `${Math.floor(record.period / 30)}个月`,
                          '价格(元)': record.price,
                          '支付日期': new Date(record.paymentDate).toLocaleString('zh-CN'),
                          'IP地址': record.ipAddress,
                          '操作环境': record.userAgent
                        }));
                        
                        // 创建工作簿
                        const workbook = utils.book_new();
                        const worksheet = utils.json_to_sheet(exportData);
                        utils.book_append_sheet(workbook, worksheet, '支付记录');
                        
                        // 生成Excel文件并下载
                        const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
                        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `支付记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        
                        toast.success('支付记录已成功导出为Excel文件');
                      } catch (error) {
                        console.error('导出支付记录失败:', error);
                        toast.error('导出支付记录失败，请稍后重试');
                      }
                    }}
                    disabled={paymentRecords.length === 0}
                    className={cn('px-6 py-2 rounded-lg font-medium text-white flex items-center justify-center',
                      paymentRecords.length === 0
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700')}
                  >
                    <i className="fa-solid fa-file-export mr-2"></i>导出Excel文件
                  </motion.button>
                </div>
               
               {paymentRecords.length === 0 ? (
                 <div className="text-center py-12">
                   <i className="fa-solid fa-file-circle-exclamation text-4xl mb-4 text-slate-400"></i>
                   <p className="text-lg text-slate-500 dark:text-slate-400">暂无支付记录</p>
                 </div>
               ) : (
                 <div className="overflow-x-auto">
                   <table className={cn('w-full min-w-[800px]', theme === 'dark' ? 'text-white' : 'text-slate-900')}>
                     <thead>
                       <tr className={cn('border-b', theme === 'dark' ? 'border-slate-700' : 'border-slate-200')}>
                         <th className="py-3 px-4 text-left">序号</th>
                         <th className="py-3 px-4 text-left">机器码</th>
                         <th className="py-3 px-4 text-left">激活码</th>
                         <th className="py-3 px-4 text-left">使用期限</th>
                         <th className="py-3 px-4 text-left">价格 (元)</th>
                         <th className="py-3 px-4 text-left">支付日期</th>
                         <th className="py-3 px-4 text-left">IP地址</th>
                         <th className="py-3 px-4 text-left">操作环境</th>
                       </tr>
                     </thead>
                     <tbody>
                       {paymentRecords.map((record, index) => (
                         <tr key={record.id} className={cn('border-b', theme === 'dark' ? 'border-slate-700' : 'border-slate-200')}>
                           <td className="py-3 px-4">{index + 1}</td>
                           <td className="py-3 px-4 font-mono text-sm">{record.machineCode}</td>
                           <td className="py-3 px-4 font-mono text-sm">{record.activationCode}</td>
                           <td className="py-3 px-4">
                             {record.period === 0 
                               ? '永久' 
                               : `${Math.floor(record.period / 30)}个月`}
                           </td>
                           <td className="py-3 px-4">{record.price}</td>
                           <td className="py-3 px-4">
                             {new Date(record.paymentDate).toLocaleString('zh-CN')}
                           </td>
                           <td className="py-3 px-4 text-sm">{record.ipAddress}</td>
                           <td className="py-3 px-4 text-sm truncate max-w-[150px]" title={record.userAgent}>
                             {record.userAgent}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
             </div>
           )}
        </motion.div>
        
        <div className={cn('mt-8 text-center text-sm', theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
           <p>授权管理后台 © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}