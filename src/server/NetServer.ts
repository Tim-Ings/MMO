import { Server } from 'socket.io';
import WorldManager from './managers/WorldManager';
import Client from './models/Client';

const env = {
    clientUrl: process.env.CLIENT_URL as string,
};

export default class NetServer {
    private static server: Server;
    private static world: WorldManager;
    private static clients: Map<string, Client> = new Map();

    public static init(port: number = 3000, tickRate: number = 0.6): void {
        this.server = new Server({
            cors: {
                origin: env.clientUrl,
                methods: ['GET', 'POST'],
                credentials: true,
            },
        }).listen(port);
        this.world = new WorldManager(tickRate, this.server);
        this.server.on('connection', (socket) => {
            console.log('Handling a new connection:', socket.id);
            const client = new Client(socket, this.world);
            this.clients.set(client.id, client);
        });
    }
}
