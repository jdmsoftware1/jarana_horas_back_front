import express from 'express';
import { AbsenceCategory } from '../models/index.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all absence categories
router.get('/', authenticateToken, async (req, res) => {
  try {
    const categories = await AbsenceCategory.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching absence categories:', error);
    res.status(500).json({ error: 'Error al obtener las categorías de ausencias' });
  }
});

// Get all categories (including inactive) - Admin only
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const categories = await AbsenceCategory.findAll({
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching all absence categories:', error);
    res.status(500).json({ error: 'Error al obtener las categorías de ausencias' });
  }
});

// Get single category
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const category = await AbsenceCategory.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching absence category:', error);
    res.status(500).json({ error: 'Error al obtener la categoría' });
  }
});

// Create new category - Admin only
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      code,
      color,
      icon,
      requiresApproval,
      isPaid,
      maxDaysPerYear,
      isActive,
      sortOrder
    } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({ error: 'Nombre y código son requeridos' });
    }

    // Check if code already exists
    const existingCategory = await AbsenceCategory.findOne({ where: { code } });
    if (existingCategory) {
      return res.status(400).json({ error: 'Ya existe una categoría con ese código' });
    }

    const category = await AbsenceCategory.create({
      name,
      description,
      code: code.toUpperCase().replace(/\s+/g, '_'),
      color: color || '#3B82F6',
      icon: icon || '📅',
      requiresApproval: requiresApproval !== undefined ? requiresApproval : true,
      isPaid,
      maxDaysPerYear,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0,
      isSystem: false
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating absence category:', error);
    res.status(500).json({ error: 'Error al crear la categoría' });
  }
});

// Update category - Admin only
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const category = await AbsenceCategory.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const {
      name,
      description,
      code,
      color,
      icon,
      requiresApproval,
      isPaid,
      maxDaysPerYear,
      isActive,
      sortOrder
    } = req.body;

    // If trying to update code, check it doesn't exist
    if (code && code !== category.code) {
      const existingCategory = await AbsenceCategory.findOne({ 
        where: { code: code.toUpperCase().replace(/\s+/g, '_') } 
      });
      if (existingCategory) {
        return res.status(400).json({ error: 'Ya existe una categoría con ese código' });
      }
    }

    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      code: code ? code.toUpperCase().replace(/\s+/g, '_') : category.code,
      color: color || category.color,
      icon: icon || category.icon,
      requiresApproval: requiresApproval !== undefined ? requiresApproval : category.requiresApproval,
      isPaid: isPaid !== undefined ? isPaid : category.isPaid,
      maxDaysPerYear: maxDaysPerYear !== undefined ? maxDaysPerYear : category.maxDaysPerYear,
      isActive: isActive !== undefined ? isActive : category.isActive,
      sortOrder: sortOrder !== undefined ? sortOrder : category.sortOrder
    });

    res.json(category);
  } catch (error) {
    console.error('Error updating absence category:', error);
    res.status(500).json({ error: 'Error al actualizar la categoría' });
  }
});

// Delete category - Admin only (only non-system categories)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const category = await AbsenceCategory.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    if (category.isSystem) {
      return res.status(400).json({ error: 'No se pueden eliminar categorías del sistema' });
    }

    // Check if category is being used
    const { Vacation } = await import('../models/index.js');
    const usageCount = await Vacation.count({ where: { categoryId: category.id } });
    
    if (usageCount > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar la categoría porque está siendo usada en ${usageCount} ausencia(s)` 
      });
    }

    await category.destroy();
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting absence category:', error);
    res.status(500).json({ error: 'Error al eliminar la categoría' });
  }
});

// Initialize default categories - Admin only
router.post('/initialize-defaults', authenticateToken, isAdmin, async (req, res) => {
  try {
    const defaultCategories = AbsenceCategory.getDefaultCategories();
    const created = [];
    const skipped = [];

    for (const categoryData of defaultCategories) {
      const existing = await AbsenceCategory.findOne({ where: { code: categoryData.code } });
      
      if (!existing) {
        const category = await AbsenceCategory.create(categoryData);
        created.push(category);
      } else {
        skipped.push(categoryData.code);
      }
    }

    res.json({
      message: 'Categorías inicializadas',
      created: created.length,
      skipped: skipped.length,
      categories: created
    });
  } catch (error) {
    console.error('Error initializing default categories:', error);
    res.status(500).json({ error: 'Error al inicializar categorías por defecto' });
  }
});

export default router;
