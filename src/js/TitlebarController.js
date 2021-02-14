// Title Bar Controller
const { remote } = require('electron');

const comm = require('./Communication');

module.exports = class TitleBarController {

    constructor() {

        // Communication Layer
        this.comm = comm;
        this.comm.register('title-set', (text, action) => this.setAction(text, action))

        this.$button = document.querySelector('#title-bar_button')
        this.$text = document.querySelector('#title-bar_title');
        this.$minimise = document.querySelector('#window-minimise');
        this.$maximise = document.querySelector('#window-maximise');
        this.$close = document.querySelector('#window-close');

        this.$minimise.addEventListener('click', () => {
            remote.getCurrentWindow().minimize();
        })

        this.$maximise.addEventListener('click', () => {
            const window = remote.getCurrentWindow();
            if(window.isMaximized()) {
                window.unmaximize();
            } else {
                window.maximize();
            }
        })

        this.$close.addEventListener('click', () => {
            remote.app.quit();
        })

        this.action = null;
    }

    setAction(text, action) {
        this.$button.innerText = text;
        if(action) {
            this.$button.removeEventListener('click', this.action);
            this.action = action;
            this.$button.addEventListener('click', this.action);
        } else {
            this.$button.removeEventListener('click', this.action);
        }
        
    }

}