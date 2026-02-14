export default class SocketService {

    constructor() {

        const socketPath = window.location.pathname.startsWith("/doco") 
            ? "/doco/socket.io" 
            : "/socket.io";

        this.socket = io({
            path: socketPath,
            transports: ["websocket"]
        });
    }

    on(event, callback) {
        this.socket.on(event, callback);
    }

    emit(event, data) {
        this.socket.emit(event, data);
    }

    disconnect() {
        this.socket.disconnect();
    }
}