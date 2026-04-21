// Notes routes — tree notes CRUD
import { Router } from 'express';
import { notesController } from '../controllers/notes.controller';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/:treeId/notes', auth, notesController.getNotes);
router.post('/:treeId/notes', auth, notesController.addNote);
router.delete('/:treeId/notes/:noteId', auth, notesController.deleteNote);

export default router;
