module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/config/colors.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "partyColors",
    ()=>partyColors,
    "partyNames",
    ()=>partyNames,
    "partyOrder",
    ()=>partyOrder
]);
const partyColors = {
    "AD": "#FF8C00",
    "PS": "#E57373",
    "CH": "#377EB8",
    "IL": "#A6CEE3",
    "BE": "#000000",
    "CDU": "#E41A1C",
    "L": "#90EE90",
    "PAN": "#4CAF50",
    "OTH": "#A65628" // Brown
};
const partyOrder = [
    "AD",
    "PS",
    "CH",
    "IL",
    "BE",
    "CDU",
    "L",
    "PAN",
    "OTH"
];
const partyNames = {
    "AD": "Aliança Democrática",
    "PS": "Partido Socialista",
    "CH": "Chega",
    "IL": "Iniciativa Liberal",
    "BE": "Bloco de Esquerda",
    "CDU": "CDU",
    "L": "Livre",
    "PAN": "PAN",
    "OTH": "Others"
};
}),
"[project]/src/components/charts/PollingChart.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PollingChart",
    ()=>PollingChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$plot$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/plot.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$axis$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/axis.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$line$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/line.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$dot$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/dot.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/text.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/config/colors.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
function PollingChart({ data, height = 300 }) {
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!data || data.length === 0) return;
        // Filter for vote share data only
        const voteShareData = data.filter((d)=>d.metric === 'vote_share_mean');
        const plot = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$plot$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["plot"]({
            height,
            marginLeft: 60,
            marginRight: 80,
            marginTop: 20,
            marginBottom: 40,
            style: {
                backgroundColor: "transparent",
                fontSize: "12px",
                fontFamily: "Inter, system-ui, sans-serif"
            },
            x: {
                type: "time",
                label: null,
                tickFormat: "%b %Y",
                grid: true,
                ticks: 4
            },
            y: {
                label: "Vote share (%)",
                domain: [
                    0,
                    0.5
                ],
                tickFormat: (d)=>`${(d * 100).toFixed(0)}%`,
                grid: true
            },
            color: {
                type: "categorical",
                domain: Object.keys(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["partyColors"]),
                range: Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["partyColors"])
            },
            marks: [
                // Background grid
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$axis$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["gridY"]({
                    stroke: "#f3f4f6",
                    strokeWidth: 1
                }),
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$axis$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["gridX"]({
                    stroke: "#f3f4f6",
                    strokeWidth: 1
                }),
                // Lines for each party
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$line$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["line"](voteShareData, {
                    x: (d)=>new Date(d.date),
                    y: "value",
                    stroke: "party",
                    strokeWidth: 2.5,
                    curve: "catmull-rom"
                }),
                // Points for latest values
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$dot$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["dot"](voteShareData.filter((d)=>{
                    const maxDate = new Date(Math.max(...voteShareData.map((dd)=>new Date(dd.date).getTime())));
                    return new Date(d.date).getTime() === maxDate.getTime();
                }), {
                    x: (d)=>new Date(d.date),
                    y: "value",
                    fill: "party",
                    r: 4,
                    stroke: "white",
                    strokeWidth: 2
                }),
                // Party labels at the end
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["text"](voteShareData.filter((d)=>{
                    const maxDate = new Date(Math.max(...voteShareData.map((dd)=>new Date(dd.date).getTime())));
                    return new Date(d.date).getTime() === maxDate.getTime();
                }), {
                    x: (d)=>new Date(d.date),
                    y: "value",
                    text: (d)=>`${d.party} ${(d.value * 100).toFixed(1)}%`,
                    fill: "party",
                    dx: 10,
                    fontSize: 11,
                    fontWeight: "500"
                })
            ]
        });
        if (containerRef.current) {
            containerRef.current.replaceChildren(plot);
        }
        return ()=>plot.remove();
    }, [
        data,
        height
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: containerRef
        }, void 0, false, {
            fileName: "[project]/src/components/charts/PollingChart.tsx",
            lineNumber: 109,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/charts/PollingChart.tsx",
        lineNumber: 108,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/lib/config/blocs.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "leftBlocParties",
    ()=>leftBlocParties,
    "leftPlusScenarioParties",
    ()=>leftPlusScenarioParties,
    "majorityThreshold",
    ()=>majorityThreshold,
    "rightBlocParties",
    ()=>rightBlocParties,
    "rightPlusParties",
    ()=>rightPlusParties
]);
const leftBlocParties = [
    "PS",
    "BE",
    "CDU",
    "L"
];
const rightBlocParties = [
    "AD",
    "IL"
];
const majorityThreshold = 116;
const rightPlusParties = [
    "AD",
    "IL"
];
const leftPlusScenarioParties = [
    "PS",
    "L",
    "PAN",
    "BE",
    "CDU"
];
}),
"[project]/src/components/charts/SimpleCoalitionDots.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SimpleCoalitionDots",
    ()=>SimpleCoalitionDots
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$plot$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/plot.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$rule$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/rule.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$dot$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/dot.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/text.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/config/blocs.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
function SimpleCoalitionDots({ data, width = 600, height = 300 }) {
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!data || data.length === 0) return;
        // Calculate coalition seats for each simulation
        const scatterData = data.slice(0, 1000).flatMap((simulation, i)=>{
            const leftSeats = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["leftBlocParties"].reduce((sum, party)=>sum + (simulation[party] || 0), 0);
            const rightSeats = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rightBlocParties"].reduce((sum, party)=>sum + (simulation[party] || 0), 0);
            return [
                {
                    x: leftSeats,
                    y: 0.2 + i % 50 * 0.01,
                    coalition: "Left",
                    seats: leftSeats
                },
                {
                    x: rightSeats,
                    y: 0.8 + i % 50 * 0.01,
                    coalition: "Right",
                    seats: rightSeats
                }
            ];
        });
        console.log('SimpleCoalitionDots: Created', scatterData.length, 'points');
        console.log('Sample:', scatterData.slice(0, 4));
        const plot = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$plot$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["plot"]({
            width,
            height,
            marginLeft: 80,
            marginRight: 40,
            style: {
                backgroundColor: "transparent",
                fontSize: "12px",
                fontFamily: "Inter, system-ui, sans-serif"
            },
            x: {
                label: "Coalition seats",
                domain: [
                    40,
                    180
                ],
                grid: true
            },
            y: {
                label: null,
                domain: [
                    0,
                    1
                ],
                axis: null
            },
            color: {
                domain: [
                    "Left",
                    "Right"
                ],
                range: [
                    "#10b981",
                    "#f59e0b"
                ]
            },
            marks: [
                // Majority line
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$rule$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ruleX"]([
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["majorityThreshold"]
                ], {
                    stroke: "#dc2626",
                    strokeWidth: 2,
                    strokeDasharray: "4,2"
                }),
                // Simple dots
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$dot$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["dot"](scatterData, {
                    x: "x",
                    y: "y",
                    fill: "coalition",
                    fillOpacity: 0.6,
                    r: 2
                }),
                // Coalition labels
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["text"]([
                    {
                        x: 60,
                        y: 0.2,
                        text: "Left coalition"
                    },
                    {
                        x: 60,
                        y: 0.8,
                        text: "Right coalition"
                    }
                ], {
                    x: "x",
                    y: "y",
                    text: "text",
                    fontSize: 12,
                    fontWeight: "bold",
                    fill: "#374151"
                })
            ]
        });
        if (containerRef.current) {
            containerRef.current.replaceChildren(plot);
        }
        return ()=>plot.remove();
    }, [
        data,
        width,
        height
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: containerRef
        }, void 0, false, {
            fileName: "[project]/src/components/charts/SimpleCoalitionDots.tsx",
            lineNumber: 103,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/charts/SimpleCoalitionDots.tsx",
        lineNumber: 102,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__b39137ce._.js.map