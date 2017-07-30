export class Drone {

    /** m/s */
    private static readonly speed = 5

    /** Target position */
    private tx: number
    private ty: number

    /** Setup the drone; positions are float coordinates on the worldmap */
    constructor(public x: number, public y: number) {
        // Initially target and position are the same
        this.tx = x
        this.ty = y
    }

    /** Define where the drone should fly to */
    public setTarget(x, y) {
        this.tx = x
        this.ty = y
    }

    public updatePosition(dt) {
        if (this.x == this.tx && this.y == this.ty) {
            return;
        }

        let dx = this.tx - this.x
        let dy = this.ty - this.y
        if (dx * dx + dy * dy < 0.0001) {
            this.x = this.tx
            this.y = this.ty
            return
        }

        const px = this.x
        const py = this.y

        // TODO dx and dy are not normalized, so we have some tweening effect; we should cap speed though

        this.x += dx * Drone.speed * dt
        this.y += dy * Drone.speed * dt
    }
}