export default class CSSReloader {

    constructor(interval = 4000) {
        this.interval = interval;
        this.timer = null;
        this.isEnabled = false;
    }

    reloadCSS() {
        const links = document.getElementsByTagName("link");
        for (let i = 0; i < links.length; i++) {
            if (links[i].rel === "stylesheet") {
                const href = links[i].href.replace(/[?&]v=\d+/g, '');
                const separator = href.includes('?') ? '&' : '?';
                links[i].href = href + separator + "v=" + Date.now();
            }
        }
    }

    start() {
        if (!this.isEnabled) {
            this.reloadCSS();
            this.timer = setInterval(() => {
                this.reloadCSS();
            }, this.interval);
            this.isEnabled = true;
        }
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            this.isEnabled = false;
        }
    }

    setInterval(newInterval) {
        this.interval = newInterval;
        if (this.isEnabled) {
            this.stop();
            this.start();
        }
    }
}
