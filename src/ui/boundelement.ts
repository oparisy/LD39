/** An HTML elements bound to a JavaScript number. Rounded by default before display. */
export class BoundElement {

    private _value: number
    private _converter: (x: number) => string

    public constructor(private domElement: Element, initialValue: number, converter?: (x: number) => string) {
        this._converter = converter === undefined ? (x: number) => Math.floor(x).toString() : converter

        // Now that we have a converter, use the setter to initialize the DOM element
        this.value = initialValue;
    }

    public get value() {
        return this._value;
    }

    public set value(newValue: any) {
        this._value = newValue
        this.domElement.innerHTML = this._converter(newValue)
    }
}