import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, BellOff, Mail, Trash2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertNotifications } from "./AlertNotifications";

interface Alert {
  id: string;
  coin: string; // 'ALL' أو رمز العملة
  type: 'percentage' | 'value' | 'step'; // أضفنا نوع جديد
  threshold: number;
  direction: 'up' | 'down' | 'both';
  enabled: boolean;
  emailEnabled: boolean;
  // القيمة الأصلية وقت إنشاء التنبيه
  initialValues: Record<string, number>; // { SUI: 10.55, HBAR: 8.42, ... }
  createdAt: string;
  // خاص بنوع step
  stepBase?: number; // الحد الأدنى
  stepAmount?: number; // مقدار الزيادة
  lastStepNotified?: number; // آخر قيمة تم عندها التنبيه
}

export interface AlertNotification {
  id: string;
  coin: string;
  changeValue: number;
  changePercent: number;
  initialValue: number;
  currentValue: number;
  timestamp: string;
}

interface PriceAlertsProps {
  coins: string[]; // قائمة العملات المتاحة
  currentValues: Record<string, number>; // القيم الإجمالية الحالية لكل عملة
  onAlert?: (alert: Alert, coin: string, change: number) => void;
  onNotificationsChange?: (notifications: AlertNotification[]) => void;
}

const ALERTS_KEY = 'binance_price_alerts';
const EMAIL_KEY = 'binance_alert_email';
const EMAILJS_PUBLIC_KEY = 'binance_emailjs_public_key';
const EMAILJS_SERVICE_ID = 'binance_emailjs_service_id';
const EMAILJS_TEMPLATE_ID = 'binance_emailjs_template_id';
const NOTIFICATIONS_KEY = 'binance_alert_notifications';

