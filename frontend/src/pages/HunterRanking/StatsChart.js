import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
export default function StatsChart({ hunters }) {
    const data = hunters.map((hunter) => ({
        address: hunter.address.slice(0, 8),
        earnings: hunter.totalEarnings / 1000000000,
    }));
    return (_jsxs("div", { className: "panel h-80 p-4", children: [_jsx("p", { className: "eyebrow", children: "Signal Chart" }), _jsx("p", { className: "mt-2 text-sm text-muted", children: "Earnings visible in the current ranking window." }), _jsx(ResponsiveContainer, { width: "100%", height: "82%", children: _jsxs(BarChart, { data: data, children: [_jsx(CartesianGrid, { stroke: "rgba(143, 168, 189, 0.15)", strokeDasharray: "4 4" }), _jsx(XAxis, { dataKey: "address", stroke: "rgba(143, 168, 189, 0.7)", fontSize: 11 }), _jsx(YAxis, { stroke: "rgba(143, 168, 189, 0.7)", fontSize: 11 }), _jsx(Tooltip, { contentStyle: {
                                background: '#0f1a25',
                                border: '1px solid rgba(39, 65, 85, 0.9)',
                                borderRadius: '18px',
                                color: '#e7f3ff',
                            } }), _jsx(Bar, { dataKey: "earnings", fill: "#89d8ff", radius: [8, 8, 2, 2] })] }) })] }));
}
