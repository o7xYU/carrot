/**
 * Carrot extension backend API for SillyTavern.
 *
 * 用法（在 SillyTavern 后端中挂载该 router）：
 *   app.use('/api/plugins/carrot/settings', router)
 *
 * 接口：
 *   GET /api/plugins/carrot/settings?file=settings.json
 *   PUT /api/plugins/carrot/settings?file=settings.json
 */

const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');

const router = express.Router();

const DATA_VERSION = 1;
const DEFAULT_FILE_NAME = 'settings.json';

function buildDefaultState() {
    return {
        version: DATA_VERSION,
        updatedAt: new Date().toISOString(),
        records: {},
    };
}

function sanitizeFileName(input) {
    const raw = String(input || DEFAULT_FILE_NAME).trim() || DEFAULT_FILE_NAME;
    const base = path.basename(raw);
    return base.endsWith('.json') ? base : `${base}.json`;
}

function resolveCarrotDir() {
    // 约定：此 server.js 位于 carrot 扩展根目录
    return __dirname;
}

async function ensureFile(filePath) {
    try {
        await fs.access(filePath);
    } catch {
        await fs.writeFile(filePath, JSON.stringify(buildDefaultState(), null, 2), 'utf8');
    }
}

router.get('/', async (req, res) => {
    try {
        const fileName = sanitizeFileName(req.query.file);
        const carrotDir = resolveCarrotDir();
        const filePath = path.join(carrotDir, fileName);

        await ensureFile(filePath);
        const raw = await fs.readFile(filePath, 'utf8');
        if (!raw.trim()) {
            const fallback = buildDefaultState();
            await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), 'utf8');
            return res.json(fallback);
        }

        try {
            const parsed = JSON.parse(raw);
            return res.json(parsed);
        } catch {
            const fallback = buildDefaultState();
            await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), 'utf8');
            return res.json(fallback);
        }
    } catch (error) {
        console.error('[carrot] read settings failed', error);
        return res.status(500).json({ error: String(error?.message || error) });
    }
});

router.put('/', express.json({ limit: '2mb' }), async (req, res) => {
    try {
        const fileName = sanitizeFileName(req.query.file);
        const carrotDir = resolveCarrotDir();
        const filePath = path.join(carrotDir, fileName);

        const payload = req.body;
        if (!payload || typeof payload !== 'object') {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const normalized = {
            version: Number(payload.version) || DATA_VERSION,
            updatedAt: payload.updatedAt || new Date().toISOString(),
            records:
                payload.records && typeof payload.records === 'object' && !Array.isArray(payload.records)
                    ? payload.records
                    : {},
        };

        await fs.writeFile(filePath, JSON.stringify(normalized, null, 2), 'utf8');
        return res.json({ ok: true, file: fileName });
    } catch (error) {
        console.error('[carrot] write settings failed', error);
        return res.status(500).json({ error: String(error?.message || error) });
    }
});

module.exports = { router };
