module.exports = {
    areYouSure(text, action, errMsg) {
        // Button
        const button = document.createElement('button');
        button.classList.add('are-you-sure');
        button.innerText = text;

        let timeout = null;
        const timeoutCancel = () => {
            clearTimeout(timeout);
            document.removeEventListener('mouseup', timeoutCancel);
            button.classList.remove('making-sure');
        }

        const clickStart = () => {
            // Start the Timer
            button.classList.add('making-sure');
            timeout = setTimeout(() => {
                button.classList.remove('making-sure');
                document.removeEventListener('mouseup', timeoutCancel);
                const result = action();
                if (result === false) {
                    button.innerText = errMsg;
                    button.classList.add('error');
                    button.removeEventListener('mousedown', clickStart);
                }
            }, 3000);
            document.addEventListener('mouseup', timeoutCancel);
        }

        button.addEventListener('mousedown', clickStart);

        return button;
    },
}