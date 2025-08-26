(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/config/colors.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/PollingChart.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PollingChart",
    ()=>PollingChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$plot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/plot.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$axis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/axis.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$line$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/line.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$dot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/dot.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/text.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/config/colors.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function PollingChart(param) {
    let { data, height = 300 } = param;
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PollingChart.useEffect": ()=>{
            if (!data || data.length === 0) return;
            // Filter for vote share data only
            const voteShareData = data.filter({
                "PollingChart.useEffect.voteShareData": (d)=>d.metric === 'vote_share_mean'
            }["PollingChart.useEffect.voteShareData"]);
            const plot = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$plot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["plot"]({
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
                    tickFormat: {
                        "PollingChart.useEffect.plot": (d)=>"".concat((d * 100).toFixed(0), "%")
                    }["PollingChart.useEffect.plot"],
                    grid: true
                },
                color: {
                    type: "categorical",
                    domain: Object.keys(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["partyColors"]),
                    range: Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["partyColors"])
                },
                marks: [
                    // Background grid
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$axis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["gridY"]({
                        stroke: "#f3f4f6",
                        strokeWidth: 1
                    }),
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$axis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["gridX"]({
                        stroke: "#f3f4f6",
                        strokeWidth: 1
                    }),
                    // Lines for each party
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$line$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["line"](voteShareData, {
                        x: {
                            "PollingChart.useEffect.plot": (d)=>new Date(d.date)
                        }["PollingChart.useEffect.plot"],
                        y: "value",
                        stroke: "party",
                        strokeWidth: 2.5,
                        curve: "catmull-rom"
                    }),
                    // Points for latest values
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$dot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dot"](voteShareData.filter({
                        "PollingChart.useEffect.plot": (d)=>{
                            const maxDate = new Date(Math.max(...voteShareData.map({
                                "PollingChart.useEffect.plot": (dd)=>new Date(dd.date).getTime()
                            }["PollingChart.useEffect.plot"])));
                            return new Date(d.date).getTime() === maxDate.getTime();
                        }
                    }["PollingChart.useEffect.plot"]), {
                        x: {
                            "PollingChart.useEffect.plot": (d)=>new Date(d.date)
                        }["PollingChart.useEffect.plot"],
                        y: "value",
                        fill: "party",
                        r: 4,
                        stroke: "white",
                        strokeWidth: 2
                    }),
                    // Party labels at the end
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["text"](voteShareData.filter({
                        "PollingChart.useEffect.plot": (d)=>{
                            const maxDate = new Date(Math.max(...voteShareData.map({
                                "PollingChart.useEffect.plot": (dd)=>new Date(dd.date).getTime()
                            }["PollingChart.useEffect.plot"])));
                            return new Date(d.date).getTime() === maxDate.getTime();
                        }
                    }["PollingChart.useEffect.plot"]), {
                        x: {
                            "PollingChart.useEffect.plot": (d)=>new Date(d.date)
                        }["PollingChart.useEffect.plot"],
                        y: "value",
                        text: {
                            "PollingChart.useEffect.plot": (d)=>"".concat(d.party, " ").concat((d.value * 100).toFixed(1), "%")
                        }["PollingChart.useEffect.plot"],
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
            return ({
                "PollingChart.useEffect": ()=>plot.remove()
            })["PollingChart.useEffect"];
        }
    }["PollingChart.useEffect"], [
        data,
        height
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
_s(PollingChart, "8puyVO4ts1RhCfXUmci3vLI3Njw=");
_c = PollingChart;
var _c;
__turbopack_context__.k.register(_c, "PollingChart");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/SeatChart.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SeatChart",
    ()=>SeatChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$plot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/plot.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$axis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/axis.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$bar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/bar.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$dot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/dot.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/text.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/config/colors.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function SeatChart(param) {
    let { data, height = 300 } = param;
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SeatChart.useEffect": ()=>{
            if (!data || data.length === 0) return;
            // Calculate seat statistics for each party
            const seatStats = data.reduce({
                "SeatChart.useEffect.seatStats": (acc, d)=>{
                    if (!acc[d.party]) {
                        acc[d.party] = [];
                    }
                    acc[d.party].push(d.seats);
                    return acc;
                }
            }["SeatChart.useEffect.seatStats"], {});
            const chartData = Object.entries(seatStats).map({
                "SeatChart.useEffect.chartData": (param)=>{
                    let [party, seats] = param;
                    const sorted = seats.sort({
                        "SeatChart.useEffect.chartData.sorted": (a, b)=>a - b
                    }["SeatChart.useEffect.chartData.sorted"]);
                    return {
                        party,
                        mean: Math.round(sorted.reduce({
                            "SeatChart.useEffect.chartData": (sum, s)=>sum + s
                        }["SeatChart.useEffect.chartData"], 0) / sorted.length),
                        p10: sorted[Math.floor(sorted.length * 0.1)],
                        p25: sorted[Math.floor(sorted.length * 0.25)],
                        p75: sorted[Math.floor(sorted.length * 0.75)],
                        p90: sorted[Math.floor(sorted.length * 0.9)],
                        min: Math.min(...sorted),
                        max: Math.max(...sorted)
                    };
                }
            }["SeatChart.useEffect.chartData"]).sort({
                "SeatChart.useEffect.chartData": (a, b)=>b.mean - a.mean
            }["SeatChart.useEffect.chartData"]);
            const plot = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$plot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["plot"]({
                height,
                marginLeft: 80,
                marginRight: 20,
                marginTop: 20,
                marginBottom: 40,
                style: {
                    backgroundColor: "transparent",
                    fontSize: "12px",
                    fontFamily: "Inter, system-ui, sans-serif"
                },
                x: {
                    label: "Projected seats",
                    grid: true,
                    domain: [
                        0,
                        Math.max(...chartData.map({
                            "SeatChart.useEffect.plot": (d)=>d.max
                        }["SeatChart.useEffect.plot"])) + 10
                    ]
                },
                y: {
                    label: null,
                    domain: chartData.map({
                        "SeatChart.useEffect.plot": (d)=>d.party
                    }["SeatChart.useEffect.plot"]),
                    tickFormat: {
                        "SeatChart.useEffect.plot": (d)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["partyNames"][d] || d
                    }["SeatChart.useEffect.plot"]
                },
                color: {
                    type: "categorical",
                    domain: Object.keys(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["partyColors"]),
                    range: Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["partyColors"])
                },
                marks: [
                    // Background grid
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$axis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["gridX"]({
                        stroke: "#f3f4f6",
                        strokeWidth: 1
                    }),
                    // Uncertainty bands (80% confidence)
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$bar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["barX"](chartData, {
                        x1: "p10",
                        x2: "p90",
                        y: "party",
                        fill: "party",
                        fillOpacity: 0.2,
                        height: 20
                    }),
                    // Interquartile range (50% confidence)
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$bar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["barX"](chartData, {
                        x1: "p25",
                        x2: "p75",
                        y: "party",
                        fill: "party",
                        fillOpacity: 0.4,
                        height: 20
                    }),
                    // Mean projection
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$dot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dot"](chartData, {
                        x: "mean",
                        y: "party",
                        fill: "party",
                        r: 4,
                        stroke: "white",
                        strokeWidth: 2
                    }),
                    // Mean labels
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["text"](chartData, {
                        x: "mean",
                        y: "party",
                        text: "mean",
                        dx: 15,
                        fontSize: 11,
                        fontWeight: "600",
                        fill: "#374151"
                    })
                ]
            });
            if (containerRef.current) {
                containerRef.current.replaceChildren(plot);
            }
            return ({
                "SeatChart.useEffect": ()=>plot.remove()
            })["SeatChart.useEffect"];
        }
    }["SeatChart.useEffect"], [
        data,
        height
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: containerRef
        }, void 0, false, {
            fileName: "[project]/src/components/charts/SeatChart.tsx",
            lineNumber: 128,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/charts/SeatChart.tsx",
        lineNumber: 127,
        columnNumber: 5
    }, this);
}
_s(SeatChart, "8puyVO4ts1RhCfXUmci3vLI3Njw=");
_c = SeatChart;
var _c;
__turbopack_context__.k.register(_c, "SeatChart");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/DistrictSummary.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DistrictSummary",
    ()=>DistrictSummary
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/config/colors.ts [app-client] (ecmascript)");
"use client";
;
;
function DistrictSummary(param) {
    let { districtData, contestedData } = param;
    if (!districtData || districtData.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-center py-8 text-gray-500",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "District analysis loading..."
            }, void 0, false, {
                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                lineNumber: 26,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/charts/DistrictSummary.tsx",
            lineNumber: 25,
            columnNumber: 7
        }, this);
    }
    // Sort districts by competitiveness (ENSC score)
    const sortedDistricts = districtData.map((district)=>{
        var _contestedData_districts;
        const contestedInfo = contestedData === null || contestedData === void 0 ? void 0 : (_contestedData_districts = contestedData.districts) === null || _contestedData_districts === void 0 ? void 0 : _contestedData_districts[district.district_name];
        const competitiveness = (contestedInfo === null || contestedInfo === void 0 ? void 0 : contestedInfo.ENSC) || 0;
        // Get top 2 parties by probability
        const parties = Object.entries(district.probs).sort((param, param1)=>{
            let [, a] = param, [, b] = param1;
            return b - a;
        }).slice(0, 2);
        return {
            ...district,
            competitiveness,
            topParties: parties,
            isContested: competitiveness > 1.2
        };
    }).sort((a, b)=>b.competitiveness - a.competitiveness);
    const contestedDistricts = sortedDistricts.filter((d)=>d.isContested);
    const safeDistricts = sortedDistricts.filter((d)=>!d.isContested);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            contestedDistricts.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-lg font-semibold text-gray-900 mb-4",
                        children: [
                            "Contested Districts (",
                            contestedDistricts.length,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                        lineNumber: 59,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
                        children: contestedDistricts.slice(0, 9).map((district)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between mb-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                className: "font-medium text-gray-900",
                                                children: district.district_name
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                                lineNumber: 66,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded",
                                                children: "Contested"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                                lineNumber: 67,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                        lineNumber: 65,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-2",
                                        children: district.topParties.map((param)=>{
                                            let [party, prob] = param;
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-between",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "w-3 h-3 rounded",
                                                                style: {
                                                                    backgroundColor: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["partyColors"][party]
                                                                }
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                                                lineNumber: 75,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-sm font-medium",
                                                                children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["partyNames"][party] || party
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                                                lineNumber: 79,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                                        lineNumber: 74,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-sm font-bold",
                                                        children: [
                                                            (prob * 100).toFixed(1),
                                                            "%"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                                        lineNumber: 83,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, party, true, {
                                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                                lineNumber: 73,
                                                columnNumber: 21
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                        lineNumber: 71,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, district.district_name, true, {
                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                lineNumber: 64,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                        lineNumber: 62,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                lineNumber: 58,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-lg font-semibold text-gray-900 mb-4",
                        children: "Likely Winners by District"
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                        lineNumber: 97,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white border border-gray-200 rounded-lg p-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
                            children: Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["partyColors"]).map((color, index)=>{
                                const party = Object.keys(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["partyColors"])[index];
                                const wins = safeDistricts.filter((d)=>d.winning_party === party).length;
                                if (wins === 0) return null;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center text-white font-bold shadow-md",
                                            style: {
                                                backgroundColor: color
                                            },
                                            children: wins
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                            lineNumber: 110,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm font-medium text-gray-900",
                                            children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["partyNames"][party] || party
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                            lineNumber: 116,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-xs text-gray-500",
                                            children: "districts"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                            lineNumber: 119,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, party, true, {
                                    fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                    lineNumber: 109,
                                    columnNumber: 17
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                            lineNumber: 101,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                        lineNumber: 100,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                lineNumber: 96,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-gray-50 border border-gray-200 rounded-lg p-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-3 gap-4 text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-2xl font-bold text-gray-900",
                                    children: districtData.length
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                    lineNumber: 131,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-sm text-gray-600",
                                    children: "Total districts"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                    lineNumber: 132,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                            lineNumber: 130,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-2xl font-bold text-yellow-600",
                                    children: contestedDistricts.length
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                    lineNumber: 135,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-sm text-gray-600",
                                    children: "Contested"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                    lineNumber: 136,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                            lineNumber: 134,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-2xl font-bold text-green-600",
                                    children: safeDistricts.length
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                    lineNumber: 139,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-sm text-gray-600",
                                    children: "Likely decided"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                    lineNumber: 140,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                            lineNumber: 138,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                    lineNumber: 129,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                lineNumber: 128,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
_c = DistrictSummary;
var _c;
__turbopack_context__.k.register(_c, "DistrictSummary");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/HouseEffects.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HouseEffects",
    ()=>HouseEffects
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$plot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/plot.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$axis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/axis.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$rule$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/rule.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$bar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/bar.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/text.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/config/colors.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function HouseEffects(param) {
    let { data, height = 300 } = param;
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HouseEffects.useEffect": ()=>{
            if (!data || data.length === 0) return;
            // Filter for pollsters with at least 3 polls and meaningful effects
            const filteredData = data.filter({
                "HouseEffects.useEffect.filteredData": (d)=>d.n_polls >= 3 && Math.abs(d.effect) > 0.005
            }["HouseEffects.useEffect.filteredData"]);
            const plot = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$plot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["plot"]({
                height,
                marginLeft: 120,
                marginRight: 80,
                marginTop: 20,
                marginBottom: 40,
                style: {
                    backgroundColor: "transparent",
                    fontSize: "11px",
                    fontFamily: "Inter, system-ui, sans-serif"
                },
                x: {
                    label: "House effect (percentage points)",
                    grid: true,
                    tickFormat: {
                        "HouseEffects.useEffect.plot": (d)=>"".concat((d * 100).toFixed(1), "%")
                    }["HouseEffects.useEffect.plot"],
                    domain: [
                        -0.08,
                        0.08
                    ]
                },
                y: {
                    label: null,
                    domain: [
                        ...new Set(filteredData.map({
                            "HouseEffects.useEffect.plot": (d)=>d.pollster
                        }["HouseEffects.useEffect.plot"]))
                    ].sort()
                },
                color: {
                    type: "categorical",
                    domain: Object.keys(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["partyColors"]),
                    range: Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["partyColors"])
                },
                marks: [
                    // Background grid
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$axis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["gridX"]({
                        stroke: "#f3f4f6",
                        strokeWidth: 1
                    }),
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$rule$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ruleX"]([
                        0
                    ], {
                        stroke: "#6b7280",
                        strokeWidth: 2
                    }),
                    // House effect bars
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$bar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["barX"](filteredData, {
                        x: "effect",
                        y: "pollster",
                        fill: "party",
                        fillOpacity: 0.8,
                        height: 15,
                        rx: 2
                    }),
                    // Value labels for significant effects
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["text"](filteredData.filter({
                        "HouseEffects.useEffect.plot": (d)=>Math.abs(d.effect) > 0.02
                    }["HouseEffects.useEffect.plot"]), {
                        x: "effect",
                        y: "pollster",
                        text: {
                            "HouseEffects.useEffect.plot": (d)=>"".concat((d.effect * 100).toFixed(1), "%")
                        }["HouseEffects.useEffect.plot"],
                        dx: {
                            "HouseEffects.useEffect.plot": (d)=>d.effect > 0 ? 5 : -5
                        }["HouseEffects.useEffect.plot"],
                        textAnchor: {
                            "HouseEffects.useEffect.plot": (d)=>d.effect > 0 ? "start" : "end"
                        }["HouseEffects.useEffect.plot"],
                        fontSize: 10,
                        fontWeight: "500",
                        fill: "#374151"
                    })
                ]
            });
            if (containerRef.current) {
                containerRef.current.replaceChildren(plot);
            }
            return ({
                "HouseEffects.useEffect": ()=>plot.remove()
            })["HouseEffects.useEffect"];
        }
    }["HouseEffects.useEffect"], [
        data,
        height
    ]);
    if (!data || data.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-center py-8 text-gray-500",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "House effects analysis loading..."
            }, void 0, false, {
                fileName: "[project]/src/components/charts/HouseEffects.tsx",
                lineNumber: 95,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/charts/HouseEffects.tsx",
            lineNumber: 94,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: containerRef
            }, void 0, false, {
                fileName: "[project]/src/components/charts/HouseEffects.tsx",
                lineNumber: 102,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-2 text-xs text-gray-500",
                children: "Positive values indicate the pollster tends to show higher support for that party than the average. Only pollsters with 3+ polls and meaningful effects (>0.5pt) are shown."
            }, void 0, false, {
                fileName: "[project]/src/components/charts/HouseEffects.tsx",
                lineNumber: 103,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/charts/HouseEffects.tsx",
        lineNumber: 101,
        columnNumber: 5
    }, this);
}
_s(HouseEffects, "8puyVO4ts1RhCfXUmci3vLI3Njw=");
_c = HouseEffects;
var _c;
__turbopack_context__.k.register(_c, "HouseEffects");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_99921924._.js.map