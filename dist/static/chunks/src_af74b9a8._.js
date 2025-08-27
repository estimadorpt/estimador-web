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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$transforms$2f$dodge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/transforms/dodge.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/config/colors.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function PollingChart(param) {
    let { data } = param;
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PollingChart.useEffect": ()=>{
            if (!data || data.length === 0 || !containerRef.current) return;
            // Get actual container width for truly responsive sizing
            const containerWidth = containerRef.current.offsetWidth || 900;
            const containerHeight = 450; // Good height for the space
            // Filter for vote share data only
            const voteShareData = data.filter({
                "PollingChart.useEffect.voteShareData": (d)=>d.metric === 'vote_share_mean'
            }["PollingChart.useEffect.voteShareData"]);
            // Filter to recent time period - show all parties
            const cutoffDate = new Date();
            cutoffDate.setFullYear(cutoffDate.getFullYear() - 2); // Last 2 years only
            const filteredData = voteShareData.filter({
                "PollingChart.useEffect.filteredData": (d)=>new Date(d.date) >= cutoffDate
            }["PollingChart.useEffect.filteredData"]);
            // Get latest values for all parties
            const latestData = filteredData.filter({
                "PollingChart.useEffect.latestData": (d)=>{
                    const maxDate = new Date(Math.max(...filteredData.map({
                        "PollingChart.useEffect.latestData": (dd)=>new Date(dd.date).getTime()
                    }["PollingChart.useEffect.latestData"])));
                    return new Date(d.date).getTime() === maxDate.getTime();
                }
            }["PollingChart.useEffect.latestData"]).sort({
                "PollingChart.useEffect.latestData": (a, b)=>b.value - a.value
            }["PollingChart.useEffect.latestData"]);
            const plot = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$plot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["plot"]({
                width: containerWidth,
                height: containerHeight,
                marginLeft: 60,
                marginRight: 120,
                marginTop: 20,
                marginBottom: 50,
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
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$line$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["line"](filteredData, {
                        x: {
                            "PollingChart.useEffect.plot": (d)=>new Date(d.date)
                        }["PollingChart.useEffect.plot"],
                        y: "value",
                        stroke: "party",
                        strokeWidth: 2.5,
                        curve: "catmull-rom"
                    }),
                    // Points for latest values
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$dot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dot"](latestData, {
                        x: {
                            "PollingChart.useEffect.plot": (d)=>new Date(d.date)
                        }["PollingChart.useEffect.plot"],
                        y: "value",
                        fill: "party",
                        r: 4,
                        stroke: "white",
                        strokeWidth: 2
                    }),
                    // Major parties - label at line end
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["text"](latestData.filter({
                        "PollingChart.useEffect.plot": (d)=>d.value > 0.1
                    }["PollingChart.useEffect.plot"]), {
                        x: {
                            "PollingChart.useEffect.plot": (d)=>new Date(d.date)
                        }["PollingChart.useEffect.plot"],
                        y: "value",
                        text: {
                            "PollingChart.useEffect.plot": (d)=>"".concat(d.party, " ").concat((d.value * 100).toFixed(1), "%")
                        }["PollingChart.useEffect.plot"],
                        fill: "party",
                        dx: 8,
                        fontSize: 11,
                        fontWeight: "600",
                        textAnchor: "start"
                    }),
                    // Minor parties - sorted bottom to top to match visual order
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["text"](latestData.filter({
                        "PollingChart.useEffect.plot": (d)=>d.value <= 0.1
                    }["PollingChart.useEffect.plot"]).sort({
                        "PollingChart.useEffect.plot": (a, b)=>a.value - b.value
                    }["PollingChart.useEffect.plot"]), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$transforms$2f$dodge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dodgeY"]({
                        x: {
                            "PollingChart.useEffect.plot": (d)=>new Date(d.date)
                        }["PollingChart.useEffect.plot"],
                        y: "value",
                        text: {
                            "PollingChart.useEffect.plot": (d)=>"".concat(d.party, " ").concat((d.value * 100).toFixed(1), "%")
                        }["PollingChart.useEffect.plot"],
                        fill: "party",
                        dx: 8,
                        dy: -3,
                        fontSize: 10,
                        fontWeight: "500",
                        textAnchor: "start",
                        padding: 4 // Increase spacing between dodged labels
                    }))
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
        data
    ]);
    // Add resize observer for responsive behavior
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PollingChart.useEffect": ()=>{
            if (!containerRef.current) return;
            const resizeObserver = new ResizeObserver({
                "PollingChart.useEffect": ()=>{
                    // Re-render chart when container size changes
                    if (containerRef.current && data && data.length > 0) {
                        // Small delay to ensure container has final dimensions
                        setTimeout({
                            "PollingChart.useEffect": ()=>{
                                if (!containerRef.current) return;
                                const containerWidth = containerRef.current.offsetWidth || 900;
                                const containerHeight = 450;
                                // Filter for vote share data only
                                const voteShareData = data.filter({
                                    "PollingChart.useEffect.voteShareData": (d)=>d.metric === 'vote_share_mean'
                                }["PollingChart.useEffect.voteShareData"]);
                                // Filter to recent time period - show all parties
                                const cutoffDate = new Date();
                                cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);
                                const filteredData = voteShareData.filter({
                                    "PollingChart.useEffect.filteredData": (d)=>new Date(d.date) >= cutoffDate
                                }["PollingChart.useEffect.filteredData"]);
                                // Get latest values for all parties
                                const latestData = filteredData.filter({
                                    "PollingChart.useEffect.latestData": (d)=>{
                                        const maxDate = new Date(Math.max(...filteredData.map({
                                            "PollingChart.useEffect.latestData": (dd)=>new Date(dd.date).getTime()
                                        }["PollingChart.useEffect.latestData"])));
                                        return new Date(d.date).getTime() === maxDate.getTime();
                                    }
                                }["PollingChart.useEffect.latestData"]).sort({
                                    "PollingChart.useEffect.latestData": (a, b)=>b.value - a.value
                                }["PollingChart.useEffect.latestData"]);
                                const plot = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$plot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["plot"]({
                                    width: containerWidth,
                                    height: containerHeight,
                                    marginLeft: 60,
                                    marginRight: 120,
                                    marginTop: 20,
                                    marginBottom: 50,
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
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$axis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["gridY"]({
                                            stroke: "#f3f4f6",
                                            strokeWidth: 1
                                        }),
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$axis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["gridX"]({
                                            stroke: "#f3f4f6",
                                            strokeWidth: 1
                                        }),
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$line$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["line"](filteredData, {
                                            x: {
                                                "PollingChart.useEffect.plot": (d)=>new Date(d.date)
                                            }["PollingChart.useEffect.plot"],
                                            y: "value",
                                            stroke: "party",
                                            strokeWidth: 2.5,
                                            curve: "catmull-rom"
                                        }),
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$dot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dot"](latestData, {
                                            x: {
                                                "PollingChart.useEffect.plot": (d)=>new Date(d.date)
                                            }["PollingChart.useEffect.plot"],
                                            y: "value",
                                            fill: "party",
                                            r: 4,
                                            stroke: "white",
                                            strokeWidth: 2
                                        }),
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["text"](latestData.filter({
                                            "PollingChart.useEffect.plot": (d)=>d.value > 0.1
                                        }["PollingChart.useEffect.plot"]), {
                                            x: {
                                                "PollingChart.useEffect.plot": (d)=>new Date(d.date)
                                            }["PollingChart.useEffect.plot"],
                                            y: "value",
                                            text: {
                                                "PollingChart.useEffect.plot": (d)=>"".concat(d.party, " ").concat((d.value * 100).toFixed(1), "%")
                                            }["PollingChart.useEffect.plot"],
                                            fill: "party",
                                            dx: 8,
                                            fontSize: 11,
                                            fontWeight: "600",
                                            textAnchor: "start"
                                        }),
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["text"](latestData.filter({
                                            "PollingChart.useEffect.plot": (d)=>d.value <= 0.1
                                        }["PollingChart.useEffect.plot"]).sort({
                                            "PollingChart.useEffect.plot": (a, b)=>a.value - b.value
                                        }["PollingChart.useEffect.plot"]), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$transforms$2f$dodge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dodgeY"]({
                                            x: {
                                                "PollingChart.useEffect.plot": (d)=>new Date(d.date)
                                            }["PollingChart.useEffect.plot"],
                                            y: "value",
                                            text: {
                                                "PollingChart.useEffect.plot": (d)=>"".concat(d.party, " ").concat((d.value * 100).toFixed(1), "%")
                                            }["PollingChart.useEffect.plot"],
                                            fill: "party",
                                            dx: 8,
                                            dy: -3,
                                            fontSize: 10,
                                            fontWeight: "500",
                                            textAnchor: "start",
                                            padding: 4
                                        }))
                                    ]
                                });
                                containerRef.current.replaceChildren(plot);
                            }
                        }["PollingChart.useEffect"], 100);
                    }
                }
            }["PollingChart.useEffect"]);
            resizeObserver.observe(containerRef.current);
            return ({
                "PollingChart.useEffect": ()=>resizeObserver.disconnect()
            })["PollingChart.useEffect"];
        }
    }["PollingChart.useEffect"], [
        data
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: containerRef,
            className: "overflow-x-auto"
        }, void 0, false, {
            fileName: "[project]/src/components/charts/PollingChart.tsx",
            lineNumber: 254,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/charts/PollingChart.tsx",
        lineNumber: 253,
        columnNumber: 5
    }, this);
}
_s(PollingChart, "iENxip3MlGo86izbk9A2xd09AZE=");
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
    let { data } = param;
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SeatChart.useEffect": ()=>{
            if (!data || data.length === 0 || !containerRef.current) return;
            // Get actual container width for responsive sizing
            const containerWidth = containerRef.current.offsetWidth || 1000;
            const containerHeight = 400;
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
                width: containerWidth,
                height: containerHeight,
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
        data
    ]);
    // Add resize observer for responsive behavior
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SeatChart.useEffect": ()=>{
            if (!containerRef.current) return;
            const resizeObserver = new ResizeObserver({
                "SeatChart.useEffect": ()=>{
                    // Re-render chart when container size changes
                    if (containerRef.current && data && data.length > 0) {
                        // Small delay to ensure container has final dimensions
                        setTimeout({
                            "SeatChart.useEffect": ()=>{
                                if (!containerRef.current) return;
                                const containerWidth = containerRef.current.offsetWidth || 1000;
                                const containerHeight = 400;
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
                                    width: containerWidth,
                                    height: containerHeight,
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
                                containerRef.current.replaceChildren(plot);
                            }
                        }["SeatChart.useEffect"], 100);
                    }
                }
            }["SeatChart.useEffect"]);
            resizeObserver.observe(containerRef.current);
            return ({
                "SeatChart.useEffect": ()=>resizeObserver.disconnect()
            })["SeatChart.useEffect"];
        }
    }["SeatChart.useEffect"], [
        data
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: containerRef,
            className: "overflow-x-auto"
        }, void 0, false, {
            fileName: "[project]/src/components/charts/SeatChart.tsx",
            lineNumber: 253,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/charts/SeatChart.tsx",
        lineNumber: 252,
        columnNumber: 5
    }, this);
}
_s(SeatChart, "iENxip3MlGo86izbk9A2xd09AZE=");
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
                lineNumber: 28,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/charts/DistrictSummary.tsx",
            lineNumber: 27,
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
            isContested: competitiveness > 0.8
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
                            "Seats in Play (",
                            contestedDistricts.length,
                            " districts)"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                        lineNumber: 61,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-600 mb-4",
                        children: "Districts where seat allocation is uncertain - small changes in vote share could flip seats between parties."
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                        lineNumber: 64,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
                        children: contestedDistricts.slice(0, 9).map((district)=>{
                            var _contestedData_districts;
                            const contestedInfo = contestedData === null || contestedData === void 0 ? void 0 : (_contestedData_districts = contestedData.districts) === null || _contestedData_districts === void 0 ? void 0 : _contestedData_districts[district.district_name];
                            const seatChanges = (contestedInfo === null || contestedInfo === void 0 ? void 0 : contestedInfo.parties) || {};
                            // Find parties with meaningful seat change probabilities
                            const partiesWithChanges = Object.entries(seatChanges).map((param)=>{
                                let [party, probs] = param;
                                const gainProb = (probs["1"] || 0) + (probs["2"] || 0);
                                const loseProb = (probs["-1"] || 0) + (probs["-2"] || 0);
                                return {
                                    party,
                                    gainProb,
                                    loseProb,
                                    hasChange: gainProb > 0.05 || loseProb > 0.05
                                };
                            }).filter((p)=>p.hasChange).sort((a, b)=>b.gainProb + b.loseProb - (a.gainProb + a.loseProb)).slice(0, 3);
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between mb-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                className: "font-medium text-gray-900",
                                                children: district.district_name
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                                lineNumber: 91,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded",
                                                children: [
                                                    "ENSC: ",
                                                    district.competitiveness.toFixed(2)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                                lineNumber: 92,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                        lineNumber: 90,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-2",
                                        children: partiesWithChanges.length > 0 ? partiesWithChanges.map((param)=>{
                                            let { party, gainProb, loseProb } = param;
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-1",
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
                                                                lineNumber: 100,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-sm font-medium",
                                                                children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["partyNames"][party] || party
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                                                lineNumber: 104,
                                                                columnNumber: 27
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                                        lineNumber: 99,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "ml-5 text-xs text-gray-600",
                                                        children: [
                                                            gainProb > 0.05 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-green-700",
                                                                children: [
                                                                    "+1 seat: ",
                                                                    (gainProb * 100).toFixed(0),
                                                                    "%"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                                                lineNumber: 110,
                                                                columnNumber: 29
                                                            }, this),
                                                            gainProb > 0.05 && loseProb > 0.05 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "mx-1",
                                                                children: "•"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                                                lineNumber: 112,
                                                                columnNumber: 66
                                                            }, this),
                                                            loseProb > 0.05 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-red-700",
                                                                children: [
                                                                    "-1 seat: ",
                                                                    (loseProb * 100).toFixed(0),
                                                                    "%"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                                                lineNumber: 114,
                                                                columnNumber: 29
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                                        lineNumber: 108,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, party, true, {
                                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                                lineNumber: 98,
                                                columnNumber: 23
                                            }, this);
                                        }) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-xs text-gray-500",
                                            children: "Close race for seat allocation"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                            lineNumber: 119,
                                            columnNumber: 23
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                        lineNumber: 96,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, district.district_name, true, {
                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                lineNumber: 89,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                        lineNumber: 67,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                lineNumber: 60,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-lg font-semibold text-gray-900 mb-4",
                        children: "Likely Winners by District"
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                        lineNumber: 131,
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
                                            lineNumber: 144,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm font-medium text-gray-900",
                                            children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["partyNames"][party] || party
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                            lineNumber: 150,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-xs text-gray-500",
                                            children: "districts"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                            lineNumber: 153,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, party, true, {
                                    fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                    lineNumber: 143,
                                    columnNumber: 17
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                            lineNumber: 135,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                        lineNumber: 134,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                lineNumber: 130,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-gray-50 border border-gray-200 rounded-lg p-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-3 gap-4 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-2xl font-bold text-gray-900",
                                        children: districtData.length
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                        lineNumber: 165,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm text-gray-600",
                                        children: "Total districts"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                        lineNumber: 166,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                lineNumber: 164,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-2xl font-bold text-yellow-600",
                                        children: contestedDistricts.length
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                        lineNumber: 169,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm text-gray-600",
                                        children: "Seats in play"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                        lineNumber: 170,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                lineNumber: 168,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-2xl font-bold text-green-600",
                                        children: safeDistricts.length
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                        lineNumber: 173,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm text-gray-600",
                                        children: "Stable allocation"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                        lineNumber: 174,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                lineNumber: 172,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                        lineNumber: 163,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4 pt-4 border-t border-gray-200",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-gray-500",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "ENSC (Effective Number of Seat Changes)"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                                    lineNumber: 180,
                                    columnNumber: 13
                                }, this),
                                ' measures seat allocation uncertainty. Districts with ENSC > 0.8 are classified as having "seats in play" where small vote share changes could flip seats between parties under the D\'Hondt proportional system.'
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                            lineNumber: 179,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/charts/DistrictSummary.tsx",
                lineNumber: 162,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/charts/DistrictSummary.tsx",
        lineNumber: 57,
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/config/colors.ts [app-client] (ecmascript)");
"use client";
;
;
// Color interpolation for the heatmap
function getHeatmapColor(value) {
    // Normalize value to [-1, 1] for color mapping
    const normalized = Math.max(-1, Math.min(1, value / 0.4));
    if (Math.abs(normalized) < 0.05) return "#f8f9fa";
    if (normalized > 0) {
        // Softer red tones for positive values
        const intensity = Math.abs(normalized);
        const r = Math.round(254 + (220 - 254) * intensity);
        const g = Math.round(226 + (38 - 226) * intensity);
        const b = Math.round(226 + (38 - 226) * intensity);
        return "rgb(".concat(r, ", ").concat(g, ", ").concat(b, ")");
    } else {
        // Softer blue tones for negative values
        const intensity = Math.abs(normalized);
        const r = Math.round(219 + (69 - 219) * intensity);
        const g = Math.round(234 + (123 - 234) * intensity);
        const b = Math.round(254 + (157 - 254) * intensity);
        return "rgb(".concat(r, ", ").concat(g, ", ").concat(b, ")");
    }
}
function HouseEffects(param) {
    let { data } = param;
    if (!data || data.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-center py-8 text-gray-500",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "House effects analysis loading..."
            }, void 0, false, {
                fileName: "[project]/src/components/charts/HouseEffects.tsx",
                lineNumber: 44,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/charts/HouseEffects.tsx",
            lineNumber: 43,
            columnNumber: 7
        }, this);
    }
    // Transform data format if needed
    const transformedData = data.map((d)=>({
            pollster: d.pollster,
            party: d.party,
            effect: d.house_effect || d.effect || 0,
            n_polls: d.n_polls || 5
        }));
    // Get unique pollsters and parties
    const pollsters = Array.from(new Set(transformedData.map((d)=>d.pollster))).sort();
    const parties = Object.keys(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["partyColors"]).filter((party)=>transformedData.some((d)=>d.party === party));
    // Create a matrix for easy lookup
    const matrix = {};
    transformedData.forEach((d)=>{
        if (!matrix[d.pollster]) matrix[d.pollster] = {};
        matrix[d.pollster][d.party] = d.effect;
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white border border-gray-200 rounded-lg overflow-hidden",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "overflow-x-auto",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                        className: "min-w-full",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                className: "bg-gray-50",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "px-4 py-3 text-left text-sm font-semibold text-gray-700 w-40",
                                            children: "Pollster"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/charts/HouseEffects.tsx",
                                            lineNumber: 77,
                                            columnNumber: 17
                                        }, this),
                                        parties.map((party)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "px-3 py-3 text-center text-sm font-semibold w-20",
                                                style: {
                                                    color: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$colors$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["partyColors"][party]
                                                },
                                                children: party
                                            }, party, false, {
                                                fileName: "[project]/src/components/charts/HouseEffects.tsx",
                                                lineNumber: 81,
                                                columnNumber: 19
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/charts/HouseEffects.tsx",
                                    lineNumber: 76,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/HouseEffects.tsx",
                                lineNumber: 75,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                className: "divide-y divide-gray-200",
                                children: pollsters.map((pollster)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50",
                                                children: pollster
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/charts/HouseEffects.tsx",
                                                lineNumber: 94,
                                                columnNumber: 19
                                            }, this),
                                            parties.map((party)=>{
                                                var _matrix_pollster;
                                                const effect = ((_matrix_pollster = matrix[pollster]) === null || _matrix_pollster === void 0 ? void 0 : _matrix_pollster[party]) || 0;
                                                const showValue = Math.abs(effect) > 0.02;
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-3 py-3 text-center text-xs font-semibold relative group cursor-help",
                                                    style: {
                                                        backgroundColor: getHeatmapColor(effect),
                                                        color: Math.abs(effect) > 0.25 ? "white" : "#374151"
                                                    },
                                                    title: "".concat(pollster, " → ").concat(party, ": ").concat(effect.toFixed(3), " logit"),
                                                    children: [
                                                        showValue && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: [
                                                                effect > 0 ? '+' : '',
                                                                effect.toFixed(2)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/charts/HouseEffects.tsx",
                                                            lineNumber: 112,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10",
                                                            children: [
                                                                pollster,
                                                                " → ",
                                                                party,
                                                                ": ",
                                                                effect.toFixed(3),
                                                                " logit"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/charts/HouseEffects.tsx",
                                                            lineNumber: 118,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, "".concat(pollster, "-").concat(party), true, {
                                                    fileName: "[project]/src/components/charts/HouseEffects.tsx",
                                                    lineNumber: 102,
                                                    columnNumber: 23
                                                }, this);
                                            })
                                        ]
                                    }, pollster, true, {
                                        fileName: "[project]/src/components/charts/HouseEffects.tsx",
                                        lineNumber: 93,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/HouseEffects.tsx",
                                lineNumber: 91,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/charts/HouseEffects.tsx",
                        lineNumber: 74,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/charts/HouseEffects.tsx",
                    lineNumber: 73,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/charts/HouseEffects.tsx",
                lineNumber: 72,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 text-sm text-gray-600 space-y-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: "House effects"
                            }, void 0, false, {
                                fileName: "[project]/src/components/charts/HouseEffects.tsx",
                                lineNumber: 133,
                                columnNumber: 11
                            }, this),
                            " show how each pollster systematically differs from the polling average in logit space. Red cells indicate the pollster tends to show higher support for that party, blue cells show lower support."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/charts/HouseEffects.tsx",
                        lineNumber: 132,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs",
                        children: "Values are logit deviations. Larger absolute values indicate stronger systematic bias. Hover over cells for exact values."
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts/HouseEffects.tsx",
                        lineNumber: 136,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/charts/HouseEffects.tsx",
                lineNumber: 131,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/charts/HouseEffects.tsx",
        lineNumber: 71,
        columnNumber: 5
    }, this);
}
_c = HouseEffects;
var _c;
__turbopack_context__.k.register(_c, "HouseEffects");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/config/blocs.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts/CoalitionDotPlot.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CoalitionDotPlot",
    ()=>CoalitionDotPlot
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$plot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/plot.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$rule$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/rule.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$dot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/dot.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$transforms$2f$dodge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/transforms/dodge.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@observablehq/plot/src/marks/text.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2f$src$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/d3/src/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$array$2f$src$2f$group$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/d3-array/src/group.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$array$2f$src$2f$median$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__median$3e$__ = __turbopack_context__.i("[project]/node_modules/d3-array/src/median.js [app-client] (ecmascript) <export default as median>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$array$2f$src$2f$shuffle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__shuffle$3e$__ = __turbopack_context__.i("[project]/node_modules/d3-array/src/shuffle.js [app-client] (ecmascript) <export default as shuffle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/config/blocs.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function CoalitionDotPlot(param) {
    let { data } = param;
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CoalitionDotPlot.useEffect": ()=>{
            if (!data || data.length === 0 || !containerRef.current) {
                console.log("CoalitionDotPlot: No data available");
                return;
            }
            // Get actual container width for responsive sizing
            const containerWidth = containerRef.current.offsetWidth || 1000;
            const containerHeight = 350;
            console.log("CoalitionDotPlot: Processing ".concat(data.length, " data points, container width: ").concat(containerWidth));
            console.log('First 3 data points:', data.slice(0, 3));
            // Calculate coalition seats for each simulation
            const blocDrawData = data.flatMap({
                "CoalitionDotPlot.useEffect.blocDrawData": (simulation, index)=>{
                    const leftSeats = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["leftBlocParties"].reduce({
                        "CoalitionDotPlot.useEffect.blocDrawData.leftSeats": (sum, party)=>sum + (simulation[party] || 0)
                    }["CoalitionDotPlot.useEffect.blocDrawData.leftSeats"], 0);
                    const rightSeats = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rightBlocParties"].reduce({
                        "CoalitionDotPlot.useEffect.blocDrawData.rightSeats": (sum, party)=>sum + (simulation[party] || 0)
                    }["CoalitionDotPlot.useEffect.blocDrawData.rightSeats"], 0);
                    return [
                        {
                            draw: index,
                            bloc: "Left coalition",
                            totalSeats: leftSeats
                        },
                        {
                            draw: index,
                            bloc: "Right coalition",
                            totalSeats: rightSeats
                        }
                    ];
                }
            }["CoalitionDotPlot.useEffect.blocDrawData"]);
            // Calculate medians
            const blocMedians = Array.from(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$array$2f$src$2f$group$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rollup"](blocDrawData, {
                "CoalitionDotPlot.useEffect.blocMedians": (v)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$array$2f$src$2f$median$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__median$3e$__["median"](v, {
                        "CoalitionDotPlot.useEffect.blocMedians": (d)=>d.totalSeats
                    }["CoalitionDotPlot.useEffect.blocMedians"])
            }["CoalitionDotPlot.useEffect.blocMedians"], {
                "CoalitionDotPlot.useEffect.blocMedians": (d)=>d.bloc
            }["CoalitionDotPlot.useEffect.blocMedians"]), {
                "CoalitionDotPlot.useEffect.blocMedians": (param)=>{
                    let [bloc, medianSeats] = param;
                    return {
                        bloc,
                        medianSeats
                    };
                }
            }["CoalitionDotPlot.useEffect.blocMedians"]);
            // Sample data for performance - increase for better density
            const sampleSize = Math.min(1600, blocDrawData.length);
            const sampledData = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$array$2f$src$2f$shuffle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__shuffle$3e$__["shuffle"](blocDrawData.slice()).slice(0, sampleSize);
            console.log("CoalitionDotPlot: ".concat(blocDrawData.length, " coalition data points, sampling ").concat(sampledData.length));
            console.log('Sample of blocDrawData:', blocDrawData.slice(0, 5));
            console.log('Sample of sampledData:', sampledData.slice(0, 5));
            console.log('Bloc medians:', blocMedians);
            const plot = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$plot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["plot"]({
                width: containerWidth,
                height: containerHeight,
                marginLeft: 140,
                marginRight: 60,
                marginTop: 30,
                marginBottom: 50,
                style: {
                    backgroundColor: "transparent",
                    fontSize: "12px",
                    fontFamily: "Inter, system-ui, sans-serif"
                },
                x: {
                    label: "Projected seats",
                    domain: [
                        40,
                        140
                    ],
                    grid: true,
                    ticks: [
                        50,
                        75,
                        100,
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["majorityThreshold"],
                        125
                    ]
                },
                fy: {
                    domain: [
                        "Left coalition",
                        "Right coalition"
                    ],
                    label: null,
                    axis: "left",
                    padding: 0.1
                },
                color: {
                    domain: [
                        "Left coalition",
                        "Right coalition"
                    ],
                    range: [
                        "#10b981",
                        "#f59e0b"
                    ]
                },
                marks: [
                    // Majority line (spans across facets)
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$rule$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ruleX"]([
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["majorityThreshold"]
                    ], {
                        stroke: "#dc2626",
                        strokeWidth: 2,
                        strokeDasharray: "4,2",
                        facet: "exclude"
                    }),
                    // Dodged dots with slight horizontal jitter
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$dot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dotX"](sampledData, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$transforms$2f$dodge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dodgeY"]({
                        x: {
                            "CoalitionDotPlot.useEffect.plot": (d)=>d.totalSeats + (Math.random() - 0.5) * 1.5
                        }["CoalitionDotPlot.useEffect.plot"],
                        fy: "bloc",
                        fill: "bloc",
                        fillOpacity: 0.7,
                        r: 1.2,
                        anchor: "middle"
                    })),
                    // Median lines
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$rule$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ruleX"](blocMedians, {
                        x: "medianSeats",
                        fy: "bloc",
                        stroke: "black",
                        strokeWidth: 2,
                        strokeDasharray: "2,2"
                    }),
                    // Median labels
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["text"](blocMedians, {
                        x: "medianSeats",
                        fy: "bloc",
                        text: {
                            "CoalitionDotPlot.useEffect.plot": (d)=>Math.round(d.medianSeats).toString()
                        }["CoalitionDotPlot.useEffect.plot"],
                        dy: -8,
                        dx: 5,
                        fontSize: 11,
                        fontWeight: "bold",
                        fill: "black"
                    }),
                    // Majority label
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["text"]([
                        {
                            x: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["majorityThreshold"],
                            fy: "Left coalition"
                        }
                    ], {
                        x: "x",
                        fy: "fy",
                        text: "Majority (".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["majorityThreshold"], ")"),
                        dx: 5,
                        dy: -10,
                        fontSize: 11,
                        fill: "#dc2626",
                        fontWeight: "600"
                    })
                ]
            });
            if (containerRef.current) {
                containerRef.current.replaceChildren(plot);
            }
            return ({
                "CoalitionDotPlot.useEffect": ()=>plot.remove()
            })["CoalitionDotPlot.useEffect"];
        }
    }["CoalitionDotPlot.useEffect"], [
        data
    ]);
    // Add resize observer for responsive behavior
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CoalitionDotPlot.useEffect": ()=>{
            if (!containerRef.current) return;
            const resizeObserver = new ResizeObserver({
                "CoalitionDotPlot.useEffect": ()=>{
                    // Re-render chart when container size changes
                    if (containerRef.current && data && data.length > 0) {
                        // Small delay to ensure container has final dimensions
                        setTimeout({
                            "CoalitionDotPlot.useEffect": ()=>{
                                if (!containerRef.current) return;
                                const containerWidth = containerRef.current.offsetWidth || 1000;
                                const containerHeight = 350;
                                // Calculate coalition seats for each simulation
                                const blocDrawData = data.flatMap({
                                    "CoalitionDotPlot.useEffect.blocDrawData": (simulation, index)=>{
                                        const leftSeats = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["leftBlocParties"].reduce({
                                            "CoalitionDotPlot.useEffect.blocDrawData.leftSeats": (sum, party)=>sum + (simulation[party] || 0)
                                        }["CoalitionDotPlot.useEffect.blocDrawData.leftSeats"], 0);
                                        const rightSeats = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rightBlocParties"].reduce({
                                            "CoalitionDotPlot.useEffect.blocDrawData.rightSeats": (sum, party)=>sum + (simulation[party] || 0)
                                        }["CoalitionDotPlot.useEffect.blocDrawData.rightSeats"], 0);
                                        return [
                                            {
                                                draw: index,
                                                bloc: "Left coalition",
                                                totalSeats: leftSeats
                                            },
                                            {
                                                draw: index,
                                                bloc: "Right coalition",
                                                totalSeats: rightSeats
                                            }
                                        ];
                                    }
                                }["CoalitionDotPlot.useEffect.blocDrawData"]);
                                // Calculate medians
                                const blocMedians = Array.from(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$array$2f$src$2f$group$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rollup"](blocDrawData, {
                                    "CoalitionDotPlot.useEffect.blocMedians": (v)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$array$2f$src$2f$median$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__median$3e$__["median"](v, {
                                            "CoalitionDotPlot.useEffect.blocMedians": (d)=>d.totalSeats
                                        }["CoalitionDotPlot.useEffect.blocMedians"])
                                }["CoalitionDotPlot.useEffect.blocMedians"], {
                                    "CoalitionDotPlot.useEffect.blocMedians": (d)=>d.bloc
                                }["CoalitionDotPlot.useEffect.blocMedians"]), {
                                    "CoalitionDotPlot.useEffect.blocMedians": (param)=>{
                                        let [bloc, medianSeats] = param;
                                        return {
                                            bloc,
                                            medianSeats
                                        };
                                    }
                                }["CoalitionDotPlot.useEffect.blocMedians"]);
                                // Sample data for performance
                                const sampleSize = Math.min(1600, blocDrawData.length);
                                const sampledData = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$array$2f$src$2f$shuffle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__shuffle$3e$__["shuffle"](blocDrawData.slice()).slice(0, sampleSize);
                                const plot = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$plot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["plot"]({
                                    width: containerWidth,
                                    height: containerHeight,
                                    marginLeft: 140,
                                    marginRight: 60,
                                    marginTop: 30,
                                    marginBottom: 50,
                                    style: {
                                        backgroundColor: "transparent",
                                        fontSize: "12px",
                                        fontFamily: "Inter, system-ui, sans-serif"
                                    },
                                    x: {
                                        label: "Projected seats",
                                        domain: [
                                            40,
                                            140
                                        ],
                                        grid: true,
                                        ticks: [
                                            50,
                                            75,
                                            100,
                                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["majorityThreshold"],
                                            125
                                        ]
                                    },
                                    fy: {
                                        domain: [
                                            "Left coalition",
                                            "Right coalition"
                                        ],
                                        label: null,
                                        axis: "left",
                                        padding: 0.1
                                    },
                                    color: {
                                        domain: [
                                            "Left coalition",
                                            "Right coalition"
                                        ],
                                        range: [
                                            "#10b981",
                                            "#f59e0b"
                                        ]
                                    },
                                    marks: [
                                        // Majority line (spans across facets)
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$rule$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ruleX"]([
                                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["majorityThreshold"]
                                        ], {
                                            stroke: "#dc2626",
                                            strokeWidth: 2,
                                            strokeDasharray: "4,2",
                                            facet: "exclude"
                                        }),
                                        // Dodged dots with slight horizontal jitter
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$dot$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dotX"](sampledData, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$transforms$2f$dodge$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["dodgeY"]({
                                            x: {
                                                "CoalitionDotPlot.useEffect.plot": (d)=>d.totalSeats + (Math.random() - 0.5) * 1.5
                                            }["CoalitionDotPlot.useEffect.plot"],
                                            fy: "bloc",
                                            fill: "bloc",
                                            fillOpacity: 0.7,
                                            r: 1.2,
                                            anchor: "middle"
                                        })),
                                        // Median lines
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$rule$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ruleX"](blocMedians, {
                                            x: "medianSeats",
                                            fy: "bloc",
                                            stroke: "black",
                                            strokeWidth: 2,
                                            strokeDasharray: "2,2"
                                        }),
                                        // Median labels
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["text"](blocMedians, {
                                            x: "medianSeats",
                                            fy: "bloc",
                                            text: {
                                                "CoalitionDotPlot.useEffect.plot": (d)=>Math.round(d.medianSeats).toString()
                                            }["CoalitionDotPlot.useEffect.plot"],
                                            dy: -8,
                                            dx: 5,
                                            fontSize: 11,
                                            fontWeight: "bold",
                                            fill: "black"
                                        }),
                                        // Majority label
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$observablehq$2f$plot$2f$src$2f$marks$2f$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["text"]([
                                            {
                                                x: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["majorityThreshold"],
                                                fy: "Left coalition"
                                            }
                                        ], {
                                            x: "x",
                                            fy: "fy",
                                            text: "Majority (".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2f$blocs$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["majorityThreshold"], ")"),
                                            dx: 5,
                                            dy: -10,
                                            fontSize: 11,
                                            fill: "#dc2626",
                                            fontWeight: "600"
                                        })
                                    ]
                                });
                                containerRef.current.replaceChildren(plot);
                            }
                        }["CoalitionDotPlot.useEffect"], 100);
                    }
                }
            }["CoalitionDotPlot.useEffect"]);
            resizeObserver.observe(containerRef.current);
            return ({
                "CoalitionDotPlot.useEffect": ()=>resizeObserver.disconnect()
            })["CoalitionDotPlot.useEffect"];
        }
    }["CoalitionDotPlot.useEffect"], [
        data
    ]);
    if (!data || data.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full h-64 flex items-center justify-center text-gray-500",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "Loading coalition data..."
            }, void 0, false, {
                fileName: "[project]/src/components/charts/CoalitionDotPlot.tsx",
                lineNumber: 277,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/charts/CoalitionDotPlot.tsx",
            lineNumber: 276,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: containerRef,
                className: "overflow-x-auto"
            }, void 0, false, {
                fileName: "[project]/src/components/charts/CoalitionDotPlot.tsx",
                lineNumber: 284,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs text-gray-500 mt-2",
                children: [
                    "Showing ",
                    data.length,
                    " simulation outcomes"
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/charts/CoalitionDotPlot.tsx",
                lineNumber: 285,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/charts/CoalitionDotPlot.tsx",
        lineNumber: 283,
        columnNumber: 5
    }, this);
}
_s(CoalitionDotPlot, "iENxip3MlGo86izbk9A2xd09AZE=");
_c = CoalitionDotPlot;
var _c;
__turbopack_context__.k.register(_c, "CoalitionDotPlot");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/i18n/routing.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Link",
    ()=>Link,
    "defaultLocale",
    ()=>defaultLocale,
    "locales",
    ()=>locales,
    "pathnames",
    ()=>pathnames,
    "redirect",
    ()=>redirect,
    "usePathname",
    ()=>usePathname,
    "useRouter",
    ()=>useRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$navigation$2e$react$2d$client$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/navigation.react-client.js [app-client] (ecmascript)");
