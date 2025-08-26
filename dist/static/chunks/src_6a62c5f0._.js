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
]);

//# sourceMappingURL=src_6a62c5f0._.js.map