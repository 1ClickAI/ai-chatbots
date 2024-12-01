const {
    makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const db = require('../db');
const fs = require('fs');
const HttpsProxyAgent = require('https-proxy-agent');
require('dotenv').config(); // Carregar as variáveis do .env
const pino = require('pino'); // Biblioteca para logs
const axios = require('axios');

let fetch;

(async () => {
    fetch = (await import('node-fetch')).default;
})();


const instances = {};

// Verificar se as configurações de proxy estão completas no .env
const proxyHost = process.env.PROXY_HOST;
const proxyPort = process.env.PROXY_PORT;
const proxyProtocol = process.env.PROXY_PROTOCOL;
const proxyUsername = process.env.PROXY_USERNAME;
const proxyPassword = process.env.PROXY_PASSWORD;
const logLevel = process.env.LOG_LEVEL || 'info'; // Padrão é 'info'

let proxyAgent = null;

async function createNewInstance(id) {
    const sessionPath = `sessions/${id}`;

    // Criar pasta de sessões se não existir
    if (!fs.existsSync('sessions')) {
        fs.mkdirSync('sessions');
    }

    // Configurar o estado de autenticação para a instância
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log('========================================');
    console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);
    console.log(`1CLICK WP INSTANCE: ${id}`);
    console.log('========================================');

    const sock = makeWASocket({
        logger: pino({ level: logLevel }), // Usa o nível de log do .env
        agent: proxyAgent, // Configurar o proxy, se disponível
        printQRInTerminal: true,
        auth: state,
        browser: ['Linux', 'Chrome', 'latest'],
    });

    instances[id] = sock;

    // Monitorar atualizações de conexão
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log(`QR Code for instance ${id}: ${qr}`);
            try {
                // Salvar QR Code no banco de dados
                await db.query(
                    'UPDATE instances SET qr_code = $1, updated_at = NOW() WHERE udid = $2',
                    [qr, id]
                );
            } catch (error) {
                console.error('Error saving QR Code to database:', error);
            }
        }

        if (connection === 'open') {
            console.log(`Instance ${id} connected.`);

            try {
                // Extraindo o número do WhatsApp conectado
                let numero = null;
                let nome = null;
                let imagemBase64 = null;

                if (sock?.user?.id) {
                    numero = sock.user.id.split(':')[0]; // Extraindo o número antes de ":"
                }

                // Obtendo o nome do usuário conectado (se disponível)
                if (sock?.user?.name) {
                    nome = sock.user.name;
                }

                // Buscando a URL da imagem do perfil
                const imageUrl = await sock.profilePictureUrl(sock.user.id, 'image').catch(() => null);

                if (imageUrl) {
                    try {
                        // Baixar a imagem do perfil usando fetch
                        const response = await fetch(imageUrl);

                        if (response.ok) {
                            // Converter para buffer e para base64
                            const arrayBuffer = await response.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);
                            imagemBase64 = buffer.toString('base64');
                        } else {
                            console.error(`Failed to fetch profile picture: ${response.statusText}`);
                        }
                    } catch (error) {
                        console.error('Error fetching profile picture:', error);
                    }
                }

                // Atualizar o banco de dados com as informações
                await db.query(
                    'UPDATE instances SET phone_number = $1, qr_code = NULL, name = $2, profile_picture = $3, status = $4, updated_at = NOW() WHERE udid = $5',
                    [numero, nome, imagemBase64, 'connected', id]
                );

                console.log(`Phone number, name, and profile picture updated for instance ${id}.`);
            } catch (error) {
                console.error('Error updating phone number, name, or profile picture in database:', error);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : false;

            console.log('Connection closed due to', lastDisconnect?.error, ', reconnecting:', shouldReconnect);

            if (shouldReconnect) {
                // Reconectar automaticamente
                createNewInstance(id);
            } else {
                // Atualizar status como desconectado no banco
                try {
                    await db.query(
                        'UPDATE instances SET status = $1, updated_at = NOW() WHERE udid = $2',
                        ['disconnected', id]
                    );
                } catch (error) {
                    console.error('Error updating disconnection status:', error);
                }
            }
        }
    });


    // Envio para o webhook (dentro do evento messages.upsert)
    sock.ev.on('messages.upsert', async (m) => {
        console.log('New message:', m);

        const message = m.messages[0];
        const user = message.key.remoteJid;
        const content = message.message?.conversation || message.message?.extendedTextMessage?.text;

        console.log(`Message from ${user}: ${content}`);

        try {
            // Buscar webhook configurado no banco
            const result = await db.query('SELECT webhook FROM instances WHERE udid = $1', [id]);
            const instance = result.rows[0];

            if (instance?.webhook) {
                // Enviar mensagem ao webhook usando axios
                await axios.post(instance.webhook, {
                    user,
                    message: content,
                });
                console.log(`Message sent to webhook: ${instance.webhook}`);
            } else {
                console.log(`No webhook configured for instance ${id}`);
            }
        } catch (error) {
            console.error('Error sending message to webhook:', error.message);
        }
    });


    sock.ev.on('creds.update', saveCreds);

    return sock;
}

async function initializeAllInstances() {
    try {
        // Buscar todas as instâncias do banco de dados
        const result = await db.query('SELECT udid FROM instances');
        const instancesFromDB = result.rows;

        // Iniciar cada instância automaticamente
        for (const instance of instancesFromDB) {
            const { udid } = instance;
            if (!instances[udid]) {
                console.log(`Initializing instance: ${udid}`);
                await createNewInstance(udid);
            }
        }
    } catch (error) {
        console.error('Error initializing instances:', error);
    }
}

function removeInstance(id) {
    if (instances[id]) {
        // Desconectar antes de encerrar a instância
        instances[id].logout().then(() => {
            console.log(`Instance ${id} logged out successfully.`);
        }).catch((err) => {
            console.error(`Error logging out instance ${id}:`, err);
        }).finally(() => {
            instances[id].end(); // Encerrar a instância
            delete instances[id];
            console.log(`Instance ${id} removed.`);
        });
    } else {
        console.log(`Instance ${id} not found.`);
    }
}


module.exports = { createNewInstance, removeInstance, initializeAllInstances, instances };
