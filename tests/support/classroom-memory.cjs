// Test-only database double. Requests still traverse the real Express routes,
// authentication and format validation. Never used by server/src/index.js.
const crypto = require('node:crypto');
function createMemoryAPI() {
  process.env.JWT_SECRET = 'explora-test-only-not-a-production-secret';
  const bcrypt = require('../../server/node_modules/bcryptjs');
  const { pool } = require('../../server/src/db');
  const teacher = { id: crypto.randomUUID(), email: 'professor@example.test', password_hash: bcrypt.hashSync('teste123', 4), is_superadmin: false };
  const teachers = [teacher];
  const activities = [], submissions = [];
  pool.query = async (sql, p = []) => {
    sql = sql.replace(/\s+/g, ' ').trim();
    const result = rows => ({ rows, rowCount: rows.length });
    if (sql.startsWith('SELECT * FROM teachers') || sql.startsWith('SELECT id FROM teachers')) return result(teachers.filter(item => item.email === p[0]));
    if (sql.startsWith('INSERT INTO teachers')) {
      if (teachers.some(item => item.email === p[1])) return result([]);
      const created = { id: p[0], email: p[1], password_hash: p[2], is_superadmin: false };
      teachers.push(created); return result([created]);
    }
    if (sql.startsWith('SELECT 1 FROM activities')) return result(activities.filter(a => a.classroom_code === p[0]));
    if (sql.startsWith('INSERT INTO activities')) {
      const a = { id: p[0], teacher_id: p[1], classroom_code: p[2], title: p[3], brief: p[4], app_id: p[5], created_at: new Date().toISOString() };
      activities.push(a); return result([a]);
    }
    if (sql.startsWith('SELECT a.id, a.classroom_code')) return result(activities.filter(a => a.teacher_id === p[0] && a.app_id === p[1]).map(a => ({ ...a, submission_count: submissions.filter(s => s.activity_id === a.id).length })));
    if (sql.includes('FROM activities WHERE classroom_code=$1')) return result(activities.filter(a => a.classroom_code === p[0]));
    if (sql.startsWith('SELECT id, shapes_json, project_json')) return result(submissions.filter(s => s.activity_id === p[0] && s.student_name.toLowerCase() === p[1].toLowerCase() && s.student_pin === p[2]));
    if (sql.startsWith('INSERT INTO submissions')) {
      const s = { id: p[0], activity_id: p[1], student_name: p[2], student_pin: p[3], shapes_json: { version: 1, nextId: 1, shapes: [] }, project_json: null, submitted_project_json: null, submitted_at: null, updated_at: new Date().toISOString() };
      submissions.push(s); return result([s]);
    }
    if (sql.startsWith('SELECT a.app_id FROM submissions')) return result(submissions.filter(s => s.id === p[0]).map(s => ({ app_id: activities.find(a => a.id === s.activity_id).app_id })));
    if (sql.startsWith('UPDATE submissions SET project_json')) {
      const s = submissions.find(s => s.id === p[2]);
      s.project_json = structuredClone(p[0]); s.updated_at = new Date().toISOString();
      if (p[3]) s.shapes_json = structuredClone(p[0].data);
      if (p[1]) { s.submitted_project_json = structuredClone(p[0]); s.submitted_at = s.updated_at; }
      return result([s]);
    }
    if (sql.startsWith('SELECT id FROM activities WHERE id=$1 AND teacher_id=$2')) return result(activities.filter(a => a.id === p[0] && a.teacher_id === p[1]));
    if (sql.startsWith('SELECT id, student_name, updated_at')) return result(submissions.filter(s => s.activity_id === p[0]));
    if (sql.startsWith('SELECT s.*, a.app_id FROM submissions')) return result(submissions.filter(s => s.id === p[0] && activities.some(a => a.id === s.activity_id && a.teacher_id === p[1])).map(s => ({ ...s, app_id: activities.find(a => a.id === s.activity_id).app_id })));
    if (sql.startsWith('UPDATE submissions SET shapes_json')) {
      const s = submissions.find(s => s.id === p[1]); if (!s) return result([]);
      s.shapes_json = p[0]; s.project_json = null; return result([s]);
    }
    throw new Error('Unhandled test query: ' + sql);
  };
  return { app: require('../../server/src/app'), teacher, teachers, activities, submissions };
}
module.exports = { createMemoryAPI };
if (require.main === module) {
  const { app } = createMemoryAPI();
  const port = Number(process.env.PORT || 3002);
  app.listen(port, '127.0.0.1', () => console.log('Local test-only classroom API on port ' + port));
}
