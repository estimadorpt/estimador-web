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
"[project]/src/components/Header.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Header",
    ()=>Header
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-client] (ecmascript) <export default as Calendar>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function Header(param) {
    let { lastUpdate } = param;
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const getPageTitle = ()=>{
        switch(pathname){
            case '/forecast':
                return 'Full Election Forecast';
            case '/about':
                return 'About';
            case '/articles':
                return 'Analysis & Articles';
            case '/methodology':
                return 'Methodology';
            default:
                return '';
        }
    };
    const navigationItems = [
        {
            href: '/',
            label: 'Home'
        },
        {
            href: '/forecast',
            label: 'Forecast'
        },
        {
            href: '/articles',
            label: 'Analysis'
        },
        {
            href: '/about',
            label: 'About'
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/",
                                        className: "text-2xl font-bold text-green-dark hover:text-green-medium",
                                        children: "estimador.pt"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Header.tsx",
                                        lineNumber: 42,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-green-dark/70",
                                        children: "Portuguese Election Forecast"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Header.tsx",
                                        lineNumber: 45,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/Header.tsx",
                                lineNumber: 41,
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
                                        lineNumber: 49,
                                        columnNumber: 17
                                    }, this),
                                    pathname === '/forecast' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-green-dark/70",
                                        children: "Portugal Parliamentary Elections"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Header.tsx",
                                        lineNumber: 51,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/Header.tsx",
                                lineNumber: 48,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Header.tsx",
                        lineNumber: 40,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                                className: "hidden md:flex gap-6",
                                children: navigationItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: item.href,
                                        className: "font-medium transition-colors ".concat(pathname === item.href ? 'text-green-dark' : 'text-green-dark/70 hover:text-green-dark'),
                                        children: item.label
                                    }, item.href, false, {
                                        fileName: "[project]/src/components/Header.tsx",
                                        lineNumber: 60,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/Header.tsx",
                                lineNumber: 58,
                                columnNumber: 13
                            }, this),
                            lastUpdate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1 text-xs text-green-dark/70",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                                        className: "w-3 h-3"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Header.tsx",
                                        lineNumber: 76,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            "Updated ",
                                            lastUpdate
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/Header.tsx",
                                        lineNumber: 77,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/Header.tsx",
                                lineNumber: 75,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Header.tsx",
                        lineNumber: 57,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Header.tsx",
                lineNumber: 39,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/Header.tsx",
            lineNumber: 38,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/Header.tsx",
        lineNumber: 37,
        columnNumber: 5
    }, this);
}
_s(Header, "xbyQPtUVMO7MNj7WjJlpdWqRcTo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
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

//# sourceMappingURL=src_36ee97cc._.js.map