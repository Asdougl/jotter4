const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const FaIcon = require('./Fontawesomeicon');
const { areYouSure } = require('./Assets')

const comm = require('./Communication');

/*  FileController Class
==============================

controls the Files/Explorer UI alongside managing active folders and files

*/
module.exports = class FileController {

    constructor() {

        // Init Communication Layer
        this.comm = comm;
        this.comm.register('file-add', (file) => this.addFile(file));
        this.comm.register('file-dir', () => this.path);
        this.comm.register('file-get', (id) => this.lookup.files.find(file => file.id == id));
        this.comm.register('file-refresh', () => this.renderExplorer());
        this.comm.register('file-update-time', (id) => this.updateTime(id));
        this.comm.register('file-update-icon', (id, icon) => this.setIcon(id, icon))
        this.comm.register('file-delete', (id) => this.deleteFile(id));
        // this.comm.register('file-load', (file))

        // UI Elements
        this.$path = document.querySelector('#explorer .current-path');
        this.$folders = document.querySelector('#explorer .folders');
        this.$files = document.querySelector('#explorer .files');
        this.$newFile = document.querySelector('#explorer .new-file');
        this.$newFolder = document.querySelector('#explorer .new-folder');
        this.$newFolderContainer = document.querySelector('#explorer .new-folder-field');
        this.$newFolderField = document.querySelector('#explorer .new-folder-field input');
        this.$newFolderBtn = document.querySelector('#explorer .new-folder-field button');

        // Controllers
        // this.editor = editor;
        // this.nav = nav;

        // Data Index
        this.lookup = {};           // Stores All Lookup Data
        this.path = [];             // Stores trace of folder path
        this.cdir = { id: null };   // stores lookup entry of curr folder
        this.active = [];           // stores files of curr dir
        this.activeFolders = [];    // stores folders of curr dir

        fs.access('./data', (err) => {
            if (err) {
                // Does Not Exist - make it.
                fs.mkdir('./data', () => {
                    this.fetchLookup();
                });
            } else {
                this.fetchLookup();
            }
        });

        // Init New File & Folder actions
        this.$newFile.addEventListener('click', () => {
            this.comm.do('editor-add');
            this.comm.do('nav-desc', ['editor']);
        })
        this.$newFolder.addEventListener('click', () => {
            this.$newFolderContainer.classList.toggle('active');
        })
        this.$newFolderBtn.addEventListener('click', () => {
            const name = this.$newFolderField.value;
            this.addFolder(name);
            this.$newFolderField.value = '';
            this.$newFolderContainer.classList.remove('active');
        })

    }

    fetchLookup() {
        fs.readFile('./data/lookup.json', 'utf8', (err, data) => {
            if (!err) {
                // Successful;
                this.lookup = data ? JSON.parse(data) : this.newLookup();
                this.renderExplorer();
            } else {
                // Some Error
                console.warn({ error: err });
                fs.writeFileSync('./data/lookup.json', '');
                this.fetchLookup();
            }
        })
    }

    saveLookup() {
        fs.writeFile(
            './data/lookup.json', 
            JSON.stringify(this.lookup), 
            (err) => {
                if(err) console.log(err);
            }
        )
    }

    newLookup() {
        return {
            folders:[],
            files:[]
        }
    }

    addFile(file) {
        file.folder = this.cdir.id;
        const now = moment().format();
        file.created = now;
        file.edited = now;
        this.lookup.files.push(file);
        this.saveLookup();
        this.renderExplorer();
        this.active.find(entry => entry.file.id == file.id).open();
    }

    deleteFile(id) {
        const index = this.lookup.files.findIndex(file => file.id == id);
        this.lookup.files.splice(index, 1);
        this.comm.do('editors-body-delete', [id]);
        this.saveLookup();
        this.renderExplorer();
    }

    addFolder(name) {
        this.lookup.folders.push({
            id: uuidv4(),
            name,
            parent: this.cdir.id
        });
        this.saveLookup();
        this.renderExplorer();
    }

    // ascend() -- ascend the file structure
    ascend(id) {
        if(id === null) {
            // The Ascend ID is Root
            this.path = [];
            this.cdir = {id:null};
            
        } else if(id !== undefined) {
            // The Ascend ID has been specified
            for(let i = this.path.length - 1; i >= 0; i--) {
                if(this.path[i].id == id) {
                    this.cdir = this.lookup.folders.find(folder => folder.id == id); 
                    break;
                } else {
                    this.path.pop();
                }
            }

            if(this.path.length == 0) {
                // We've popped everything out, resort to root
                this.cdir = {id:null};
            }
        } else {
            // No Id Specifed, lazy ascent
            const parent = this.cdir.parent;
            if (parent) {
                // Not Root Folder
                this.cdir = this.lookup.folders.find(folder => folder.id == parent);
            } else {
                // Parent is Root
                this.cdir = { id: null };
            }

            this.path.pop();
        }

        this.renderExplorer();

    }

    // descend(id) -- descend the file structure, given an id
    descend(id) {
        this.cdir = this.lookup.folders.find(folder => folder.id == id);
        this.path.push({id: this.cdir.id, name: this.cdir.name});

        this.renderExplorer();
    }

    renderExplorer() {
        
        // Render Path
        this.$path.innerHTML = '';
        const pathItems = document.createElement('div');
        pathItems.classList.add('path-items');

        let rootPath = document.createElement('div');
        rootPath.classList.add('item');
        rootPath.innerText = 'Home';
        rootPath.addEventListener('click', () => this.ascend(null));
        pathItems.append(rootPath);
        this.path.forEach(path => {
            const loc = document.createElement('div');
            loc.classList.add('item');
            loc.innerText = path.name;
            loc.addEventListener('click', () => this.ascend(path.id));
            pathItems.append(loc);
        })
        this.$path.append(pathItems);

        if(this.path.length && this.cdir.id != null) {

            const delbtn = areYouSure('Delete', () => this.deleteCurDir(), 'Empty Folder before Deletion');
            const name = document.createElement('div');
            name.classList.add('name');
            const nameInput = document.createElement('input');
            nameInput.value = this.cdir.name;
            const nameInputBtn = document.createElement('button');
            nameInputBtn.append(FaIcon('save', 'fal').element);
            nameInputBtn.addEventListener('click', () => {
                this.cdir.name = nameInput.value;
                this.path[this.path.length - 1].name = this.cdir.name;
                this.saveLookup();
                this.renderExplorer();
            })
            name.append(nameInput, nameInputBtn)

            // Create Container
            const pathConfig = document.createElement('div');
            pathConfig.classList.add('path-config');
            pathConfig.append(name, delbtn);

            const pathEdit = document.createElement('div');
            pathEdit.classList.add('path-edit');
            pathEdit.append(FaIcon('cog', 'fal').element);
            pathEdit.addEventListener('click', () => {
                pathConfig.classList.toggle('show');
                nameInput.focus();
            })

            this.$path.append(pathEdit, pathConfig);
        }

        // Render Folders
        const folders = this.lookup.folders.filter(folder => folder.parent == this.cdir.id);
        this.$folders.innerHTML = '';
        folders.forEach(folder => {
            const li = document.createElement('li');
            li.innerHTML = FaIcon('folder', 'fal').string() + ' ' + folder.name;
            li.addEventListener('click', () => this.descend(folder.id));
            this.$folders.append(li);
        }) 
        this.activeFolders = folders;

        // === Render Files ===

        let files = this.lookup.files.filter(file => file.folder == this.cdir.id);
        files.sort((a, b) => {
            const ma = moment(a.edited), mb = moment(b.edited);
            if(ma.isBefore(mb)) {
                return 1;
            }
            if(ma.isAfter(mb)) {
                return -1;
            }
            return 0;
        });
        this.active = [];
        this.$files.innerHTML = '';
        files.forEach(file => {
            const listItem = this.fileLi(file);
            const open = () => {
                this.comm.do('editor-add', [file, (title) => {
                    listItem.name.innerText = title;
                    // file.name = title;
                    this.updateTime(file.id);
                    // file.edited = moment().format();
                    // this.saveLookup();
                    // // this.sortExplorer();
                }])
                this.comm.do('nav-desc', ['editor']);
            };
            // Open in Editor...
            listItem.name.addEventListener('click', open);
            this.active.push({ file, listItem, open });
            this.$files.append(listItem.li);
        })

    }

    fileLi(file) {
        // Li Parent
        const li = document.createElement('li');
        li.classList.add('file');

        // Bookmark Icon/Button
        const bookmark = FaIcon(file.icon || 'bookmark', file.bookmarked ? 'fas' : 'fal').element;
        bookmark.addEventListener('click', () => {
            this.bookmark(file.id);
        });
        if(file.bookmarked) bookmark.classList.add('active');

        // File name
        const name = document.createElement('div');
        name.innerText = file.name;

        // File Actions
        const actions = document.createElement('div');
        const metaBtn = FaIcon('info-circle', 'fal').element;
        metaBtn.addEventListener('click', () => {
            // Open Meta Window
            this.comm.do('meta-set', [file]);
        })
        actions.classList.add('actions');
        actions.append(metaBtn);

        // Wrap it up
        li.append(bookmark, name, actions);
        return {
            li,
            bookmark,
            name,
            meta: metaBtn,
        };
    }

    bookmark(id, state) {
        // const file = this.lookup.files.find(f => f.id == id);
        // if(file) {
        //     file.bookmarked = state || !file.bookmarked;
        //     this.saveLookup();
        //     this.renderExplorer();
        // }
        this.renderExplorer();
    }

    setIcon(id, icon) {
        const file = this.lookup.files.find(f => f.id == id);
        if(file) {
            file.icon = icon || 'bookmark';
            this.saveLookup();
            this.renderExplorer();
        }
    }

    updateTime(id) {
        const file = this.lookup.files.find(f => f.id == id);
        if (file) {
            file.edited = moment().format();
            this.saveLookup();
            // this.sortExplorer();
            // Find this file and bring to top of explorer
            const active = this.active.find(f => f.file.id == id);
            if(active) {
                const li = active.listItem.li;
                this.$files.prepend(li);
            }
        }
    }

    sortExplorer() {
        this.active.sort((a, b) => {
            const ma = moment(a.file.edited), mb = moment(b.file.edited);
            if (ma.isBefore(mb)) {
                return 1;
            }
            if (ma.isAfter(mb)) {
                return -1;
            }
            return 0;
        })
        this.active.forEach(file => {
            this.$files.append(file.listItem.li);
        })
    }

    deleteCurDir() {
        if(this.active.length == 0 && this.activeFolders.length == 0 && this.cdir.id != null) {
            // It's an empty directory so I'll allow it
            const parent = this.path[this.path.length - 2];
            const dirIndex = this.lookup.folders.indexOf(folder => folder.id == this.cdir.id);
            this.lookup.folders.splice(dirIndex, 1);
            this.saveLookup();
            if(parent) {
                this.ascend(parent.id);
            } else {
                this.ascend(null);
            }
            return true;
        } else {
            return false;
        }
    }

}