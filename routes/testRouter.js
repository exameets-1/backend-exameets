import express from "express";
const router = express.Router();

router.get('/test-logging', (req, res) => {
    res.json({
        success: true,
        message: 'Test route working'
    });
});

export default router;
