const { createNewInstance, removeInstance, instances } = require('../../baileys');
const db = require('../../db');
const fs = require('fs');
const path = require('path');

// Caminho base para as pastas de sessões
const sessionsBasePath = path.join(__dirname, '../../sessions');

// Criar uma nova instância e iniciá-la automaticamente
async function createInstance(req, res) {
    const { udid } = req.body;

    if (!udid) {
        return res.status(400).send({ message: 'UDID is required' });
    }

    try {
        const sessionPath = `sessions/${udid}`;

        // Verificar se a instância já existe
        const result = await db.query('SELECT * FROM instances WHERE udid = $1', [udid]);
        const instance = result.rows[0];

        if (instance) {
            return res.status(400).send({ message: 'Instance already exists', instance });
        }

        // Apagar a pasta de sessão, se existir
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log(`Session folder for instance ${udid} deleted.`);
        } else {
            console.log(`No session folder found for instance ${udid}.`);
        }

        // Inserir a nova instância no banco com valores iniciais
        await db.query(
            `
            INSERT INTO instances (udid, phone_number, status, qr_code, name, profile_picture) 
            VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [udid, null, 'disconnected', null, null, null]
        );

        // Iniciar a instância automaticamente
        createNewInstance(udid);

        res.status(201).send({ message: 'Instance created and started', udid });
    } catch (error) {
        console.error('Error creating instance:', error);
        res.status(500).send({ message: 'Failed to create instance', error: error.message });
    }
}


// Função para deletar uma instância e sua pasta de sessão
async function deleteInstance(req, res) {
    const { id } = req.params;

    try {
        // Verificar se a instância existe
        const result = await db.query('SELECT * FROM instances WHERE udid = $1', [id]);
        const instance = result.rows[0];

        if (!instance) {
            return res.status(404).send({ message: 'Instance not found' });
        }

        // Verificar se a instância está ativa
        if (instances[id]) {
            try {
                if (instances[id].state?.connection === 'open') {
                    await instances[id].logout(); // Desconectar o número
                    console.log(`Instance ${id} logged out.`);
                } else {
                    console.warn(`Instance ${id} is already disconnected.`);
                }
            } catch (error) {
                console.warn(`Error during logout for instance ${id}:`, error.message);
            }

            // Garantir que a instância seja removida
            removeInstance(id);
        }

        // Caminho para a pasta da sessão
        const sessionPath = path.join(sessionsBasePath, id);

        // Verificar e remover a pasta da sessão
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log(`Session folder for instance ${id} deleted.`);
        } else {
            console.log(`Session folder for instance ${id} not found.`);
        }

        // Remover a instância do banco de dados
        await db.query('DELETE FROM instances WHERE udid = $1', [id]);

        res.status(200).send({ message: 'Instance deleted and stopped, session folder removed' });
    } catch (error) {
        console.error('Error deleting instance:', error);
        res.status(500).send({ message: 'Failed to delete instance', error: error.message });
    }
}



// Listar todas as instâncias
async function listInstances(req, res) {
    // console.log('[API REQUEST]: GET /api/instances');
    // console.log('[HEADERS]:', req.headers);

    try {
        console.log('Fetching instances from database...');
        const result = await db.query('SELECT * FROM instances');
        console.log(`Database returned ${result.rows.length} rows.`);

        res.status(200).send(result.rows);
    } catch (error) {
        console.error('Error listing instances:', error.message);
        res.status(500).send({ message: 'Failed to list instances', error: error.message });
    }
}


// Obter o QR Code de uma instância
async function getQRCode(req, res) {
    const { id } = req.params;

    try {
        const result = await db.query(
            'SELECT qr_code, status, phone_number, name, profile_picture FROM instances WHERE udid = $1',
            [id]
        );
        const instance = result.rows[0];

        if (!instance) {
            return res.status(404).send({ message: 'Instance not found' });
        }

        res.status(200).send({
            qr_code: instance.qr_code,
            status: instance.status,
            phone_number: instance.phone_number,
            name: instance.name,
            profile_picture: instance.profile_picture,
        });
    } catch (error) {
        console.error('Error fetching QR Code:', error);
        res.status(500).send({ message: 'Failed to fetch QR Code', error: error.message });
    }
}

// Atualizar o webhook de uma instância
async function updateWebhook(req, res) {
    const { id } = req.params;
    const { webhook } = req.body;

    try {
        // Verificar se a instância existe
        const result = await db.query('SELECT * FROM instances WHERE udid = $1', [id]);
        const instance = result.rows[0];

        if (!instance) {
            return res.status(404).send({ message: 'Instance not found' });
        }

        if (!webhook) {
            // Apagar o webhook, se não for enviado
            await db.query('UPDATE instances SET webhook = NULL, updated_at = NOW() WHERE udid = $1', [id]);
            return res.status(200).send({ message: 'Webhook removed successfully' });
        }

        // Atualizar o webhook no banco de dados
        await db.query('UPDATE instances SET webhook = $1, updated_at = NOW() WHERE udid = $2', [webhook, id]);

        res.status(200).send({ message: 'Webhook updated successfully' });
    } catch (error) {
        console.error('Error updating webhook:', error);
        res.status(500).send({ message: 'Failed to update webhook', error: error.message });
    }
}

// Desconectar e reiniciar uma instância
async function disconnectInstance(req, res) {
    const { id } = req.params;

    try {
        // Verificar se a instância existe no banco de dados
        const result = await db.query('SELECT * FROM instances WHERE udid = $1', [id]);
        const instance = result.rows[0];

        if (!instance) {
            return res.status(404).send({ message: 'Instance not found' });
        }

        // Deslogar e parar a instância ativa
        if (instances[id]) {
            await instances[id].logout(); // Desconectar o número
            console.log(`Instance ${id} logged out.`);
        }

        if (removeInstance(id)) {
            console.log(`Instance ${id} stopped.`);
        } else {
            console.warn(`Instance ${id} was not active.`);
        }

        // Apagar os dados da sessão
        const sessionPath = path.join(__dirname, '../../../sessions', id);
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log(`Session data for instance ${id} removed.`);
        } else {
            console.log(`No session data found for instance ${id}.`);
        }

        // Atualizar o status no banco e zerar o phone_number
        await db.query(
            'UPDATE instances SET status = $1, phone_number = NULL, updated_at = NOW() WHERE udid = $2',
            ['disconnected', id]
        );

        // Reiniciar a instância
        createNewInstance(id);
        console.log(`Instance ${id} restarted.`);

        res.status(200).send({ message: 'Instance disconnected and restarted' });
    } catch (error) {
        console.error('Error disconnecting instance:', error);
        res.status(500).send({ message: 'Failed to disconnect instance', error: error.message });
    }
}




module.exports = {
    createInstance,
    deleteInstance,
    listInstances,
    updateWebhook,
    getQRCode,
    disconnectInstance,
};
