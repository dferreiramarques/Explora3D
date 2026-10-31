const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db');
const { normalizeCode, isValidPin } = require('../codes');
const asyncHandler = require('../asyncHandler');
const { validApp, validProject } = require('../projectFormats');

const router = express.Router();

// Aluno entra numa sala: encontra a submissão existente (nome+pin) ou cria uma nova.
router.post('/join', asyncHandler(async (req, res) => {
  const { classroom_code, student_name, student_pin } = req.body || {};
  const appId = (req.body || {}).app_id || 'volume';
  if (!validApp(appId)) return res.status(400).json({ error: 'Secção inválida.' });
  const code = normalizeCode(classroom_code);
  const name = String(student_name || '').trim();
  const pin = String(student_pin || '').trim();

  if (!code) return res.status(400).json({ error: 'Indica o código da sala.' });
  if (!name) return res.status(400).json({ error: 'Indica o teu nome.' });
  if (!isValidPin(pin)) return res.status(400).json({ error: 'O código pessoal tem de ter 4 números.' });

  const { rows: activityRows } = await pool.query(
    'SELECT id, title, brief, app_id FROM activities WHERE classroom_code=$1',
    [code]
  );
  const activity = activityRows[0];
  if (!activity) return res.status(404).json({ error: 'Código de sala não encontrado.' });
  if (activity.app_id !== appId) return res.status(409).json({ error: 'Esta atividade pertence à secção ' + activity.app_id + '. Abre essa secção para entrar.' });

  const { rows: existingRows } = await pool.query(
    `SELECT id, shapes_json, project_json, submitted_at FROM submissions
     WHERE activity_id=$1 AND lower(student_name)=lower($2) AND student_pin=$3`,
    [activity.id, name, pin]
  );

  let submission = existingRows[0];
  if (!submission) {
    const id = crypto.randomUUID();
    const { rows } = await pool.query(
      `INSERT INTO submissions (id, activity_id, student_name, student_pin)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (activity_id, lower(student_name), student_pin)
       DO UPDATE SET student_name=EXCLUDED.student_name
       RETURNING id, shapes_json, project_json, submitted_at`,
      [id, activity.id, name, pin]
    );
    submission = rows[0];
  }

  res.json({
    submission_id: submission.id,
    shapes_json: submission.shapes_json,
    project_json: submission.project_json,
    submitted_at: submission.submitted_at,
    activity: { title: activity.title, brief: activity.brief, app_id: activity.app_id }
  });
}));

// Autosave do aluno — o id da submissão funciona como capability token.
router.put('/:id', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT a.app_id FROM submissions s JOIN activities a ON a.id=s.activity_id WHERE s.id=$1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Submissão não encontrada.' });
  if (rows[0].app_id !== 'volume' || req.body?.project_json) {
    const { project_json, submit } = req.body || {};
    if (!validProject(rows[0].app_id, project_json)) return res.status(400).json({ error: 'Formato de projeto inválido para esta secção.' });
    await pool.query(`UPDATE submissions SET project_json=$1, updated_at=now(),
      shapes_json=CASE WHEN $4 THEN $1->'data' ELSE shapes_json END,
      submitted_project_json=CASE WHEN $2 THEN $1 ELSE submitted_project_json END,
      submitted_at=CASE WHEN $2 THEN now() ELSE submitted_at END WHERE id=$3`, [project_json, submit === true, req.params.id, rows[0].app_id === 'volume']);
    return res.json({ ok: true, submitted: submit === true });
  }
  const { shapes_json } = req.body || {};
  if (!shapes_json || !Array.isArray(shapes_json.shapes)) {
    return res.status(400).json({ error: 'Formato inválido.' });
  }
  const { rowCount } = await pool.query(
    'UPDATE submissions SET shapes_json=$1, project_json=NULL, updated_at=now() WHERE id=$2',
    [shapes_json, req.params.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Submissão não encontrada.' });
  res.json({ ok: true });
}));

module.exports = router;
