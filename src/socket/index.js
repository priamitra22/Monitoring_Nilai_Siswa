import { Server } from 'socket.io'

let io

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true
        }
    })

    io.on('connection', (socket) => {
        socket.on('join_room', (room) => {
            socket.join(room)
        })

        socket.on('disconnect', () => {
        })
    })

    return io
}

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!')
    }
    return io
}
