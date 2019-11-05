import Curve from '../js/Curve';
import Arc from '../js/geometries/Arc';
import Linear from '../js/functions/Linear';
import Polynomial from '../js/functions/Polynomial';
import Sinusoidal from '../js/functions/Sinusoidal';
import Exponential from '../js/functions/Exponential';
import Elastic from '../js/functions/Elastic';
import Back from '../js/functions/Back';
import Bounce from '../js/functions/Bounce';

import { cartToPolar, radToDeg } from '../utils/math';
import { hslToRgb, rgbToHex, printRgb, printHsl } from '../utils/color';

/**
 * A continuous color palette created by overlaying curves onto surfaces in the HSL color space.
 * 
 * A ColorPalette has exactly two curves. The "hs" curve maps to hue and saturation values and lies in a unit circle
 * in the HS space. The "l" curve maps it's y-coordinate to lightness, and lies in a unit square in the L space.
 * 
 */

export default class ColorPalette {

    /**
     * Creates a new Color Palette.
     * @param {object|string} [hsCurve] The curve object or curve type of the "hs" curve
     * @param {object|string} [lCurve] The curve object or curve type of the "l" curve
     * @param {object} [options = {}] Optional properties of the color palette
     * @param {number} [options.start] Starts the palette at a certain point along the curve
     * @param {number} [options.end] Ends the palette at a certain point along the curve
     */

    constructor(hsCurve, lCurve, options = {}) {

        this.setHsCurve(hsCurve);
        this.setLCurve(lCurve);

        const {
            start,
            end
        } = options;

        this.setStart(start);
        this.setEnd(end);

    }

    static getParamSet() {

        return ['start', 'end'];

    }

    /**
     * Sets the "hs" (hue-saturation) curve for this palette.
     * @param {object|string} [hsCurve] An object or string describing the "hs" curve. See {@link Curve}
     */

    setHsCurve(hsCurve) {

        if(hsCurve && hsCurve.isCurve) {

            if(hsCurve.surface.type === 'unitCircle') {

                this.hsCurve = hsCurve;

            } else {

                console.error("Due to the nature of the HSL colorspace, the hsCurve is required to have a surface of type 'unitCircle'.")

            }


        } else if(typeof hsCurve === 'object') {

            this.hsCurve = this.initializeCurve(hsCurve.type, {surface: 'unitCircle', ...hsCurve});

        } else if(typeof hsCurve === 'string') {

            this.hsCurve = this.initializeCurve(hsCurve, {surface: 'unitCircle'});

        } else {

            this.hsCurve = this.initializeCurve('exponential', {surface: 'unitCircle'});

        }

    }

    /**
     * Sets the "l" (lightness) curve for this palette.
     * @param {object|string} [lCurve] An object or string describing the "hs" curve. See {@link Curve}
     */

    setLCurve(lCurve) {

        if(lCurve && lCurve.isCurve) {

            this.lCurve = lCurve;

        } else if(typeof lCurve === 'object') {

            this.lCurve = this.initializeCurve(lCurve.type, {surface: 'unitSquare', ...lCurve});

        } else if(typeof lCurve === 'string') {

            this.lCurve = this.initializeCurve(lCurve, {surface: 'unitSquare'});

        } else {

            this.lCurve = this.initializeCurve('linear', {surface: 'unitSquare'});

        }

    }

    /**
     * Returns a JSON representation of this palette, including representations for each of its curves and the palette itself.
     * The returned string consists of three comma-separated JSON objects which map to hsCurve, lCurve, and paletteParams in the ColorPalette constructor.
     * @param {number} [precision] The number of decimals to include in numerical parameters.
     * @returns {string} The JSON representation of this palette.
     */

    exportPaletteParams(precision) {

        const p = precision || 3;

        // helper function to convert params to fixed digits
        const pDigits = (x) => {

            switch(typeof x) {
                case 'number': return x.toFixed(p);
                case 'object': return Object.assign({}, ...Object.entries(x).map(([k, v]) => ({[k]: pDigits(v)})));
                default: return x;
            }

        }

        // get the set of all curve params, and make a collection of defined params for each curve
        const curveParamsSet = Curve.getParamSet();

        const lCurveParams = {};
        const hsCurveParams = {};

        curveParamsSet.forEach((param) => {

            if(this.hsCurve[param] !== undefined && this.hsCurve[param] !== null) {

                (hsCurveParams[param] = pDigits(this.hsCurve[param]));

            }

            if(this.lCurve[param] !== undefined && this.lCurve[param] !== null) {

                (lCurveParams[param] = pDigits(this.lCurve[param]));

            }

        });

        // get the set of all palette params, and make a collection of defined params for this palette
        const paletteParamsSet = ColorPalette.getParamSet();

        const paletteParams = {};

        paletteParamsSet.forEach((param) => {

            if(this[param] !== undefined && this[param] !== null) {

                (paletteParams[param] = pDigits(this[param]));

            }

        });

        return `
            ${JSON.stringify(hsCurveParams)}, \
            ${JSON.stringify(lCurveParams)}, \
            ${JSON.stringify(paletteParams)}`;

    }

