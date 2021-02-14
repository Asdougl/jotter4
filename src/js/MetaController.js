const FaIcon = require('./Fontawesomeicon');
const { areYouSure } = require('./Assets');
const comm = require('./Communication');
/*  Meta Controller Class
===================

Controls meta display of notes

*/
module.exports = class MetaController {

    icons = [
        { title: 'Bookmark', name: 'bookmark' },
        { title: 'Tag', name: 'tag' },
        { title: 'Note', name: 'sticky-note' },
        { title: 'Code', name: 'code' },
        { title: 'Idea', name: 'lightbulb' },
        { title: 'Book', name: 'book' },
        { title: 'Books', name: 'books' },
        { title: 'Chapter', name: 'book-open' },
        { title: 'Pinned', name: 'thumbtack' },
        { title: 'List', name: 'list-ul' },
        { title: 'Objective', name: 'check-circle' },
        { title: 'Certified', name: 'certificate' },
        { title: 'Reminder', name: 'bell' },
        { title: 'Mail', name: 'envelope' },
        { title: 'Calendar', name: 'calendar' },
        { title: 'Landmark', name: 'landmark' },
        { title: 'Mountains', name: 'mountains' },
        { title: 'Location', name: 'map-marked' },
        { title: 'Travel', name: 'plane-departure' },
        { title: 'Food', name: 'utensils-alt' },
        { title: 'Shopping', name: 'shopping-basket' },
        { title: 'Computer', name: 'computer-classic' },
        { title: 'Data', name: 'database' },
        { title: 'Scientific', name: 'flask' },
        { title: 'Earthly', name: 'planet-moon' },
        { title: 'Space', name: 'planet-ringed' },
        { title: 'Revolutionary', name: 'fist-raised' },
        { title: 'Secretive', name: 'user-secret' },
        { title: 'Aquatic', name: 'fish' },
        { title: 'Radioactive', name: 'radiation' },
        { title: 'Wizardous', name: 'hat-wizard' },
        { title: 'No Moon', name: 'space-station-moon' },
        { title: 'Yikes', name: 'dumpster-fire' },
        { title: 'Caw', name: 'crow' },
    ]

    constructor() {

        this.file = null;
        this.comm = comm;

        // Communication Layer
        this.comm.register('meta-set', (file) => {
            this.setFile(file)
            this.comm.do('nav-desc', ['meta']);
        })
        this.comm.register('meta-set-id', (id) => {
            const file = this.comm.do('file-get', [id]);
            this.setFile(file);
            this.comm.do('nav-desc', ['meta']);
        })
        
        
        // UI Elements
        this.$container = document.getElementById('meta');
        this.$title = this.$container.querySelector('.title');
        this.$nav = this.$container.querySelector('.meta-nav');

        // Nav Items
        this.$nav.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                this.showSection(li.getAttribute('to'));
            });
        })

        // Sections
        this.$info = this.$container.querySelector('.meta-section.info');
        this.$icon = this.$container.querySelector('.meta-section.icon');
        this.$actions = this.$container.querySelector('.meta-section.actions');
        this.showSection('info');
        
    }

    setFile(file) {
        this.file = file;
        this.buildMeta();
    }

    showSection(name) {
        this.$container.querySelectorAll('.meta-section').forEach(ele => {
            if(ele.classList.contains(name)) {
                ele.classList.add('show');
            } else {
                ele.classList.remove('show');
            }
        });
        this.$nav.querySelectorAll('li').forEach(ele => {
            if (ele.getAttribute('to') == name) {
                ele.classList.add('active');
            } else {
                ele.classList.remove('active');
            }
        });
    }

    buildMeta() {
        if (this.file) {
            this.$title.innerText = this.file.name;

            // Build Info
            this.buildInfo();

            // Build Icons
            this.buildIcons();

            // Build Actions
            this.buildActions();

            // Reset to Info
            this.showSection('info');

        } else {
            this.comm.do('nav-show', ['explorer']);
        }
    }

    buildInfo() {
        this.$info.innerHTML = '';
        const keys = Object.keys(this.file);
        keys.forEach(field => {
            const li = document.createElement('li');
            const title = document.createElement('div');
            const value = document.createElement('div');

            title.innerText = field;
            value.innerText = this.file[field];
            li.append(title, value);
            this.$info.append(li);
        })
    }

    buildIcons() {
        this.$icon.innerHTML = '';
        this.icons.forEach(icon => {
            // Icon Label
            const title = document.createElement('div');
            title.innerText = icon.title;
            // Icon
            const preview = FaIcon(icon.name, this.file.icon == icon.name ? 'fas' : 'fal').element;

            // Container
            const li = document.createElement('li');
            li.classList.add('action');
            li.append(title, preview);
            li.addEventListener('click', () => {
                this.comm.do('file-update-icon', [this.file.id, icon.name]);
                this.comm.do(`editor-${this.file.id}-icon`);
                this.buildIcons();
            })
            this.$icon.append(li);

        })
    }

    buildActions() {
        this.$actions.innerHTML = '';
        // Delete
        const deleteLi = document.createElement('li');
        const delTitle = 'Delete File';
        const delBtn = areYouSure('Delete', () => {
            this.comm.do('file-delete', [this.file.id]);
            this.comm.do('nav-show', ['explorer']);
        })
        deleteLi.append(delTitle, delBtn);

        this.$actions.append(deleteLi);

    }

}