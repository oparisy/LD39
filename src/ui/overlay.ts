export class Overlay {

    private root: HTMLElement = undefined

    /** Show an overlay on top of the current document.
     * Root element is returned for extra customization */
    public show(htmlContents?: string, backgroundColor?: string): HTMLElement {
        // See https://stackoverflow.com/a/40100248/38096
        this.root = document.createElement('div')
        if (htmlContents !== undefined) {
            this.root.innerHTML = htmlContents
        }
        if (backgroundColor !== undefined) {
            this.root.style.background = backgroundColor
        }
        this.root.classList.add('overlay')
        document.body.appendChild(this.root)
        return this.root
    }

    /** Remove the previously displayed overlay */
    public remove() {
        if (this.root !== undefined) {
            document.body.removeChild(this.root)
            this.root = undefined
        }
    }
}