export const PriceAlerts: React.FC<PriceAlertsProps> = ({ coins, currentValues, onAlert, onNotificationsChange }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [email, setEmail] = useState('');
  const [emailjsPublicKey, setEmailjsPublicKey] = useState('');
  const [emailjsServiceId, setEmailjsServiceId] = useState('');
  const [emailjsTemplateId, setEmailjsTemplateId] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { toast } = useToast();

  // تحميل الإعدادات من localStorage
  useEffect(() => {
    const savedAlerts = localStorage.getItem(ALERTS_KEY);
    const savedEmail = localStorage.getItem(EMAIL_KEY);
    const savedPublicKey = localStorage.getItem(EMAILJS_PUBLIC_KEY);
    const savedServiceId = localStorage.getItem(EMAILJS_SERVICE_ID);
    const savedTemplateId = localStorage.getItem(EMAILJS_TEMPLATE_ID);
    const savedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
    
    if (savedAlerts) setAlerts(JSON.parse(savedAlerts));
    if (savedEmail) setEmail(savedEmail);
    if (savedPublicKey) setEmailjsPublicKey(savedPublicKey);
    if (savedServiceId) setEmailjsServiceId(savedServiceId);
    if (savedTemplateId) setEmailjsTemplateId(savedTemplateId);
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));

    // طلب إذن الإشعارات
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      }
    }
  }, []);

  // حفظ التنبيهات
  useEffect(() => {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  }, [alerts]);

  // حفظ الإشعارات المرئية وإرسالها للمكون الأب
  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    onNotificationsChange?.(notifications);
  }, [notifications, onNotificationsChange]);

  // حفظ إعدادات EmailJS
  useEffect(() => {
    localStorage.setItem(EMAIL_KEY, email);
    localStorage.setItem(EMAILJS_PUBLIC_KEY, emailjsPublicKey);
    localStorage.setItem(EMAILJS_SERVICE_ID, emailjsServiceId);
    localStorage.setItem(EMAILJS_TEMPLATE_ID, emailjsTemplateId);
  }, [email, emailjsPublicKey, emailjsServiceId, emailjsTemplateId]);

  // التحقق من التنبيهات عند تغير القيم
  useEffect(() => {
    alerts.forEach(alert => {
      if (!alert.enabled || !alert.initialValues) return;

      const coinsToCheck = alert.coin === 'ALL' ? coins : [alert.coin];
      
      coinsToCheck.forEach(coin => {
        const currentValue = currentValues[coin];
        const initialValue = alert.initialValues[coin];
        
        if (!currentValue || !initialValue) return;

        let change = 0;
        let changePercent = 0;
        let triggered = false;

        // حساب الفرق
        change = currentValue - initialValue;
        changePercent = (change / initialValue) * 100;

        if (alert.type === 'percentage') {
          if (alert.direction === 'up' && changePercent >= alert.threshold) triggered = true;
          if (alert.direction === 'down' && changePercent <= -alert.threshold) triggered = true;
          if (alert.direction === 'both' && Math.abs(changePercent) >= alert.threshold) triggered = true;
        } else if (alert.type === 'value') {
          // نوع القيمة ($)
          if (alert.direction === 'up' && change >= alert.threshold) triggered = true;
          if (alert.direction === 'down' && change <= -alert.threshold) triggered = true;
          if (alert.direction === 'both' && Math.abs(change) >= alert.threshold) triggered = true;
        } else if (alert.type === 'step' && alert.stepBase !== undefined && alert.stepAmount !== undefined) {
          // نوع الخطوة
          const stepChange = currentValue - (alert.lastStepNotified || initialValue);
          if (alert.direction === 'up' && stepChange >= alert.stepAmount) {
            triggered = true;
          } else if (alert.direction === 'down' && stepChange <= -alert.stepAmount) {
            triggered = true;
          }
        }

        if (triggered) {
          triggerAlert(alert, coin, change, changePercent, initialValue, currentValue);
        }
      });
    });
  }, [currentValues, alerts, coins]);

  // طلب إذن الإشعارات
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      if (permission === 'granted') {
        toast({ title: "تم تفعيل الإشعارات ✅" });
      } else {
        toast({ title: "تم رفض الإشعارات", variant: "destructive" });
      }
    }
  };

  // إرسال التنبيه
  const triggerAlert = async (alert: Alert, coin: string, change: number, changePercent: number, initialValue: number, currentValue: number) => {
    const changeValueStr = `${change >= 0 ? '+' : ''}$${change.toFixed(2)}`;
    const changePercentStr = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
    
    const direction = change >= 0 ? 'ارتفعت' : 'انخفضت';
    const message = `🔔 ${coin} ${direction}: $${initialValue.toFixed(2)} → $${currentValue.toFixed(2)} (${changeValueStr} / ${changePercentStr})`;

    // إشعار المتصفح
    if (notificationsEnabled && 'Notification' in window) {
      new Notification('تنبيه قيمة!', {
        body: message,
        icon: '/favicon.ico',
        tag: `price-alert-${coin}-${alert.id}`,
      });
    }

    // إشعار Toast
    toast({
      title: "🔔 تنبيه قيمة!",
      description: message,
    });

    // إضافة إشعار مرئي في أسفل الشاشة (يمنع التكرار لنفس العملة)
    const newNotification: AlertNotification = {
      id: `${Date.now()}-${coin}`,
      coin,
      changeValue: change,
      changePercent,
      initialValue,
      currentValue,
      timestamp: new Date().toISOString(),
    };
    setNotifications(prev => {
      // احذف أي إشعار قديم لنفس العملة
      const filtered = prev.filter(n => n.coin !== coin);
      return [...filtered, newNotification];
    });

    // إرسال إيميل عبر EmailJS
    if (alert.emailEnabled && email && emailjsPublicKey && emailjsServiceId && emailjsTemplateId) {
      await sendEmailAlert(coin, changeValueStr, changePercentStr, direction, initialValue, currentValue);
    }

    // إيقاف التنبيه بعد الإطلاق (لمنع التكرار)
    updateAlert(alert.id, { enabled: false });

    onAlert?.(alert, coin, change);
  };

  // إرسال إيميل عبر EmailJS
  const sendEmailAlert = async (coin: string, changeValue: string, changePercent: string, direction: string, initialValue: number, currentValue: number) => {
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: emailjsServiceId,
          template_id: emailjsTemplateId,
          user_id: emailjsPublicKey,
          template_params: {
            to_email: email,
            coin: coin,
            direction: direction,
            change: `${changeValue} (${changePercent})`,
            initial_value: `$${initialValue.toFixed(2)}`,
            current_value: `$${currentValue.toFixed(2)}`,
            time: new Date().toLocaleString('ar-SA'),
          },
        }),
      });

      if (response.ok) {
        console.log('✅ Email sent successfully');
      } else {
        console.error('Failed to send email:', await response.text());
      }
    } catch (error) {
      console.error('Email error:', error);
    }
  };

  // إخفاء إشعار من القائمة
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // إضافة تنبيه جديد - يحفظ القيم الإجمالية الحالية
  const addAlert = () => {
    const newAlert: Alert = {
      id: Date.now().toString(),
      coin: 'ALL',
      type: 'percentage',
      threshold: 5,
      direction: 'up',
      enabled: true,
      emailEnabled: false,
      initialValues: { ...currentValues }, // حفظ القيم الحالية وقت إنشاء التنبيه
      createdAt: new Date().toISOString(),
    };
    setAlerts([...alerts, newAlert]);
    
    toast({
      title: "✅ تم إضافة التنبيه",
      description: `سيتم مقارنة القيم مع القيم الحالية`,
    });
  };

  // تحديث تنبيه
  const updateAlert = (id: string, updates: Partial<Alert>) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  // حذف تنبيه
  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  // إعادة تعيين القيم الأصلية للتنبيه
  const resetAlertValues = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { 
      ...a, 
      initialValues: { ...currentValues },
      enabled: true,
      createdAt: new Date().toISOString(),
    } : a));
    
    toast({
      title: "🔄 تم تحديث القيم",
      description: "سيتم المقارنة من القيم الحالية",
    });
  };

  return (
    <>
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-crypto-gold" />
            تنبيهات القيمة
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Mail className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={requestNotificationPermission}
              className={notificationsEnabled ? 'bg-green-500/20 text-green-500' : ''}
            >
              {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </Button>
            {/* زر مسح جميع الإشعارات */}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNotifications([]);
                  toast({ title: "تم مسح جميع الإشعارات ✅" });
                }}
                className="text-red-500 hover:bg-red-500/20"
                title="مسح جميع الإشعارات"
              >
                <X className="w-4 h-4" />
                <span className="ml-1 text-xs">{notifications.length}</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* إعدادات الإيميل */}
        {showSettings && (
          <div className="p-4 bg-background/50 rounded-lg border border-primary/20 space-y-3">
            <h4 className="font-semibold text-sm">إعدادات الإيميل (EmailJS)</h4>
            <Input
              placeholder="الإيميل للتنبيهات"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="text-right"
            />
            <Input
              placeholder="Public Key"
              value={emailjsPublicKey}
              onChange={(e) => setEmailjsPublicKey(e.target.value)}
              type="text"
              className="text-right"
            />
            <Input
              placeholder="Service ID"
              value={emailjsServiceId}
              onChange={(e) => setEmailjsServiceId(e.target.value)}
              type="text"
              className="text-right"
            />
            <Input
              placeholder="Template ID"
              value={emailjsTemplateId}
              onChange={(e) => setEmailjsTemplateId(e.target.value)}
              type="text"
              className="text-right"
            />
            <p className="text-xs text-muted-foreground">
              أنشئ حساب مجاني في{' '}
              <a href="https://www.emailjs.com/" target="_blank" className="text-crypto-gold underline">
                emailjs.com
              </a>
            </p>
          </div>
        )}

        {/* قائمة التنبيهات */}
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3 bg-background/30 rounded-lg border border-primary/10 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  {/* اختيار العملة */}
                  <Select
                    value={alert.coin}
                    onValueChange={(v) => updateAlert(alert.id, { coin: v })}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">جميع العملات</SelectItem>
                      {coins.map(coin => (
                        <SelectItem key={coin} value={coin}>{coin}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* نوع التنبيه */}
                  <Select
                    value={alert.type}
                    onValueChange={(v) => updateAlert(alert.id, { type: v as 'percentage' | 'value' | 'step' })}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="value">$</SelectItem>
                      <SelectItem value="step">خطوة</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* الاتجاه */}
                  <Select
                    value={alert.direction}
                    onValueChange={(v) => updateAlert(alert.id, { direction: v as 'up' | 'down' | 'both' })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="up">↑ ارتفاع</SelectItem>
                      <SelectItem value="down">↓ انخفاض</SelectItem>
                      <SelectItem value="both">↕ كلاهما</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* القيمة (threshold) */}
                  {alert.type !== 'step' && (
                    <Input
                      type="number"
                      value={alert.threshold}
                      onChange={(e) => updateAlert(alert.id, { threshold: parseFloat(e.target.value) || 0 })}
                      className="w-20 text-center"
                      min={0}
                      step={alert.type === 'percentage' ? 1 : 0.01}
                    />
                  )}

                  {/* إعدادات الخطوة - تظهر فقط إذا كان النوع هو "خطوة" */}
                  {alert.type === 'step' && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="الحد الأدنى"
                        value={alert.stepBase}
                        onChange={(e) => updateAlert(alert.id, { stepBase: parseFloat(e.target.value) || 0 })}
                        className="w-24 text-center"
                        min={0}
                      />
                      <Input
                        type="number"
                        placeholder="مقدار الزيادة"
                        value={alert.stepAmount}
                        onChange={(e) => updateAlert(alert.id, { stepAmount: parseFloat(e.target.value) || 0 })}
                        className="w-24 text-center"
                        min={0}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* تفعيل الإيميل */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateAlert(alert.id, { emailEnabled: !alert.emailEnabled })}
                    className={alert.emailEnabled ? 'text-crypto-gold' : 'text-muted-foreground'}
                    title="إرسال إيميل"
                  >
                    <Mail className="w-4 h-4" />
                  </Button>

                  {/* إعادة تعيين القيم */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resetAlertValues(alert.id)}
                    className="text-blue-500 hover:text-blue-600"
                    title="إعادة تعيين من القيمة الحالية"
                  >
                    🔄
                  </Button>

                  {/* تفعيل/إيقاف */}
                  <Switch
                    checked={alert.enabled}
                    onCheckedChange={(checked) => updateAlert(alert.id, { enabled: checked })}
                  />

                  {/* حذف */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAlert(alert.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* عرض القيمة الأصلية */}
              {alert.initialValues && alert.coin !== 'ALL' && (
                <div className="text-xs text-muted-foreground flex justify-between px-2">
                  <span>القيمة الأصلية: ${alert.initialValues[alert.coin]?.toFixed(2) || '0.00'}</span>
                  <span>القيمة الحالية: ${currentValues[alert.coin]?.toFixed(2) || '0.00'}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* زر إضافة تنبيه */}
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={addAlert}
        >
          <Plus className="w-4 h-4" />
          إضافة تنبيه جديد
        </Button>

        {alerts.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-4">
            لا توجد تنبيهات. أضف تنبيه جديد لمتابعة أسعار العملات.
          </p>
        )}
      </CardContent>
    </Card>
  </>
  );
};

export default PriceAlerts;
