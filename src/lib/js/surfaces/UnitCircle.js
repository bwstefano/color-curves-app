export default class UnitCircle {

    constructor() {
        this.type = 'unitCircle';
        this.cx = 0;
        this.cy = 0;
        this.r = 1;
    }

    static outOfBounds(x, y) {
        return x * x + y * x > this.r * this.r;
    }

}
