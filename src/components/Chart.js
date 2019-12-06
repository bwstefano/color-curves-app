// libs
import React, { useEffect, useRef, useState } from 'react';

// components
import ChartControls from './ChartControls';
import Canvas from './Canvas';

// other
import { HSLChart } from '../drawing/HSLChart';

function Chart(props) {

    const [chartCanvas, setChartCanvas] = useState(null);
    const [hslChart, setHslChart] = useState(null);

    // painful but necessary due to shallow compare of props.curve
    const [angleStart, setAngleStart] = useState(props.curve.angleStart);
    const [angleEnd, setAngleEnd] = useState(props.curve.angleEnd);
    const [angleOffset, setAngleOffset] = useState(props.curve.angleOffset);
    const [variation, setVariation] = useState(props.curve.variation);
    const [translateX, setTranslateX] = useState(props.curve.translation.x);
    const [translateY, setTranslateY] = useState(props.curve.translation.y);
    const [scaleX, setScaleX] = useState(props.curve.scale.x);
    const [scaleY, setScaleY] = useState(props.curve.scale.y);
    const [rotation, setRotation] = useState(props.curve.rotation);
    const [reverse, setReverse] = useState(props.curve.reverse);
    const [radius, setRadius] = useState(props.curve.radius);
    const [overflow, setOverflow] = useState(props.curve.overflow);
    const [exponent, setExponent] = useState(props.curve.exponent);
    const [overshoot, setOvershoot] = useState(props.curve.overshoot);
    const [amplitude, setAmplitude] = useState(props.curve.amplitude);
    const [period, setPeriod] = useState(props.curve.period);

    // always update palette with chart
    const updateCurve = () => {
        hslChart && hslChart.update()
        props.updatePalettes && props.updatePalettes();
    }

    const onParamChange = (param, value) => {

        switch (param) {
            case 'angleStart': props.curve.setAngleStart(value); setAngleStart(value); break;
            case 'angleEnd': props.curve.setAngleEnd(value); setAngleEnd(value); break;
            case 'angleOffset': props.curve.setAngleOffset(value); setAngleOffset(value); break;
            case 'variation': props.curve.setVariation(value); setVariation(value); break;
            case 'translateX': props.curve.setTranslateX(value); setTranslateX(value); break;
            case 'translateY': props.curve.setTranslateY(value); setTranslateY(value); break;
            case 'scaleX': props.curve.setScaleX(value); setScaleX(value); break;
            case 'scaleY': props.curve.setScaleY(value); setScaleY(value); break;
            case 'rotate': props.curve.setRotation(value); setRotation(value); break;
            case 'reverse': props.curve.setReverse(value); setReverse(value); break;
            case 'radius': props.curve.setRadius(value); setRadius(value); break;
            case 'overflow': props.curve.setOverflow(value); setOverflow(value); break;
            case 'exponent': props.curve.setExponent(value); setExponent(value); break;
            case 'overshoot': props.curve.setOvershoot(value); setOvershoot(value); break;
            case 'amplitude': props.curve.setAmplitude(value); setAmplitude(value); break;
            case 'period': props.curve.setPeriod(value); setPeriod(value); break;
            default: break;
        }

        // update clamping bounds
        if (props.curve.overflow === 'clamp') props.curve.setClampBounds();

        updateCurve();

    };

    const setupListeners = (chart) => {

        const mouseMoveUp = (e) => {
            const rect = chartCanvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * window.devicePixelRatio || 1;
            const y = (e.clientY - rect.top) * window.devicePixelRatio || 1;
            chart.updateMousePos(x, y);
        }

        const mouseDown = (e) => {
            const mouseMoveDownClosure = () => {

                const rect = chartCanvas.getBoundingClientRect();
                const sx = (e.clientX - rect.left) * window.devicePixelRatio || 1;
                const sy = (e.clientY - rect.top) * window.devicePixelRatio || 1;

                const mouseMoveDown = (e) => {
                    const x = (e.clientX - rect.left) * window.devicePixelRatio || 1;
                    const y = (e.clientY - rect.top) * window.devicePixelRatio || 1;
                    chart.updateMousePos(x, y, sx, sy);
                }

                const mouseUp = (e) => {
                    document.removeEventListener('mousemove', mouseMoveDown);

                    // add new
                    chartCanvas.addEventListener('mousemove', mouseMoveUp);
                }

                // add new 
                document.addEventListener('mousemove', mouseMoveDown);
                document.addEventListener('mouseup', mouseUp);
            }

            chartCanvas.removeEventListener('mousemove', mouseMoveUp);
            mouseMoveDownClosure();

        }

        // add new
        chartCanvas.addEventListener('mousemove', mouseMoveUp);
        chartCanvas.addEventListener('mousedown', mouseDown);

    }

    // create a new chart class for each canvas/curve combination
    useEffect(() => {

        console.log('nechart');

        if (chartCanvas) {
            if (!hslChart) {
                const chart = new HSLChart(chartCanvas, props.curve, props.curve.surface.type, onParamChange)
                setHslChart(chart);
                setupListeners(chart);
                chart.update();
            } else {
                hslChart.setCurve(props.curve);
                hslChart.onParamChange = onParamChange;
                hslChart.update();
            }

        }

    }, [chartCanvas, props.curve]);

    // update the chart class and palettes when dependencies change
    useEffect(() => {
        updateCurve();
    }, [updateCurve])

    return (

        <div className='chart col-md-6'>

            <div className='material-static chart-wrapper'>

                <div className='row border-bottom'>

                    <div className='col-md-12'>

                        <h2>{props.title}</h2>

                    </div>

                </div>

                <div className='row'>

                    <div className='col-md-12'>

                        <Canvas
                            className='chart'
                            onLoad={canvas => setChartCanvas(canvas)}
                            onResize={() => updateCurve()}
                            makeSquare={true}
                        />

                    </div>

                </div>

                <ChartControls
                    chartType={props.chartType}
                    config={props.config}
                    curve={props.curve}
                    setCurve={props.setCurve}
                    updateCurve={updateCurve}
                    onParamChange={onParamChange}
                    angleStart={angleStart}
                    angleEnd={angleEnd}
                    angleOffset={angleOffset}
                    variation={variation}
                    translateX={translateX}
                    translateY={translateY}
                    scaleX={scaleX}
                    scaleY={scaleY}
                    rotation={rotation}
                    reverse={reverse}
                    radius={radius}
                    overflow={overflow}
                    exponent={exponent}
                    overshoot={overshoot}
                    amplitude={amplitude}
                    period={period}
                />

            </div>

        </div>

    );

}

export default Chart;