    /**
     * Sets the start point for the palette's curves
     * @param {number} [start] A number in the range [0, 1]. Not to exceed the palette's end point.
     */

    setStart(start) {

        if(start === undefined) {

            this.start = 0;

        } else if(start > this.end) {

            console.warn('Palette start cannot be greater than palette end. Setting palette start to palette end.');

            this.start = this.end;

        } else {

            this.start = start;

        }

    }

    /**
     * Sets the end point for the palette's curves
     * @param {number} [end] A number in the range [0, 1]. Not to be exceeded by the palette's start point.
     */

    setEnd(end) {

        if(end === undefined) {

            this.end = 1;

        } else if(end < this.start) {

            console.warn('Palette end cannot be less than than palette start. Setting palette end to palette start.');

            this.end = this.start;

        } else {

            this.end = end;

        }

    }

    /**
     * Draws a representation of the palette using evenly spaced stops.
     * @param {object} canvas An HTML canvas on which to draw the palette.
     * @param {number} numStops The number of distinct colors to use in the drawing.
     */

    drawDiscretePalette(canvas, numStops) {

        this.updateCurveClampBound();

        canvas.width = canvas.clientWidth * 4;
        canvas.height = canvas.clientHeight * 4;
        const ctx = canvas.getContext('2d');
        const stops = numStops || 12;

        for(let i = 0; i < stops; i++) {
    
            // get hsl values
            const hsl = this.hslValueAt((i + 0.5) / stops);
    
            ctx.fillStyle = hsl;
            ctx.fillRect(i * canvas.width / stops, 0, canvas.width * 1.1 / stops, canvas.height);
    
        }

    }

    /**
     * Draws a representation of the palette using a continuous gradient.
     * @param {object} canvas An HTML canvas on which to draw the palette.
     * @param {number} [resolution = 32] The number of sub-gradients to use.
     */

    drawContinuousPalette(canvas, resolution) {

        this.updateCurveClampBound();

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        const stops = resolution || 32;

        // draw continuous palette
        for(let i = 0; i <= stops; i++) {
    
            // get hsl values
            const hsl = this.hslValueAt(i / stops);
    
            // add a gradient stop
            gradient.addColorStop(i / stops, hsl);
    
        }
    
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

    }

    /**
     * Helper function that builds a curve from a specified string.
     * @param {string} curveType A string that maps to one of the supported curve types.
     * @param {object} [options] Options for the curve. See {@link Curve}.
     */

    initializeCurve(curveType, options) {

        switch(curveType) {

            case 'arc': return new Arc({...options});
            case 'linear': return new Linear({...options});
            case 'polynomial': return new Polynomial({...options});
            case 'sinusoidal': return new Sinusoidal({...options});
            case 'exponential': return new Exponential({...options});
            case 'elastic': return new Elastic({...options});
            case 'back': return new Back({...options});
            case 'bounce': return new Bounce({...options});
            default: 
                console.warn('Specified curve type is not supported. Using default (linear) instead.');
                return new Linear({...options});

        }

    }

    updateCurveClampBound() {

        /* 
        If overflow === 'clamp', the palette should only sample the first continuous segment of non-clamped values.
        Update the clamp values here to ensure that they are adjusted to the curves current transformations.
        */

        this.hsCurve.overflow === 'clamp' && this.hsCurve.setClampBounds();
        this.lCurve.overflow === 'clamp' && this.lCurve.setClampBounds();

    }

    getColorValues(n) {

        const hsStart = this.hsCurve.overflow === 'clamp' ? Math.max(this.start, this.hsCurve.clampStart) : this.start;
        const hsEnd = this.hsCurve.overflow === 'clamp' ? Math.min(this.end, this.hsCurve.clampEnd) : this.end;
        const lStart = this.lCurve.overflow === 'clamp' ? Math.max(this.start, this.lCurve.clampStart) : this.start;
        const lEnd = this.lCurve.overflow === 'clamp' ? Math.min(this.end, this.lCurve.clampEnd) : this.end;

        // get hue and saturation values from the hsCurve
        const hsCartCoords = this.hsCurve.getCurveCoordsAt(hsStart + n * (hsEnd - hsStart));
        const hsPolarCoords = cartToPolar(hsCartCoords.x, hsCartCoords.y);
        const hue = radToDeg(hsPolarCoords.theta) % 360;
        const sat = Math.max(0, Math.min(1, hsPolarCoords.r));

        // get lightness values from the lightCurve
        const lCartCoords = this.lCurve.getCurveCoordsAt(lStart + n * (lEnd - lStart));
        const lightness = Math.max(0, Math.min(1, lCartCoords.y));

        return {
            h: hue,
            s: sat,
            l: lightness
        };

    }

    hslValueAt(n) {

        const {h, s, l} = this.getColorValues(n);
        return printHsl(h, s, l);

    }

    rgbValueAt(n) {

        const {h, s, l} = this.getColorValues(n);
        const {r, g, b} = hslToRgb(h, s, l);
        return printRgb(r, g, b);

    }

    hexValueAt(n) {

        const {h, s, l} = this.getColorValues(n);
        const {r, g, b} = hslToRgb(h, s, l);
        return rgbToHex(r, g, b);
        

    }

}