const { v4: uuidv4 } = require('uuid');
const FaIcon = require('./Fontawesomeicon');
const comm = require('./Communication');

/*  Editor Class
===================

controls an individual editor

*/
module.exports = class Editor {

    constructor(file, body, functions) {

        // Init Coimmunication Layer
        this.comm = comm;

        // Init Callbacks
        this.onTitleSave = functions ? functions.titleSave : null;
        this.onBodySave = functions ? functions.bodySave : null;
        this.removeEditor = functions ? functions.remove : null;

        // Init Variables
        this.file = { id: null, bookmarked: false };
        this.body = '';
        // this.id = null;
        // this.title = '';
        // this.body = '';
        // this.bookmarked = false;

        // Init Container Ele
        this.$container = document.createElement('div');
        this.$container.classList.add('editor');

        // -- Editor --

        // Init Editor Ele
        this.$editor = document.createElement('div');
        this.$editor.classList.add('editor-body');
        this.$editor.setAttribute('contenteditable', 'true');
        this.$editor.addEventListener('keyup', () => this.saveBody());

        // Editor Container
        const econtain = document.createElement('div');
        econtain.classList.add('body-container');
        econtain.append(this.$editor);

        // -- Title --

        // Init Title
        this.$title = document.createElement('input');
        this.$title.classList.add('title');
        this.$title.placeholder = 'Title...';
        this.$title.addEventListener('input', () => this.saveTitle());

        // Bookmark Button
        this.$bookmark = document.createElement('button');
        this.$bookmark.classList.add('bookmark');
        this.$bookmarkIcon = FaIcon('bookmark', 'fal');
        this.$bookmark.append(this.$bookmarkIcon.dom());
        this.$bookmark.addEventListener('click', () => this.bookmarkFile());

        // Save Button
        this.$save = document.createElement('button');
        this.$save.classList.add('save');
        this.$save.append(FaIcon('save', 'fal').element);
        this.$save.addEventListener('click', () => this.saveFile());

        // Info Button
        this.$meta = document.createElement('button');
        this.$meta.classList.add('meta');
        this.$meta.append(FaIcon('info-circle', 'fal').element);
        this.$meta.addEventListener('click', () => this.comm.do('meta-set-id', [this.file.id]));

        // Title Container
        const tcontain = document.createElement('div');
        tcontain.classList.add('title-container');
        tcontain.append(this.$save, this.$bookmark, this.$title, this.$meta);

        // Put them together
        this.$container.append(tcontain, econtain);

        this.setFile(file, body);
        
        // Append to DOM
        document.querySelector('#editor .editors').append(this.$container);

    }

    // Set Active File
    setFile(file, body) {
        if(file.id !== null) {
            // We have a saved file
            this.file = file;
            this.body = body || '';
            this.changeTitle(this.file.name);
            this.changeBody(this.body);
            this.setBookmarked(this.file.bookmarked || false);
            this.$bookmarkIcon.setIcon(this.file.icon || 'question');

            this.comm.register(`editor-${file.id}-icon`, () => this.$bookmarkIcon.setIcon(this.file.icon));
        } else {
            // We have an unsaved file
            this.file.id = uuidv4(); // give a temporary id
            this.$save.classList.add('unsaved');
            this.$bookmark.classList.add('hidden');
            this.$meta.classList.add('hidden');
        }
        
    }

    setBookmarked(state) {
        this.file.bookmarked = state;
        const style = this.file.bookmarked ? 'fas' : 'fal';
        this.$bookmark.classList.toggle('active', state);
        this.$bookmarkIcon.setStyle(style);
    }

    onSave(saveCB) {
        this.onSaveCB = saveCB;
    }

    saveFile() {
        // Save Body
        this.comm.do('editors-body-save', [this.file.id, this.body]);
        // Save File In Lookup
        this.comm.do('file-add', [{
            id: this.file.id,
            name: this.$title.value,
            bookmarked: false,
            icon: 'bookmark'
        }])
        // Destroy unsaved editor
        this.destroy();
        this.removeEditor();
    }

    // Active / Deactive

    hide() {
        this.$container.style.display = 'none';
    }

    show() {
        this.$container.style.removeProperty('display');
    }

    // Title Methods

    changeTitle(title) {
        this.file.title = title;
        this.$title.value = title;
    }

    saveTitle() {
        this.title = this.$title.value;
        if(this.onTitleSave) this.onTitleSave(this.title);
    }

    // Body Methods

    changeBody(body) {
        this.body = body;
        this.$editor.innerHTML = body;
    }

    saveBody() {
        this.body = this.$editor.innerHTML;
        if(this.onBodySave) this.onBodySave(this.body);
    }

    destroy() {
        this.$container.remove();
    }

    bookmarkFile() {
        this.file.bookmarked = !this.file.bookmarked;
        this.comm.do('file-refresh');
        this.setBookmarked(this.file.bookmarked);
    }

}