;
const locales = [
    'en',
    'pt'
];
const defaultLocale = 'pt';
const pathnames = {
    '/': '/',
    '/forecast': '/forecast',
    '/about': '/about',
    '/articles': '/articles',
    '/methodology': '/methodology'
};
const { Link, redirect, usePathname, useRouter } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$navigation$2e$react$2d$client$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createLocalizedPathnamesNavigation"])({
    locales,
    pathnames,
    defaultLocale
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/Header.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Header",
    ()=>Header
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/use-intl/dist/esm/development/react.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/i18n/routing.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-client] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/globe.js [app-client] (ecmascript) <export default as Globe>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function Header(param) {
    let { lastUpdate } = param;
    _s();
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useTranslations"])();
    const locale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocale"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const getPageTitle = ()=>{
        if (pathname === '/forecast') return t('forecast.title');
        if (pathname === '/about') return t('about.title');
        if (pathname === '/articles') return t('articles.title');
        if (pathname === '/methodology') return t('methodology.title');
        return '';
    };
    const navigationItems = [
        {
            href: '/',
            label: t('nav.home')
        },
        {
            href: '/forecast',
            label: t('nav.forecast')
        },
        {
            href: '/articles',
            label: t('nav.analysis')
        },
        {
            href: '/about',
            label: t('nav.about')
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "border-b border-green-medium bg-green-pale sticky top-0 z-50",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-7xl mx-auto px-4 py-4",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Link"], {
                                        href: "/",
                                        className: "text-2xl font-bold text-green-dark hover:text-green-medium",
                                        children: "estimador.pt"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Header.tsx",
                                        lineNumber: 37,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-green-dark/70",
                                        children: t('homepage.tagline')
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Header.tsx",
                                        lineNumber: 40,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/Header.tsx",
                                lineNumber: 36,
                                columnNumber: 13
                            }, this),
                            pathname !== '/' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "border-l border-green-medium pl-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-xl font-bold text-green-dark",
                                        children: getPageTitle()
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Header.tsx",
                                        lineNumber: 44,
                                        columnNumber: 17
                                    }, this),
                                    pathname === '/forecast' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-green-dark/70",
                                        children: t('forecast.subtitle')
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Header.tsx",
                                        lineNumber: 46,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/Header.tsx",
                                lineNumber: 43,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Header.tsx",
                        lineNumber: 35,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                                className: "hidden md:flex gap-6",
                                children: navigationItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Link"], {
                                        href: item.href,
                                        className: "font-medium transition-colors ".concat(pathname === item.href ? 'text-green-dark' : 'text-green-dark/70 hover:text-green-dark'),
                                        children: item.label
                                    }, item.href, false, {
                                        fileName: "[project]/src/components/Header.tsx",
                                        lineNumber: 55,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/Header.tsx",
                                lineNumber: 53,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$globe$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Globe$3e$__["Globe"], {
                                                className: "w-4 h-4 text-green-dark/70"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/Header.tsx",
                                                lineNumber: 72,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                value: locale,
                                                onChange: (e)=>{
                                                    const newLocale = e.target.value;
                                                    // This will be handled by next-intl routing
                                                    window.location.href = "/".concat(newLocale).concat(pathname === '/' ? '' : pathname);
                                                },
                                                className: "text-sm text-green-dark/70 bg-transparent border-none focus:outline-none cursor-pointer",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "pt",
                                                        children: "PT"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/Header.tsx",
                                                        lineNumber: 82,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "en",
                                                        children: "EN"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/Header.tsx",
                                                        lineNumber: 83,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/Header.tsx",
                                                lineNumber: 73,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/Header.tsx",
                                        lineNumber: 71,
                                        columnNumber: 15
                                    }, this),
                                    lastUpdate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-1 text-xs text-green-dark/70",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                                                className: "w-3 h-3"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/Header.tsx",
                                                lineNumber: 89,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    t('common.updated'),
                                                    " ",
                                                    lastUpdate
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/Header.tsx",
                                                lineNumber: 90,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/Header.tsx",
                                        lineNumber: 88,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/Header.tsx",
                                lineNumber: 69,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Header.tsx",
                        lineNumber: 52,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Header.tsx",
                lineNumber: 34,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/Header.tsx",
            lineNumber: 33,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/Header.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
_s(Header, "kL/iEB4e3Qm4fU4/YUSS6DQOHwI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useTranslations"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLocale"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$routing$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = Header;
var _c;
__turbopack_context__.k.register(_c, "Header");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_af74b9a8._.js.map