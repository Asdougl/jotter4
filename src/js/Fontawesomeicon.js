module.exports = (icon, style) => {
    
    const ele = document.createElement('i');
    if(style === undefined) style = 'fas';
    ele.classList.add(style);
    ele.classList.add('fa-' + icon);
    ele.classList.add('fa-fw');

    return {
        element: ele,
        icon,
        style,
        dom() {
            return this.element;
        },
        string() {
            return this.element.outerHTML;
        },
        setIcon(icon) {
            this.element.classList.remove('fa-' + this.icon);
            this.element.classList.add('fa-' + icon);
            this.icon = icon;
            return this;
        },
        setStyle(style) {
            this.element.classList.remove(this.style);
            this.element.classList.add(style);
            this.style = style;
            return this;
        }
    }

}