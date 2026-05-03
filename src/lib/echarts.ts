import * as echarts from "echarts";

export const init = echarts.init.bind(echarts);
export const dispose = echarts.dispose.bind(echarts);
export const getInstanceByDom = echarts.getInstanceByDom.bind(echarts);
export const registerMap = echarts.registerMap.bind(echarts);
export const getMap = echarts.getMap.bind(echarts);
export const connect = echarts.connect.bind(echarts);
export const disconnect = echarts.disconnect.bind(echarts);
export const disConnect = echarts.disConnect?.bind(echarts) ?? echarts.disconnect.bind(echarts);
export const graphic = echarts.graphic;
export const format = echarts.format;
export const number = echarts.number;
export const time = echarts.time;
export const util = echarts.util;
export const matrix = echarts.matrix;
export const vector = echarts.vector;
export const color = echarts.color;
export const env = echarts.env;

export default echarts;
