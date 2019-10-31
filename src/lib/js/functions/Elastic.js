import Function from './Function';
import * as d3 from 'd3-ease';

/**
 * Creates an ease "elastic" curve.
 * @param {object} [options] Optional properties of the function
 * @param {string} [options.amplitude] The amplitude of the function
 * @param {number} [options.period] The period of the function
 */

export default class Elastic extends Function {

    constructor(options) {

        const {
            variation,
            amplitude,
            period
        } = options;
        
        super({...options});

        this.type = 'elastic';
        this._fn = null;

        this.setAmplitude(amplitude);
        this.setPeriod(period);
        this.setVariation(variation);
        this.setFunction();

    }

    setAmplitude(a = 1) {

        if(a > 1) {

            this.amplitude = a;
            this.setFunction();

        } else {

            console.error('Amplitude must be a number greater than 1');

        }

    }

    setPeriod(p = 0.3) {

        if(p > 0) {

            this.period = p;
            this.setFunction();
            
        } else {

            console.error('Period must be a number greater than 0.');

        }
    }

    setVariation(variation = 'in') {

        if(variation === 'in' || variation === 'out' || variation === 'in-out'){

            this.variation = variation;
            this.setFunction();

        } else {

            console.warn("variation must be 'in', 'out', or 'in-out'");

        }

    }

    setFunction() {

        switch(this.variation) {
            case 'in': this.setFn(d3.easeElasticIn.amplitude(this.amplitude).period(this.period)); break;
            case 'out': this.setFn(d3.easeElasticOut.amplitude(this.amplitude).period(this.period)); break;
            case 'in-out': this.setFn(d3.easeElasticInOut.amplitude(this.amplitude).period(this.period)); break;
            default: break;
        }
        
    }

}