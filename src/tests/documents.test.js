/**
 * Tests para gestión de documentos
 */
import { describe, it, expect, beforeAll } from 'vitest';
import sequelize from '../config/database.js';

describe('Documents Tests', () => {
  let Document, Employee;
  
  beforeAll(async () => {
    await sequelize.authenticate();
    const models = await import('../models/index.js');
    Document = models.Document;
    Employee = models.Employee;
  });

  it('debe listar documentos existentes', async () => {
    const docs = await Document.findAll({ limit: 10 });
    console.log(`\nDocumentos en sistema: ${docs.length}`);
    docs.forEach(d => console.log(`  - ${d.title} (${d.documentType})`));
    expect(docs).toBeDefined();
  });

  it('debe verificar estructura de documentos', async () => {
    const doc = await Document.findOne();
    if (doc) {
      expect(doc).toHaveProperty('title');
      expect(doc).toHaveProperty('documentType');
      expect(doc).toHaveProperty('senderId');
      expect(doc).toHaveProperty('recipientId');
      console.log(`\nEstructura OK: ${doc.title}`);
    }
  });

  it('debe contar documentos por tipo', async () => {
    const types = ['nomina', 'contrato', 'certificado', 'otro'];
    console.log('\nDocumentos por tipo:');
    for (const type of types) {
      const count = await Document.count({ where: { documentType: type } });
      console.log(`  ${type}: ${count}`);
    }
  });

  it('debe contar documentos por estado', async () => {
    // Obtener estados válidos de la BD
    try {
      const [results] = await sequelize.query(`
        SELECT unnest(enum_range(NULL::enum_documents_status)) as status
      `);
      console.log('\nDocumentos por estado:');
      for (const row of results) {
        const count = await Document.count({ where: { status: row.status } });
        console.log(`  ${row.status}: ${count}`);
      }
    } catch (e) {
      // Fallback: contar sin filtro
      const total = await Document.count();
      console.log(`\nTotal documentos: ${total}`);
    }
  });

  it('debe verificar documentos pendientes por empleado', async () => {
    const employees = await Employee.findAll({ where: { isActive: true }, limit: 5 });
    console.log('\nDocumentos pendientes:');
    for (const emp of employees) {
      const pending = await Document.count({ 
        where: { recipientId: emp.id, status: 'pending' } 
      });
      if (pending > 0) console.log(`  ${emp.name}: ${pending} pendientes`);
    }
  });
});
