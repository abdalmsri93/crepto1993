import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Balance {
  asset: string;
  total: string;
  usdValue: string;
  priceChangePercent?: string;
}

interface DashboardChartsProps {
  balances: Balance[];
}

export const DashboardCharts = ({ balances }: DashboardChartsProps) => {
  // بيانات توزيع المحفظة
  const pieData = useMemo(() => {
    return balances
      .filter(b => parseFloat(b.usdValue) > 0)
      .map(b => ({
        name: b.asset,
        value: parseFloat(b.usdValue),
        quantity: parseFloat(b.total),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [balances]);

  // بيانات الأداء
  const performanceData = useMemo(() => {
    return balances
      .filter(b => parseFloat(b.usdValue) > 0)
      .map(b => ({
        asset: b.asset,
        change: parseFloat(b.priceChangePercent || "0"),
        value: parseFloat(b.usdValue),
      }))
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 10);
  }, [balances]);

  // الألوان
  const COLORS = [
    "hsl(48 96% 53%)",      // ذهبي
    "hsl(142 76% 36%)",     // أخضر
    "hsl(221 83% 53%)",     // أزرق
    "hsl(280 65% 60%)",     // أرجواني
    "hsl(340 75% 55%)",     // وردي
    "hsl(30 100% 50%)",     // برتقالي
    "hsl(200 100% 50%)",    // سماوي
    "hsl(260 100% 60%)",    // بنفسجي
  ];

  const totalValue = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* رسم بياني توزيع المحفظة */}
      <Card className="glass-card animate-fade-in animate-delay-100 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg font-orbitron">توزيع المحفظة</CardTitle>
          <CardDescription>نسبة كل عملة من إجمالي المحفظة</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => `$${parseFloat(value).toFixed(2)}`}
                contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid hsl(48 96% 53%)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* رسم بياني الأداء */}
      <Card className="glass-card animate-fade-in animate-delay-200 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg font-orbitron">أداء العملات</CardTitle>
          <CardDescription>نسبة التغيير 24 ساعة لأكبر العملات</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 20%)" />
              <XAxis dataKey="asset" />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => `${parseFloat(value).toFixed(2)}%`}
                contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid hsl(48 96% 53%)" }}
              />
              <Bar 
                dataKey="change" 
                fill="hsl(48 96% 53%)"
                radius={[8, 8, 0, 0]}
              >
                {performanceData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.change >= 0 ? "hsl(142 76% 36%)" : "hsl(0 72% 51%)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
