// Nav Controller
const comm = require('./Communication');

module.exports = class NavController {

    constructor() {
        // Communication Layer
        this.comm = comm;
        this.comm.register('nav-show', (name) => this.show(name))
        this.comm.register('nav-location', () => this.route);
        this.comm.register('nav-desc', (loc) => this.descend(loc));
        this.comm.register('nav-asc', () => this.ascend());

        this.$sections = Array.from(document.querySelectorAll('#app section'));

        this.route = '';
        this.history = [];

        // Default Page -- Explorer
        this.show('explorer');

    }

    show(name) {
        this.route = name;
        this.history = [];
        this.$sections.forEach(section => {
            if(section.getAttribute('section') == name) {
                section.style.removeProperty('display');
            } else {
                section.style.display = 'none';
            }
        })

        if(name != 'explorer') {
            this.comm.do('title-set', ['<-', () => {
                this.show('explorer');
            }])
        } else {
            this.comm.do('title-set', ['']);
        }
    }

    descend(name) {
        // Track History
        if(this.route) this.history.push(this.route);

        // Establish Current Dir
        this.route = name;

        // Hide sections
        this.$sections.forEach(section => {
            if (section.getAttribute('section') == name) {
                section.style.removeProperty('display');
            } else {
                section.style.display = 'none';
            }
        })

        this.comm.do('title-set', ['<-', () => {
            this.ascend();
        }])
    }

    ascend() {
        this.route = this.history[this.history.length - 1];
        this.history.pop();
        
        // Hide sections
        this.$sections.forEach(section => {
            if (section.getAttribute('section') == this.route) {
                section.style.removeProperty('display');
            } else {
                section.style.display = 'none';
            }
        })

        if(this.history.length == 0) {
            const icon = this.comm.do('editors-count') > 0 ? '->' : '';
            this.comm.do('title-set', [icon, () => {
                this.descend('editor');
            }])
        } else {
            this.comm.do('title-set', ['<-', () => {
                this.ascend();
            }])
        }
        
    }

}