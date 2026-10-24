/** Named re-exports so the chart chunk stays tree-shaken and loads only after import(). */
export {
  createChart,
  CandlestickSeries,
  LineSeries,
  LineStyle,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";
