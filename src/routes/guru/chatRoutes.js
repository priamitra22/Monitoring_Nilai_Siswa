import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import {
  getConversations,
  getMessages,
  sendMessage,
  getSiswaForNewChat,
  createConversation
} from '../../controllers/guru/chatController.js';

const router = Router();

router.use(authMiddleware);

router.get('/conversations', getConversations);

router.post('/conversations', createConversation);

router.get('/conversations/:id/messages', getMessages);


router.post('/conversations/:id/messages', sendMessage);

router.get('/siswa', getSiswaForNewChat);

export default router;

