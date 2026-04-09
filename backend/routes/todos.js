const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// GET /todos — Ambil semua todo (with search & filter)
router.get('/', async (req, res) => {
  try {
    const { search, priority, category, status } = req.query;
    let filter = {};

    // Search by title or description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by priority
    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      filter.priority = priority;
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by status
    if (status === 'active') {
      filter.isCompleted = false;
    } else if (status === 'completed') {
      filter.isCompleted = true;
    }

    const todos = await Todo.find(filter).sort({ createdAt: -1 });

    // Get stats
    const allTodos = await Todo.find();
    const stats = {
      total: allTodos.length,
      completed: allTodos.filter((t) => t.isCompleted).length,
      active: allTodos.filter((t) => !t.isCompleted).length,
      highPriority: allTodos.filter((t) => t.priority === 'high' && !t.isCompleted).length,
      overdue: allTodos.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && !t.isCompleted
      ).length,
    };

    // Get unique categories
    const categories = [...new Set(allTodos.map((t) => t.category).filter(Boolean))];

    res.json({
      success: true,
      count: todos.length,
      stats,
      categories,
      data: todos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data todos',
      error: error.message,
    });
  }
});

// POST /todos — Tambah todo baru
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, category, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title wajib diisi',
      });
    }

    const todo = await Todo.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority || 'medium',
      category: category ? category.trim() : 'General',
      dueDate: dueDate || null,
    });

    res.status(201).json({
      success: true,
      message: 'Todo berhasil ditambahkan',
      data: todo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan todo',
      error: error.message,
    });
  }
});

// PUT /todos/:id — Edit todo
router.put('/:id', async (req, res) => {
  try {
    const { title, description, isCompleted, priority, category, dueDate } = req.body;

    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo tidak ditemukan',
      });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Title tidak boleh kosong',
        });
      }
      todo.title = title.trim();
    }
    if (description !== undefined) todo.description = description.trim();
    if (isCompleted !== undefined) todo.isCompleted = isCompleted;
    if (priority !== undefined) todo.priority = priority;
    if (category !== undefined) todo.category = category.trim();
    if (dueDate !== undefined) todo.dueDate = dueDate;

    const updatedTodo = await todo.save();

    res.json({
      success: true,
      message: 'Todo berhasil diupdate',
      data: updatedTodo,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'ID todo tidak valid',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate todo',
      error: error.message,
    });
  }
});

// DELETE /todos/:id — Hapus todo
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo tidak ditemukan',
      });
    }

    res.json({
      success: true,
      message: 'Todo berhasil dihapus',
      data: todo,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'ID todo tidak valid',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus todo',
      error: error.message,
    });
  }
});

// DELETE /todos — Bulk delete completed
router.delete('/', async (req, res) => {
  try {
    const result = await Todo.deleteMany({ isCompleted: true });
    res.json({
      success: true,
      message: `${result.deletedCount} todo selesai berhasil dihapus`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus todos',
      error: error.message,
    });
  }
});

// PUT /todos — Bulk update (mark all complete/incomplete)
router.patch('/bulk/toggle', async (req, res) => {
  try {
    const { isCompleted } = req.body;
    const result = await Todo.updateMany({}, { isCompleted });
    res.json({
      success: true,
      message: isCompleted ? 'Semua todo ditandai selesai' : 'Semua todo dibuka kembali',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate todos',
      error: error.message,
    });
  }
});

module.exports = router;
