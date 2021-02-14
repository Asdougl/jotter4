const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Editor = require('./Editor');

const comm = require('./Communication');

/*  EditorController Class
===============================

controls editors, tabs and open files

*/
module.exports = class EditorController {

    constructor() {

        // Init Communicaiton Layer
        this.comm = comm;
        this.comm.register('editors-body-save', (id, body) => this.saveBodySync(id, body));
        this.comm.register('editors-body-delete', (id) => this.deleteBody(id));
        this.comm.register('editors-count', () => this.editors.length);

        // Set Up Open Channels
        comm.register('editor-add', (file, cb) => this.addEditor(file, cb));

        // UI Elements
        this.$tabs = document.querySelector('#editor .editor-tabs');
        this.$editors = document.querySelector('#editor .editors');

        // Data
        this.editors = [];

        fs.access('./data/files', (err) => {
            if(err) {
                fs.mkdir('./data', (err) => {
                    console.log(err.message);
                });
            }
        })

    }

    addEditor(file, titleChangeCB) {

        if(file) {

            // Check if it is already open...
            const editor = this.editors.find(editor => editor.file && editor.file.id == file.id);

            if(editor) {
                // Already Exists, focus it!
                this.focus(file.id);
                return;
            }

            fs.readFile(`./data/files/${file.id}.txt`, 'utf8', (err, data) => {
                if(err) {
                    // File Doesn't exist, make it!
                    fs.writeFileSync(`./data/files/${file.id}.txt`, '');
                    data = '';
                }
                const editorid = uuidv4();
                const tab = this.newTab(editorid, file.name);
                this.editors.push({
                    id: editorid,
                    file,
                    tab,
                    editor: new Editor(
                        file,
                        data || '',
                        {
                            remove: () => this.removeEditor(editorid),
                            titleSave: (title) => {
                                titleChangeCB(title);
                                tab.innerText = title;
                            },
                            bodySave: (body) => this.saveBody(file.id, body),
                        }
                    )
                });
                this.focusByEditor(editorid);
                this.toggleTabs();
            });
        } else {
            const editorid = uuidv4();

            this.editors.push({
                id: editorid,
                file: null,
                tab: this.newTab(editorid),
                editor: new Editor(
                    { id: null, name: '', bookmarked: false },
                    '',
                    { remove: () => this.removeEditor(editorid) }
                )
            });
            this.focusByEditor(editorid);
            this.toggleTabs();
        }

        

    }

    newTab(editorid, filename) {
        const li = document.createElement('li');
        li.innerText = filename || '*Untitled';
        li.addEventListener('click', (e) => {
            if (e.target == li) this.focusByEditor(editorid);
        })
        if(filename === undefined) li.classList.add('unsaved');

        // Close Button
        const close = document.createElement('span');
        close.classList.add('tab-close');
        close.innerHTML = '&times;';
        close.addEventListener('click', (e) => {
            // The focus event above is firing when this is hit.
            this.removeEditor(editorid);
        })
        li.append(close);

        this.$tabs.append(li);
        return li;
    }

    saveBody(id, body) {
        fs.writeFile(`./data/files/${id}.txt`, body, (err) => {
            if(err) console.log(err);
            this.comm.do('file-update-time', [id])
        })
    }

    deleteBody(id) {
        // Check It isn't open in any editors...
        const editor = this.editors.find(e => e.file.id == id);
        if(editor) this.removeEditor(editor.id);
        
        fs.unlink(`./data/files/${id}.txt`, (err) => {
            if(err) console.error(err);
        })
    }

    saveBodySync(id, body) {
        fs.writeFileSync(`./data/files/${id}.txt`, body);
        // Now delete the tab!
    }

    focusByEditor(eid) {
        this.editors.forEach(editor => {
            if(editor.id == eid) {
                editor.editor.show();
                editor.tab.classList.add('active');
            } else {
                editor.editor.hide();
                editor.tab.classList.remove('active');
            }
        })
    }

    focus(id) {
        this.editors.forEach(editor => {
            if(editor.file && editor.file.id == id) {
                editor.editor.show();
                editor.tab.classList.add('active');
            } else {
                editor.editor.hide();
                editor.tab.classList.remove('active');
            }
        })
    }

    removeEditor(eid) {
        const index = this.editors.findIndex(editor => editor.id == eid);
        if (index > -1) {
            // We got em.
            this.editors[index].editor.destroy();
            this.editors[index].tab.remove();
            if(this.editors[index].file) {
                this.comm.cleanup(`editor-${this.editors[index].file.id}-icon`);
            }
            this.editors.splice(index, 1);

            // Set Focus Tab
            if(index < this.editors.length) {
                // There are more tabs to the right
                this.focusByEditor(this.editors[index].id);
            } else if(index > 0) {
                // There are more tabs to the left
                this.focusByEditor(this.editors[index - 1].id);
            }
        }
        this.toggleTabs();
    }

    toggleTabs() {
        this.$tabs.classList.toggle('active', this.editors.length > 1);
    }

}