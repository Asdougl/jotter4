const Communication = require('./js/Communication');

const NavController =  require('./js/NavController');
const TitleBarConttroller = require('./js/TitlebarController');
const EditorController = require('./js/EditorController');
const FileController = require('./js/FileController');
const MetaController = require('./js/MetaController')

const j4 = () => {
    
    const titlebar = new TitleBarConttroller();
    const nav = new NavController();
    const editor = new EditorController();
    const files = new FileController();
    const meta = new MetaController();

}

j4();